/**
 * Ponto único de acesso ao Prisma no monorepo.
 *
 * Módulos de negócio NUNCA instanciam PrismaClient diretamente — eles recebem
 * um client já escopado ao tenant via `TenantAwareDatabase` (doc 03 §2).
 * A extensão abaixo implementa a Estratégia A (tenant por coluna): injeta
 * `tenantId` em todas as queries/escritas dos modelos tenant-scoped.
 */
import { Prisma, PrismaClient } from "@prisma/client";

export * from "@prisma/client";

/**
 * Modelos do plano de controle (globais) — os únicos SEM tenant_id (doc 03 §4).
 * Tudo que não estiver nesta lista é tenant-scoped e recebe filtro automático.
 */
const GLOBAL_MODELS = new Set<string>([
  "Tenant",
  "TenantDataSource",
  "Plan",
  "PlatformModule",
  "FeatureFlag",
  "PlatformUser",
]);

/**
 * Cria um client Prisma escopado a um tenant (Estratégia A — coluna + RLS).
 *
 * Defesa em duas camadas (ADR-005):
 *  1. esta extensão injeta o filtro/valor de tenantId em toda operação;
 *  2. RLS no Postgres bloqueia qualquer query que escape da extensão.
 */
export function forTenant(prisma: PrismaClient, tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || GLOBAL_MODELS.has(model)) return query(args);

          const a = args as Record<string, unknown>;
          if (
            operation === "create" ||
            operation === "upsert" ||
            operation === "createMany"
          ) {
            const injectData = (data: unknown): unknown =>
              Array.isArray(data)
                ? data.map((d) => ({ ...(d as object), tenantId }))
                : { ...(data as object), tenantId };
            if ("data" in a) a.data = injectData(a.data);
            if ("create" in a) a.create = injectData(a.create);
            if ("update" in a) a.update = { ...(a.update as object) };
          }
          if ("where" in a || operation.startsWith("find") || operation.includes("Many")) {
            a.where = { ...((a.where as object) ?? {}), tenantId };
          }
          return query(a);
        },
      },
    },
  });
}

export type TenantScopedClient = ReturnType<typeof forTenant>;

/** Client "cru" — uso restrito ao plano de controle e ao provisioning. */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}
