# 15 — Registro de Decisões Técnicas (ADRs)

> Requisito de qualidade da aprovação: **toda decisão técnica importante vem com justificativa e alternativas consideradas.** Formato: Contexto → Decisão → Justificativa → Alternativas → Consequências. Novas decisões relevantes devem adicionar um ADR a este registro (numeração sequencial, nunca reescrever ADR aceito — supersede-se com um novo).

---

## ADR-001 — Monorepo com pnpm workspaces + Turborepo
- **Contexto:** frontend (Next.js), backend (NestJS) e pacotes compartilhados (UI, contratos, schema) precisam evoluir juntos sem drift.
- **Decisão:** monorepo único com pnpm workspaces e Turborepo.
- **Justificativa:** contratos tipados compartilhados quebram no build (não em produção); refactors atômicos cross-stack; cache incremental no CI.
- **Alternativas:** repos separados (drift de contratos, versionamento cruzado); Nx (mais recursos, mais complexidade — desnecessário aqui).
- **Consequências:** CI único mais longo (mitigado pelo cache); disciplina de ownership por pasta.

## ADR-002 — Next.js 15 (App Router) no frontend
- **Contexto:** landing pública com SEO + 5 portais autenticados ricos.
- **Decisão:** um app Next.js 15 com route groups por portal; Server Components para leitura, mutações sempre via API NestJS.
- **Justificativa:** SSR/SSG para a landing e Trabalhe Conosco (SEO), streaming para dashboards, um só deploy Vercel; route groups mantêm os portais separados sem 6 apps.
- **Alternativas:** SPA Vite+React (perde SSR/SEO); apps separados por portal (custo operacional sem ganho no estágio atual — a separação lógica já existe por route group).
- **Consequências:** mutações não usam Server Actions (regra: fonte de verdade de autorização é a API — evita duplicar RBAC).

## ADR-003 — NestJS no backend
- **Contexto:** backend modular com DI, guards, interceptors e ecossistema maduro em TypeScript.
- **Decisão:** NestJS como framework do `apps/api`.
- **Justificativa:** sistema de módulos alinhado ao desenho Core+Modules; DI facilita ports/adapters da Clean Architecture; primitivas prontas (guards, pipes, interceptors, versioning, Terminus, Swagger); mesmo idioma do front (TypeScript ponta a ponta).
- **Alternativas:** Express/Fastify puro (sem estrutura — cada fronteira viraria convenção manual); Go/Java (quebra o compartilhamento de tipos e a velocidade de um time TS).
- **Consequências:** acoplamento ao estilo NestJS na camada de apresentação/infra — domain e application permanecem puros (Clean Architecture).

## ADR-004 — Modular Monolith extraível (não microsserviços)
- **Contexto:** requisito de escalar de 1 a 10.000 empresas sem refatoração; time pequeno no início.
- **Decisão:** um deploy NestJS; módulos = bounded contexts com fronteiras impostas por lint/CI; comunicação inter-módulos só por eventos/contratos.
- **Justificativa:** microsserviços antecipados custam caro (transações distribuídas, deploys, observabilidade N×) sem benefício até muito além de 1.000 tenants; fronteiras rígidas preservam a extração futura como "mover código".
- **Alternativas:** microsserviços dia 1 (complexidade prematura); monólito sem fronteiras (mata a extração e o requisito de plataforma).
- **Consequências:** disciplina de fronteiras exige tooling (eslint-boundaries) e revisão; escala horizontal do monolito cobre os estágios iniciais.

## ADR-005 — Multi-tenancy evolutivo: coluna → schema → banco
- **Contexto:** requisito explícito da aprovação (item 2); mix SMB/Enterprise.
- **Decisão:** lançar com tenant-por-coluna + RLS; abstração `TenantContext`/`TenantAwareDatabase` esconde a estratégia; schema e banco dedicados como promoções por tenant.
- **Justificativa:** densidade máxima e custo mínimo para a maioria; RLS elimina o risco de vazamento; a abstração faz a promoção ser operação de dados, não de código.
- **Alternativas:** schema-per-tenant universal (migrations e pooling proibitivos em 10k tenants); banco-per-tenant universal (custo inviável); coluna sem RLS (risco LGPD inaceitável).
- **Consequências:** RLS exige `SET app.tenant_id` por conexão (gerenciado pela extensão Prisma); testes de isolamento entre tenants são obrigatórios no CI.

## ADR-006 — PostgreSQL 16 + Prisma ORM
- **Contexto:** precisa-se de relacional forte (folha/ponto/auditoria), RLS (tenancy), JSONB (workflows/flags) e vetores (IA).
- **Decisão:** PostgreSQL como único banco primário; Prisma como ORM com Client Extensions para injeção de tenant.
- **Justificativa:** um só banco cobre os quatro requisitos (RLS, JSONB, pgvector, ACID); Prisma dá type-safety no monorepo TS e migrations declarativas.
- **Alternativas:** MySQL (sem RLS equivalente/pgvector); MongoDB (domínio fortemente relacional); TypeORM (manutenção irregular); Drizzle (bom, mas extensões e integração NestJS menos maduras na data da decisão).
- **Consequências:** cuidado com N+1 (resolvido nos repositories); raw SQL pontual para relatórios pesados é aceitável e fica na infrastructure.

## ADR-007 — Redis para cache, rate limit e filas (BullMQ)
- **Contexto:** cache de tenant/flags/entitlements, rate limiting distribuído e processamento assíncrono.
- **Decisão:** Redis único (gerenciado) servindo cache, sliding-window rate limit e BullMQ.
- **Justificativa:** uma peça de infraestrutura resolve três necessidades; BullMQ dá retries, DLQ e agendamento (SLA de workflows).
- **Alternativas:** Kafka/RabbitMQ para filas (operacionalmente mais pesados — ver ADR-010); rate limit em memória (quebra com 2+ réplicas).
- **Consequências:** Redis vira dependência crítica → health check `ready` e fallback degradado de cache (cache-miss → banco).

## ADR-008 — Autenticação: JWT RS256 curto + refresh rotativo, Argon2id, MFA TOTP
- **Contexto:** requisito 4 da aprovação; múltiplos portais + API pública.
- **Decisão:** access token 15min RS256; refresh opaco hasheado com rotação e detecção de reuso (revoga família); Argon2id para senhas; MFA TOTP com recovery codes; API keys com hash+escopos.
- **Justificativa:** RS256 permite validação sem compartilhar segredo; rotação com detecção de reuso é o estado da arte contra roubo de refresh; Argon2id resiste a hardware dedicado.
- **Alternativas:** sessões server-side puras (mais simples, porém pior para API pública/mobile); HS256 (segredo compartilhado); bcrypt (custo de memória fixo, trunca 72 bytes); Auth0/Clerk (custo por MAU em 10k empresas + tenancy própria complexa de mapear).
- **Consequências:** gestão de chaves RS256 (rotação via JWKS); logout real = revogação de sessão (não só expirar JWT).

## ADR-009 — Storage atrás de port: Supabase Storage (MVP) → Amazon S3 (produção)
- **Contexto:** GED, admissão, holerites e assinatura precisam de arquivos com versões, ACL e URLs assinadas.
- **Decisão:** interface `FileStorage` no Core/Files; adapter Supabase no MVP, adapter S3 para produção/Enterprise; metadados sempre no Postgres (`files`).
- **Justificativa:** Supabase acelera o MVP (URLs assinadas prontas); S3 dá durabilidade/versionamento/lifecycle em escala; o port torna a troca invisível aos módulos; metadados no banco mantêm ACL/auditoria no nosso modelo.
- **Alternativas:** somente S3 desde o início (aceitável; Supabase reduz setup no MVP); arquivos no banco (inviável em volume).
- **Consequências:** migração MVP→S3 é um job de cópia + troca de adapter; MinIO em dev para paridade.

## ADR-010 — Eventos: EventEmitter2 + Outbox + BullMQ (evolutivo p/ broker)
- **Contexto:** requisito 5 da aprovação: barramento interno desde a v1, mesmo dentro do NestJS.
- **Decisão:** envelope único versionado (`packages/events`); outbox transacional no Postgres; dispatcher publica em EventEmitter2 (síncrono barato) e BullMQ (assíncrono); port `EventBus` para futura troca por Kafka/NATS.
- **Justificativa:** outbox garante atomicidade estado+evento; Redis já existe na stack; contratos estáveis fazem a troca de transporte ser um adapter.
- **Alternativas:** Kafka dia 1 (custo operacional sem demanda); chamadas diretas entre módulos (acoplamento que mata a extração); CDC/Debezium (poderoso, prematuro).
- **Consequências:** handlers obrigatoriamente idempotentes; monitorar backlog do outbox e DLQ (doc 07).

## ADR-011 — Observabilidade: OpenTelemetry + Prometheus + pino + Sentry
- **Contexto:** requisito 6 da aprovação; necessidade de atribuir custo/degradação por tenant.
- **Decisão:** OTel como camada única (traces+métricas), export OTLP; pino para logs JSON com redaction; Sentry para erros; Terminus para health checks; `tenant_id` e `trace_id` como dimensões obrigatórias.
- **Justificativa:** padrão aberto sem lock-in de vendor; correlação ponta a ponta (request→evento→worker→auditoria) com um identificador.
- **Alternativas:** APM proprietário direto (lock-in + custo por volume); winston (mais lento em JSON).
- **Consequências:** amostragem de traces configurável para conter custo; disciplina de campos nos logs.

## ADR-012 — Design System próprio (Flow UI) sobre Radix, tokens via Style Dictionary
- **Contexto:** requisito 12 da aprovação: não usar somente shadcn; identidade própria com tokens/tipografia/grid/motion.
- **Decisão:** `packages/ui` (Flow UI) com tokens JSON → CSS vars + preset Tailwind; primitivos Radix; shadcn como referência interna copiada; Storybook + testes axe; apps só consomem Flow UI.
- **Justificativa:** acessibilidade pronta (Radix) + identidade e API 100% próprias; tokens em fonte única viabilizam dark mode de primeira classe e futura extensão a mobile.
- **Alternativas:** shadcn puro (sem identidade); MUI/Ant (theming contra o framework); tudo do zero (custo/risco a11y).
- **Consequências:** investimento contínuo em manutenção do DS; governança de contribuição de componentes.

## ADR-013 — Deploy: Vercel (web) + Railway (API/Postgres/Redis) + Docker
- **Contexto:** time pequeno, necessidade de CDN/SSR gerenciado no front e simplicidade no back; stack aprovada menciona Vercel e Railway.
- **Decisão:** web na Vercel; API em container Docker no Railway (mesma imagem para API e workers); Postgres/Redis gerenciados no Railway; Docker Compose para dev.
- **Justificativa:** zero ops de CDN/edge no front; Railway dá deploy por imagem com escala simples; Docker garante paridade e portabilidade — migrar para AWS/GCP depois é mover a imagem, não reescrever.
- **Alternativas:** AWS completa (ECS/RDS) dia 1 (poder e complexidade prematuros); tudo na Vercel (workers/filas de longa duração não se encaixam em serverless).
- **Consequências:** limites do Railway monitorados; plano de saída documentado (imagem Docker + Postgres dump = portável).

## ADR-014 — IA: módulo independente, Claude API atrás de `LLMProvider`, RAG com pgvector
- **Contexto:** requisito 10 da aprovação: IA nasce como módulo, novos agentes sem tocar a plataforma.
- **Decisão:** Core/AI com contratos `LLMProvider`, `Agent`, `AITool`, `VectorStore`; provedor padrão Claude API; embeddings/pgvector; tools reusam RBAC do usuário; consumo medido para billing.
- **Justificativa:** ports garantem independência de provedor e extensão por registro de agente; pgvector mantém vetores sob a mesma tenancy/RLS sem serviço extra; RBAC nas tools impede a IA de exceder permissões do usuário (risco central em HCM).
- **Alternativas:** LangChain como framework (abstrações voláteis; preferimos contratos próprios finos); vector DB dedicado (peça extra sem necessidade no volume esperado); IA embutida em cada módulo (duplicação e impossibilidade de governança central de custo/segurança).
- **Consequências:** curadoria da base CLT é processo contínuo; monitorar custo por tenant desde o primeiro dia (`ai_usage_logs`).
