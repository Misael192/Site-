# 02 — Arquitetura da Plataforma

> Decisões relacionadas: ADR-001 (monorepo), ADR-003 (NestJS), ADR-004 (modular monolith), ADR-002 (Next.js 15).

## 1. Topologia: Core + Modules (requisito 1 da aprovação)

```
PeopleFlow Platform
│
├── Core                        # capacidades de plataforma — nunca contêm regra de negócio de RH/DP
│   ├── Identity                # usuários, credenciais, MFA, sessões, OAuth accounts
│   ├── IAM                     # autenticação, tokens, API keys, políticas de acesso
│   ├── RBAC                    # roles, permissions, permission groups, ABAC (atributos)
│   ├── Organizations           # organizations → companies → branches → departments → teams → positions → cost centers
│   ├── Tenants                 # resolução, contexto, estratégia de isolamento, provisioning
│   ├── Billing                 # plans, subscriptions, invoices, limites, entitlements
│   ├── Notifications           # in-app, e-mail, push; templates e preferências
│   ├── Audit                   # trilha imutável de tudo que muda estado
│   ├── Files                   # storage abstrato (Supabase/S3), versões, permissões, URLs assinadas
│   ├── AI                      # AI Engine: chat, prompt library, KB, embeddings, RAG, agents, memory, tools, logs
│   ├── Workflow Engine         # templates, instâncias, histórico, nós (condição/aprovação/documento/assinatura)
│   └── API Gateway             # versionamento, rate limit, autenticação, roteamento p/ módulos
│
└── Modules                     # domínios de negócio — plugáveis, ativados por feature flag/plano
    ├── People                  # colaboradores, admissão digital, férias, ponto/jornada
    ├── Payroll                 # folha, holerites, eSocial (fase futura)
    ├── Recruitment             # vagas, Trabalhe Conosco, pipeline, candidatos
    ├── Benefits                # benefícios, convênios, utilização
    ├── Learning                # treinamentos, cursos, certificados
    ├── Performance             # metas, avaliações, competências, plano de carreira
    ├── Documents               # GED sobre Core/Files (versões, assinatura, compartilhamento)
    ├── Analytics               # dashboards e indicadores (absenteísmo, turnover, headcount…)
    └── Marketplace             # integrações de terceiros (fase futura)
```

**Regra de dependência:** `Modules → Core` (sempre); `Core → Modules` (nunca); `Module → Module` (proibido diretamente — somente via eventos ou contratos públicos do Core). Essa regra é garantida por lint de arquitetura (`eslint-plugin-boundaries`) e testes de dependência no CI.

## 2. Estilo arquitetural: Modular Monolith extraível (ADR-004)

- **Decisão:** iniciar como um único deploy NestJS organizado em módulos com fronteiras rígidas (cada módulo = bounded context com API pública explícita), comunicação inter-módulos por eventos.
- **Justificativa:** microsserviços no dia 1 multiplicam custo operacional (deploys, observabilidade, transações distribuídas) sem benefício para 1–1.000 tenants. O modular monolith entrega a mesma disciplina de fronteiras com custo de operação de um serviço só. Como os módulos só se comunicam por eventos/contratos, extrair um módulo para serviço próprio no estágio 10.000 empresas é mover código, não reescrever.
- **Alternativas consideradas:** microsserviços desde o início (rejeitado: complexidade prematura); monólito sem fronteiras (rejeitado: impede extração futura e viola o requisito de plataforma).

## 3. Clean Architecture dentro de cada módulo

Cada módulo (Core ou de negócio) segue as mesmas quatro camadas:

```
modules/people/
├── domain/            # entidades, value objects, regras de negócio puras, eventos de domínio
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── errors/
├── application/       # casos de uso (um arquivo por caso de uso), ports (interfaces)
│   ├── use-cases/     #   ex.: request-vacation.use-case.ts
│   └── ports/         #   ex.: employee.repository.ts (interface)
├── infrastructure/    # adapters: Prisma repositories, storage, provedores externos
│   ├── prisma/
│   └── providers/
└── presentation/      # controllers REST, DTOs (class-validator), mappers, guards
    ├── controllers/
    └── dto/
```

- **Domain** não importa nada de framework (nem NestJS, nem Prisma).
- **Application** depende só de domain e de interfaces (ports) — princípio de inversão de dependência (SOLID/DIP).
- **Infrastructure** implementa os ports; é o único lugar que conhece Prisma/S3/Redis.
- **Presentation** valida entrada, chama caso de uso, mapeia saída. Controllers não contêm regra de negócio.

**Justificativa:** com casos de uso isolados, testes de unidade não precisam de banco; trocar Prisma, storage ou provedor de IA é trocar um adapter. É o que permite os requisitos "trocar estratégia de tenancy", "trocar Supabase→S3" e "adicionar agentes de IA sem alterar a plataforma".

## 4. Monorepo (ADR-001)

```
peopleflow/
├── apps/
│   ├── web/                  # Next.js 15 — landing + todos os portais (route groups por portal)
│   │   └── src/app/
│   │       ├── (marketing)/  # landing page, planos, trabalhe-conosco/[slug]
│   │       ├── (auth)/       # login, MFA, recuperação
│   │       ├── (admin)/      # painel administrativo
│   │       ├── (hr)/         # painel RH
│   │       ├── (dp)/         # painel DP
│   │       ├── (manager)/    # portal do gestor
│   │       └── (employee)/   # portal do colaborador
│   └── api/                  # NestJS — Core + Modules (estrutura da seção 1)
├── packages/
│   ├── ui/                   # Flow UI — Design System próprio (doc 13)
│   ├── contracts/            # tipos compartilhados, schemas zod, clientes gerados do OpenAPI
│   ├── database/             # schema Prisma, migrations, seeds
│   ├── config/               # eslint, tsconfig, tailwind preset compartilhados
│   └── events/               # contratos de eventos (doc 06) compartilhados entre módulos
├── docs/                     # esta documentação + ADRs
├── docker-compose.yml        # Postgres + Redis + MinIO (dev local)
└── turbo.json                # pipeline de build/test/lint
```

- **Ferramentas:** pnpm workspaces + Turborepo.
- **Justificativa:** frontend e backend compartilham contratos tipados (`packages/contracts`) — uma mudança de API quebra o build do web em vez de quebrar em produção. Turborepo dá cache de build incremental; pnpm resolve dependências com hard links (CI rápido).
- **Alternativas:** repositórios separados (rejeitado: drift de contratos, versionamento cruzado penoso); Nx (viável, porém mais pesado; Turborepo é suficiente e mais simples).

## 5. Fluxo de uma requisição

```
Browser/Mobile
  → Next.js (SSR/Server Actions só para leitura de página; mutações vão à API)
  → API Gateway (NestJS): rate limit → auth (JWT) → tenant resolution → RBAC/ABAC guard
  → Controller → Use Case → Domain → Repository (port)
  → Prisma (com extensão de tenant) → PostgreSQL (RLS como segunda linha de defesa)
  → Domain Events → Outbox → Event Bus → handlers (notificações, auditoria, analytics, webhooks)
```

## 6. Infraestrutura de deploy (ADR-013)

| Componente | Onde | Observação |
|-----------|------|------------|
| `apps/web` | Vercel | Edge/CDN para landing; portais atrás de auth |
| `apps/api` | Railway (Docker) | Escala horizontal; a mesma imagem roda workers BullMQ |
| PostgreSQL | Railway | Backups automáticos; PITR quando disponível |
| Redis | Railway | Cache, rate limit, filas |
| Storage | Supabase Storage (MVP) → S3 (produção) | Atrás do port `FileStorage` (ADR-009) |

Docker Compose reproduz o ambiente completo em desenvolvimento local — **paridade dev/prod** é requisito, não conveniência.
