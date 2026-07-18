import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient, forTenant, TenantScopedClient } from "@peopleflow/database";

/**
 * Acesso a dados do plano de controle + fábrica de clients por tenant.
 *
 * Implementa o contrato `TenantAwareDatabase` (doc 03 §2) para a
 * Estratégia A (coluna). Estratégias B/C entram como novos branches em
 * `forTenantId` sem mudança nos consumidores.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Client escopado — módulos de negócio usam SOMENTE este. */
  forTenantId(tenantId: string): TenantScopedClient {
    return forTenant(this, tenantId);
  }
}
