import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Contexto do tenant/usuário da requisição corrente (doc 03 §2).
 *
 * Preenchido pelo JwtAuthGuard e disponível em qualquer camada via
 * AsyncLocalStorage — sem passar parâmetro manualmente.
 */
export interface RequestContext {
  tenantId: string;
  userId: string;
  sessionId: string;
  roles: string[];
  traceId: string;
}

@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(ctx: RequestContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  /**
   * Fixa o contexto no async scope corrente — usado pelo JwtAuthGuard, que
   * não envolve o restante do pipeline em um callback.
   */
  enterWith(ctx: RequestContext): void {
    this.als.enterWith(ctx);
  }

  /** Retorna o contexto corrente ou lança — rotas autenticadas sempre têm um. */
  get(): RequestContext {
    const ctx = this.als.getStore();
    if (!ctx) {
      throw new Error(
        "RequestContext ausente — rota autenticada sem contexto de tenant",
      );
    }
    return ctx;
  }

  maybe(): RequestContext | undefined {
    return this.als.getStore();
  }
}
