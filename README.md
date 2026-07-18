# PeopleFlow Platform

Plataforma HCM (DP + RH) multi-tenant — monorepo com Next.js 15, NestJS, PostgreSQL/Prisma e Design System próprio (Flow UI).

> 📐 **Arquitetura:** toda a documentação (visão, multi-tenancy, segurança, eventos, workflow engine, IA, ADRs) está em [`docs/architecture/`](./docs/architecture/README.md).
>
> ℹ️ O arquivo `Index.html` na raiz é o site institucional SR Facilities pré-existente neste repositório e não faz parte da plataforma.

## Estrutura

```
apps/
  web/        Next.js 15 — landing + portais (Admin, RH, DP, Gestor, Colaborador)
  api/        NestJS — Core (Identity/IAM/RBAC/Tenants/Events/Audit) + módulos
packages/
  ui/         Flow UI — Design System (tokens, componentes, temas claro/escuro)
  database/   Schema Prisma (71 tabelas), migrations e seeds
  contracts/  Contratos compartilhados API ↔ web (tipos, códigos de erro)
  events/     Envelope e catálogo de eventos de domínio
  config/     tsconfigs compartilhados
docs/
  architecture/  Documento de arquitetura da Fase 1 + ADRs
```

## Rodando localmente

```bash
pnpm install
docker compose up -d                 # Postgres 16 + Redis + MinIO
cp .env.example .env                 # ajuste se necessário

pnpm db:generate                     # Prisma Client
pnpm --filter @peopleflow/database db:push   # aplica o schema (dev)
pnpm db:seed                         # módulos, permissões e planos

pnpm build                           # build de todos os pacotes
pnpm dev                             # web em :3000, API em :3001
```

- API + OpenAPI/Swagger: `http://localhost:3001/api/docs`
- Health checks: `/health/live` e `/health/ready`
- Fluxo de teste: `POST /api/v1/auth/signup` provisiona tenant completo (organização, empresa, papéis padrão com RBAC, assinatura trial e módulos do plano) e autentica.

## Estado atual (Fase 1 — fundação)

| Entregue | Descrição |
|----------|-----------|
| ✅ Documento de arquitetura | 16 docs + 14 ADRs com justificativas (`docs/architecture/`) |
| ✅ Monorepo | pnpm + Turborepo, builds verificados |
| ✅ Schema completo | Todas as entidades do doc 04 (Core + módulos), UUID v7, snake_case |
| ✅ Multi-tenancy (Estratégia A) | `tenant_id` + extensão Prisma que injeta o filtro automaticamente |
| ✅ Auth | Argon2id, JWT RS256, refresh rotativo com detecção de reuso (revoga a família) |
| ✅ RBAC | Catálogo `module.resource.action`, papéis padrão no provisioning, guard global |
| ✅ Eventos | Envelope versionado + Outbox Pattern + dispatcher in-process |
| ✅ Auditoria | `audit_logs` com eventos de segurança |
| ✅ API | `/api/v1`, OpenAPI, erros RFC 9457, validação com whitelist |
| ✅ Web | Landing, login/signup, shells dos 5 portais, tema claro/escuro |
| 🔜 Próximo | RLS por migration SQL, Redis (cache/rate limit), MFA TOTP, Storybook, CI |

Roadmap completo: [`docs/architecture/14-roadmap.md`](./docs/architecture/14-roadmap.md).
