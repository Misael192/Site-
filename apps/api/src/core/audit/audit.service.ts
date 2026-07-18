import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  tenantId: string;
  actorId?: string | null;
  action: string; // ex.: "auth.login.success", "core.tenant.provisioned"
  resource: string; // ex.: "users:<id>"
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  traceId?: string | null;
}

/**
 * Trilha de auditoria (doc 05 §6) — append-only.
 * Toda mutação relevante e todo evento de segurança passam por aqui.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        actorId: entry.actorId ?? null,
        action: entry.action,
        resource: entry.resource,
        before: entry.before === undefined ? undefined : (entry.before as object),
        after: entry.after === undefined ? undefined : (entry.after as object),
        ip: entry.ip ?? null,
        traceId: entry.traceId ?? null,
      },
    });
  }
}
