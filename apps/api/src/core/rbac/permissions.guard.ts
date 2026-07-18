import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { REQUIRED_PERMISSION_KEY } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import type { RequestContext } from "../tenants/tenant-context";

/**
 * Enforcement RBAC na borda (doc 05 §2): rotas anotadas com
 * @RequirePermission("module.resource.action") exigem que algum papel do
 * usuário carregue a permissão. Condições ABAC (CASL) entram na Fase 2,
 * aplicadas dentro dos casos de uso.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { pfContext?: RequestContext }>();
    const ctx = request.pfContext;
    if (!ctx) throw new ForbiddenException("Sem contexto de autenticação");

    const count = await this.prisma.rolePermission.count({
      where: {
        tenantId: ctx.tenantId,
        permission: { key: required },
        role: { userRoles: { some: { userId: ctx.userId } } },
      },
    });
    if (count === 0) {
      throw new ForbiddenException(`Permissão necessária: ${required}`);
    }
    return true;
  }
}
