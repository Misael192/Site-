import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthTokens, MeResponse } from "@peopleflow/contracts";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { loadEnv } from "../../config/env";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Autenticação (ADR-008, doc 05 §1):
 *  • access JWT RS256 de vida curta com claims sub/tid/sid/roles;
 *  • refresh token OPACO, hasheado no banco, ROTATIVO por família;
 *  • reuso de refresh antigo ⇒ revogação da família inteira (roubo detectado).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async issueTokens(params: {
    tenantId: string;
    userId: string;
    roles: string[];
    family?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<AuthTokens> {
    const env = loadEnv();
    const refreshToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.refreshTokenTtlDays);

    const session = await this.prisma.session.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        refreshTokenHash: this.hashToken(refreshToken),
        family: params.family ?? randomUUID(),
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        expiresAt,
      },
    });

    const accessToken = await this.jwt.signAsync({
      sub: params.userId,
      tid: params.tenantId,
      sid: session.id,
      roles: params.roles,
    });

    return { accessToken, refreshToken, expiresInSeconds: 15 * 60 };
  }

  private async loadRoles(tenantId: string, userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { tenantId, userId },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.slug);
  }

  async login(input: {
    tenantSlug: string;
    email: string;
    password: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<AuthTokens> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });
    // mensagem genérica sempre — não revelar se tenant/usuário existem
    const invalid = new UnauthorizedException("Credenciais inválidas");
    if (!tenant || tenant.status !== "ACTIVE") throw invalid;

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: input.email.toLowerCase() },
      },
    });
    if (!user?.passwordHash || user.status !== "ACTIVE") throw invalid;

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) {
      await this.audit.log({
        tenantId: tenant.id,
        action: "auth.login.failed",
        resource: `users:${user.id}`,
        ip: input.ip,
      });
      throw invalid;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const roles = await this.loadRoles(tenant.id, user.id);
    await this.audit.log({
      tenantId: tenant.id,
      actorId: user.id,
      action: "auth.login.success",
      resource: `users:${user.id}`,
      ip: input.ip,
    });
    return this.issueTokens({
      tenantId: tenant.id,
      userId: user.id,
      roles,
      ip: input.ip,
      userAgent: input.userAgent,
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });
    if (!session) throw new UnauthorizedException("Sessão inválida");

    if (session.revokedAt) {
      // Reuso de token já rotacionado = provável roubo → derruba a família
      await this.prisma.session.updateMany({
        where: { family: session.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.log({
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "auth.refresh.reuse_detected",
        resource: `sessions:${session.id}`,
      });
      throw new UnauthorizedException("Sessão revogada");
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException("Sessão expirada");
    }

    // rotação: revoga o token usado e emite um novo na MESMA família
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const roles = await this.loadRoles(session.tenantId, session.userId);
    return this.issueTokens({
      tenantId: session.tenantId,
      userId: session.userId,
      roles,
      family: session.family,
    });
  }

  async logout(sessionId: string, tenantId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, tenantId },
      data: { revokedAt: new Date() },
    });
  }

  async me(tenantId: string, userId: string): Promise<MeResponse> {
    const [user, tenant, userRoles, tenantModules] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.prisma.userRole.findMany({
        where: { tenantId, userId },
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      }),
      this.prisma.tenantModule.findMany({
        where: { tenantId, enabled: true },
      }),
    ]);

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) permissions.add(rp.permission.key);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId,
      tenantSlug: tenant.slug,
      roles: userRoles.map((ur) => ur.role.slug),
      permissions: [...permissions].sort(),
      enabledModules: tenantModules.map((tm) => tm.moduleSlug).sort(),
    };
  }
}
