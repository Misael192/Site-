import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { randomUUID } from "node:crypto";
import { IS_PUBLIC_KEY } from "./decorators";
import { TenantContextService } from "../tenants/tenant-context";

interface AccessTokenClaims {
  sub: string; // userId
  tid: string; // tenantId
  sid: string; // sessionId — permite revogação real (ADR-008)
  roles: string[];
}

/**
 * Guard global de autenticação: valida o Bearer JWT (RS256) e inicializa
 * o RequestContext. Rotas @Public() são liberadas sem token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException("Token ausente");

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    const ctx = {
      tenantId: claims.tid,
      userId: claims.sub,
      sessionId: claims.sid,
      roles: claims.roles ?? [],
      traceId: (request.headers["x-request-id"] as string) ?? randomUUID(),
    };
    // anexa ao request (para interceptors) e ao ALS (para services)
    (request as Request & { pfContext: typeof ctx }).pfContext = ctx;
    this.tenantContext.enterWith(ctx);
    return true;
  }
}
