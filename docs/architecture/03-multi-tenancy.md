# 03 — Multi-tenancy

> Decisões relacionadas: ADR-005 (estratégia evolutiva de tenancy), ADR-006 (PostgreSQL + RLS).

## 1. Requisito (item 2 da aprovação)

O sistema deve estar preparado para **três estratégias de isolamento**, permitindo migração de empresas Enterprise **sem reescrever o sistema**:

```
Tenant por Coluna  →  Tenant por Schema  →  Tenant por Banco
```

## 2. A chave: isolar a estratégia atrás de uma abstração

Nenhum caso de uso, controller ou repository conhece a estratégia física. Todos dependem de dois contratos do Core/Tenants:

```ts
// packages — Core/Tenants (contratos públicos)

/** Contexto imutável da requisição corrente, resolvido pelo middleware. */
interface TenantContext {
  tenantId: string;
  organizationId: string;
  isolationMode: 'row' | 'schema' | 'database';
  /** identificadores físicos resolvidos — opacos para os módulos */
  dataSourceKey: string;   // qual pool/conexão usar
  schemaName?: string;     // quando isolationMode = 'schema'
}

/** Fábrica de acesso a dados ciente do tenant. Módulos NUNCA instanciam PrismaClient. */
interface TenantAwareDatabase {
  client(ctx: TenantContext): PrismaClientLike; // já escopado ao tenant
}
```

### Resolução do tenant (middleware do API Gateway)

1. Extrai o tenant do **subdomínio** (`acme.peopleflow.app`), do claim `tid` do JWT, ou do header `X-Tenant-Id` (somente para API keys server-to-server).
2. Carrega o registro do tenant (cacheado em Redis, TTL 60s): estratégia de isolamento, status, entitlements.
3. Constrói o `TenantContext` e o injeta via `AsyncLocalStorage` (CLS) — disponível em qualquer camada sem passar parâmetro manualmente.
4. Requisições sem tenant válido são rejeitadas antes de tocar qualquer módulo.

## 3. As três estratégias

### Estratégia A — Tenant por coluna (padrão de lançamento)

- Toda tabela de dados de negócio tem `tenant_id UUID NOT NULL` + índices compostos `(tenant_id, ...)`.
- **Prisma Client Extension** injeta `where: { tenantId }` em toda query e `data: { tenantId }` em toda escrita — o filtro é automático e não depende de disciplina do desenvolvedor.
- **PostgreSQL Row-Level Security (RLS)** como segunda linha de defesa: a conexão executa `SET app.tenant_id = $1` e políticas RLS garantem que, mesmo com um bug na aplicação, uma query jamais retorna dados de outro tenant.

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Estratégia B — Tenant por schema

- Tenants "quentes" ou com requisito contratual médio migram para um schema PostgreSQL próprio (`tenant_acme.*`).
- O mesmo schema Prisma é aplicado por migração em cada schema; o `TenantAwareDatabase` seleciona a conexão com `search_path` adequado.
- Migração A→B: job de provisioning copia dados do tenant (transacional, com janela de somente leitura), valida contagem/checksums, troca o `isolationMode` no registro do tenant e invalida caches.

### Estratégia C — Tenant por banco (Enterprise)

- Banco dedicado (ou cluster dedicado) por tenant; `dataSourceKey` aponta para o pool específico (registro em `tenant_data_sources`).
- Permite requisitos Enterprise: residência de dados, backup/restore individual, tuning e criptografia por cliente.

### Comparativo e justificativa (ADR-005)

| Critério | Coluna | Schema | Banco |
|----------|--------|--------|-------|
| Custo por tenant | ~zero | baixo | alto |
| Isolamento | lógico (RLS) | forte | máximo |
| Migrations | 1 execução | N execuções | N execuções |
| Backup individual | difícil | possível | trivial |
| Adequado para | SMB (maioria) | mid-market | Enterprise |

- **Justificativa:** começar por coluna maximiza densidade e minimiza custo operacional no estágio 1–1.000 empresas; RLS elimina o principal risco (vazamento entre tenants). Como toda a plataforma acessa dados via `TenantAwareDatabase`, subir um tenant de estratégia é uma operação de dados + configuração — **zero mudança de código de módulo**, cumprindo o requisito.
- **Alternativas consideradas:** schema-per-tenant desde o início (rejeitado: 10.000 schemas tornam migrations e connection pooling proibitivos para a maioria SMB); banco-per-tenant universal (rejeitado: custo inviável); tenancy só na aplicação sem RLS (rejeitado: uma linha de código errada vira incidente LGPD).

## 4. Regras transversais de tenancy

- **Cache:** toda chave Redis é prefixada `t:{tenantId}:...`.
- **Filas:** todo job carrega `tenantId` no payload; workers reconstroem o `TenantContext` antes de executar.
- **Arquivos:** paths de storage são particionados por tenant (`{tenantId}/{module}/...`).
- **Logs/traces:** `tenant_id` é atributo obrigatório (doc 07).
- **Tabelas globais** (sem `tenant_id`): apenas as do plano de controle — `tenants`, `plans`, `modules`, `feature_flags` (definições) e usuários de plataforma.
