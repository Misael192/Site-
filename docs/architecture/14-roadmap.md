# 14 — Roadmap de Implementação

> Cada fase termina com software funcionando em ambiente de staging, testes automatizados verdes e documentação atualizada. As fundações de plataforma (tenancy, RBAC, eventos, flags, billing, auditoria, observabilidade) entram na **Fase 1** — é isso que evita retrabalho nas fases seguintes.

## Fase 1 — Fundação da Plataforma ✅ (aprovada — este documento)

**Entregáveis:**
1. Monorepo (pnpm + Turborepo) com `apps/web`, `apps/api`, `packages/{ui,contracts,database,config,events}`; Docker Compose (Postgres, Redis, MinIO); CI (lint, typecheck, testes, Spectral, boundaries).
2. **Core completo em produção mínima:**
   - Tenants (estratégia coluna + RLS + `TenantContext`/`TenantAwareDatabase`);
   - Identity & IAM (login, JWT RS256, refresh rotativo, MFA TOTP, sessões, API keys);
   - RBAC/ABAC (roles padrão, permission groups, guards, CASL);
   - Organizations (organizations → companies → branches → departments → teams → positions → cost centers → settings);
   - Event bus + outbox; Audit logs; Notifications (in-app + e-mail);
   - Feature flags + tenant_modules; Billing estrutural (plans/subscriptions/invoices/limites, NoopGateway);
   - Files (Supabase Storage atrás do port, URLs assinadas);
   - Observabilidade (OTel, health checks, pino, Sentry, métricas).
3. Schema Prisma com **todas** as entidades do doc 04 (incluindo as de fases futuras — estrutura desde o início, conforme aprovação).
4. Flow UI v1 (tokens, tema claro/escuro, componentes base + AppShell) + Storybook.
5. Web: landing page institucional, autenticação (login/MFA), shell dos 5 portais com navegação por entitlements.
6. API `/api/v1` documentada em OpenAPI + `packages/contracts` gerado.

**Critério de aceite:** criar tenant → provisionar papéis/planos → login com MFA → navegar portais conforme módulo ativo → toda mutação auditada e rastreável por trace_id.

## Fase 2 — DP essencial
- **People:** cadastro de colaboradores (com criptografia de campos sensíveis), admissão digital (checklist, upload, contrato), GED (versões, permissões, compartilhamento).
- **Workflow Engine v1:** máquina de estados + nós trigger/condition/approval/notification/end; férias e ajuste de ponto rodando sobre ele.
- **Férias:** solicitação → aprovação (workflow) → calendário → alertas → relatórios.
- **Ponto:** registro web/mobile (PWA) com geoloc opcional, escalas, banco de horas, aprovação de ajustes, relatórios.
- Portal do Colaborador e do Gestor funcionais para esses fluxos.

## Fase 3 — RH essencial
- **Recrutamento:** vagas, Trabalhe Conosco público (`/trabalhe-conosco/[slug]`), pipeline Kanban, entrevistas, avaliações, banco de currículos com consentimento LGPD.
- **Benefícios:** catálogo, adesões, convênios, relatórios.
- **Dashboard/Analytics v1:** headcount, admissões, demissões, turnover, absenteísmo, férias, banco de horas — leituras materializadas alimentadas por eventos.

## Fase 4 — IA e assinatura
- **AI Engine:** chat com streaming, Prompt Library, RAG (pgvector) com base CLT, agentes: Assistente CLT, Gerador de documentos, Copiloto de recrutamento; limites por plano.
- **Assinatura eletrônica** própria (trilha: hash do documento, IP, timestamp) integrada a admissão, contratos e workflow (`signature` node).
- Editor visual de workflows (React Flow).

## Fase 5 — Performance, Learning e Engajamento
- Metas, ciclos de avaliação, competências, plano de carreira; treinamentos, certificados; pesquisas de clima/satisfação, reconhecimento, mural; indicadores de retenção e desempenho no dashboard.

## Fase 6 — Escala e Enterprise
- Billing com gateway real (Stripe/local), autosserviço de upgrade/downgrade;
- Tenancy por schema + job de migração de tenant; preparação banco-dedicado;
- Payroll (holerites, integração de folha, trilha p/ eSocial via eventos);
- Marketplace/integrações + webhooks públicos; SSO corporativo (SAML/OIDC).

## Trilhas contínuas (todas as fases)
Testes (unidade nos use cases, integração com Testcontainers, e2e Playwright nos fluxos críticos) · segurança (SAST, dependabot, revisão de permissões) · documentação (OpenAPI, ADRs novos a cada decisão relevante) · qualidade visual (Storybook + axe).
