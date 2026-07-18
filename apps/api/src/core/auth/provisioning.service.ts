import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { createDomainEvent } from "@peopleflow/events";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxService } from "../events/outbox.service";
import type { SignupDto } from "./dto";

/**
 * Provisioning de tenant (doc 14 — Fase 1, critério de aceite).
 *
 * Cria em UMA transação: tenant → organization → company → papéis padrão
 * (com permissões) → usuário admin → assinatura trial no plano starter →
 * módulos do plano → evento `core.tenant.provisioned` (via outbox).
 */
@Injectable()
export class ProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  /** Papéis padrão e o filtro de permissões de cada um (doc 05 §2). */
  private static readonly DEFAULT_ROLES: Array<{
    slug: string;
    name: string;
    filter: (key: string) => boolean;
  }> = [
    { slug: "admin", name: "Administrador", filter: () => true },
    {
      slug: "hr",
      name: "RH",
      filter: (k) =>
        /^(people|recruitment|benefits|performance|learning|engagement|documents|analytics|ai)\./.test(k),
    },
    {
      slug: "dp",
      name: "Departamento Pessoal",
      filter: (k) => /^(people|documents|analytics|payroll)\./.test(k),
    },
    {
      slug: "manager",
      name: "Gestor",
      filter: (k) =>
        [
          "people.employee.read",
          "people.vacation.approve",
          "people.time.adjust.approve",
          "people.time.reports",
          "documents.file.read",
          "analytics.dashboard.read",
          "ai.chat.use",
        ].includes(k),
    },
    {
      slug: "employee",
      name: "Colaborador",
      filter: (k) =>
        [
          "people.vacation.request",
          "people.time.record",
          "people.time.adjust.request",
          "documents.file.read",
          "documents.signature.sign",
          "learning.course.attend",
          "payroll.payslip.read.own",
        ].includes(k),
    },
  ];

  async provisionTenant(input: SignupDto): Promise<{ tenantId: string; userId: string }> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });
    if (existing) throw new ConflictException("Este subdomínio já está em uso");

    const starterPlan = await this.prisma.plan.findUnique({
      where: { slug: "starter" },
    });
    if (!starterPlan) {
      throw new BadRequestException(
        "Plano padrão ausente — execute o seed do plano de controle (pnpm db:seed)",
      );
    }

    const permissions = await this.prisma.permission.findMany();
    const passwordHash = await argon2.hash(input.adminPassword, {
      type: argon2.argon2id,
    });

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { slug: input.tenantSlug, name: input.organizationName, status: "ACTIVE" },
      });

      const organization = await tx.organization.create({
        data: { tenantId: tenant.id, name: input.organizationName },
      });
      await tx.company.create({
        data: {
          tenantId: tenant.id,
          organizationId: organization.id,
          legalName: input.companyName,
        },
      });

      // papéis padrão + vínculo de permissões
      const roleIdBySlug = new Map<string, string>();
      for (const role of ProvisioningService.DEFAULT_ROLES) {
        const created = await tx.role.create({
          data: {
            tenantId: tenant.id,
            slug: role.slug,
            name: role.name,
            system: true,
          },
        });
        roleIdBySlug.set(role.slug, created.id);
        const granted = permissions.filter((p) => role.filter(p.key));
        if (granted.length > 0) {
          await tx.rolePermission.createMany({
            data: granted.map((p) => ({
              tenantId: tenant.id,
              roleId: created.id,
              permissionId: p.id,
            })),
          });
        }
      }

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.adminEmail.toLowerCase(),
          name: input.adminName,
          passwordHash,
        },
      });
      await tx.userRole.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: roleIdBySlug.get("admin")!,
        },
      });

      // assinatura trial + módulos do plano (docs 08 e 09)
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 14);
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialEndsAt: periodEnd,
        },
      });
      const entitlements = starterPlan.entitlements as { modules?: string[] };
      await tx.tenantModule.createMany({
        data: (entitlements.modules ?? []).map((slug) => ({
          tenantId: tenant.id,
          moduleSlug: slug,
          source: "plan",
        })),
      });

      await this.outbox.append(
        tx,
        createDomainEvent({
          name: "core.tenant.provisioned",
          tenantId: tenant.id,
          actorId: user.id,
          correlationId: randomUUID(),
          payload: { tenantSlug: tenant.slug, planSlug: starterPlan.slug },
        }),
      );

      return { tenantId: tenant.id, userId: user.id };
    });
  }
}
