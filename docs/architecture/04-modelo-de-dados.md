# 04 — Modelo de Dados

> Decisões relacionadas: ADR-006 (PostgreSQL + Prisma), ADR-005 (tenancy). Todas as entidades exigidas no item 3 da aprovação fazem parte do modelo inicial.

## 1. Convenções

- **IDs:** UUID v7 (ordenável no tempo → índices B-tree eficientes; não vaza contagem como auto-increment).
- **Tenancy:** toda tabela de dados de negócio tem `tenant_id` + índice composto; tabelas do plano de controle são globais (doc 03 §4).
- **Timestamps:** `created_at`, `updated_at` em tudo; `deleted_at` para soft delete onde a LGPD exige trilha (a eliminação definitiva é um processo de anonimização — doc 05).
- **Nomenclatura:** snake_case no banco, camelCase no Prisma (`@map`/`@@map`).
- **Migrations:** Prisma Migrate, uma migration por PR, nunca editar migration aplicada.

## 2. Plano de controle (global — sem tenant_id)

| Entidade | Papel |
|----------|-------|
| `tenants` | registro do tenant: slug, status, `isolation_mode`, `data_source_key` |
| `tenant_data_sources` | pools/conexões físicas para estratégias schema/banco |
| `plans` | planos comerciais e seus entitlements (JSON de limites + módulos) |
| `modules` | catálogo de módulos da plataforma (People, Payroll, Recruitment…) |
| `feature_flags` | definições de flags (chave, tipo, default, escopo) |
| `platform_users` | operadores da PeopleFlow (suporte/admin da plataforma) |

## 3. Core — Identity & IAM

| Entidade | Campos-chave / papel |
|----------|----------------------|
| `users` | e-mail único por tenant, `password_hash` (Argon2id), status, locale, MFA habilitado |
| `sessions` | refresh token **hasheado**, família de rotação, device/user-agent/IP, expiração, `revoked_at` |
| `oauth_accounts` | provider (Google, Microsoft…), `provider_account_id`, tokens criptografados |
| `mfa_secrets` | segredo TOTP criptografado (AES-256-GCM), códigos de recuperação hasheados |
| `api_keys` | prefixo público + hash do segredo, escopos, expiração, último uso |
| `roles` | papéis por tenant (Admin, RH, DP, Gestor, Colaborador + customizados) |
| `permissions` | catálogo global de permissões (`module.resource.action`, ex.: `people.vacation.approve`) |
| `permission_groups` | agrupamentos reutilizáveis de permissões |
| `role_permissions` / `user_roles` | vínculos N:N |

## 4. Core — Organizations

Hierarquia: `organizations → companies → branches → departments → teams`; `positions` (cargos) e `cost_centers` (centros de custo) vinculados à company.

| Entidade | Papel |
|----------|-------|
| `organizations` | grupo econômico (raiz do tenant) |
| `companies` | CNPJ, razão social, regime; N por organização |
| `branches` | filiais (endereço, CNPJ filial) |
| `departments` | departamentos, com hierarquia (`parent_id`) |
| `teams` | equipes dentro de departamentos; `manager_id` |
| `positions` | cargos: título, CBO, faixa salarial, descrição |
| `cost_centers` | centros de custo para rateio |
| `settings` | configurações por escopo (tenant/company/módulo) em par chave/valor tipado |

## 5. Core — Billing, Flags, Notificações, Auditoria, Integrações

| Entidade | Papel |
|----------|-------|
| `subscriptions` | assinatura do tenant: plano, status, período, trial |
| `invoices` | faturas: valor, status, vencimento, gateway ref |
| `usage_records` | medição para limites (nº colaboradores, storage, tokens IA) |
| `tenant_feature_flags` | valor da flag por tenant (override do default) |
| `tenant_modules` | módulos ativos por tenant (com origem: plano ou override) |
| `notifications` | notificações in-app/e-mail/push: destinatário, template, payload, lida em |
| `notification_preferences` | opt-in/out por canal e categoria |
| `audit_logs` | **append-only**: ator, ação, recurso, before/after (JSON), IP, trace_id |
| `integrations` | integrações configuradas por tenant (tipo, credenciais criptografadas) |
| `webhook_endpoints` / `webhook_logs` | endpoints assinantes + entregas (payload, status, retries) |

## 6. Core — Files, Workflow, IA

| Entidade | Papel |
|----------|-------|
| `files` | metadados: nome, mime, tamanho, storage key, checksum, dono, escopo |
| `file_versions` | controle de versões (GED) |
| `file_permissions` | ACL por usuário/role/link assinado |
| `signature_requests` / `signature_events` | assinatura eletrônica: signatários, ordem, hash do documento, trilha (IP, timestamp, geoloc) |
| `workflow_templates` | definição do fluxo (grafo JSON versionado) por tenant |
| `workflow_instances` | execução: template+versão, entidade alvo, estado atual, contexto |
| `workflow_history` | cada transição: nó, ator, decisão, comentário, timestamp |
| `ai_conversations` | conversas por usuário/tenant: título, agente, custo acumulado |
| `ai_messages` | mensagens: role, conteúdo, tokens, ferramenta chamada, latência |
| `ai_prompts` | prompt library versionada |
| `ai_knowledge_documents` / `ai_embeddings` | base de conhecimento + vetores (pgvector) |
| `ai_usage_logs` | consumo por tenant p/ billing e limites |

## 7. Módulos de negócio (principais entidades)

### People (colaboradores, admissão, férias, ponto)
- `employees` — dados funcionais e pessoais (campos sensíveis criptografados — doc 05), vínculo com `users`, company/branch/department/team/position/cost_center, gestor (`manager_id`), status (ativo, afastado, desligado).
- `employee_documents` — checklist de admissão + GED (referencia `files`).
- `admissions` — processo de admissão: etapa, checklist, pendências, assinaturas.
- `terminations` — desligamentos: tipo, data, motivo (alimenta turnover).
- `vacations` — períodos aquisitivos, saldos, solicitações, aprovações (via Workflow), calendário.
- `work_schedules` / `shifts` — escalas e turnos.
- `time_entries` — batidas de ponto: origem (web/mobile), geoloc opcional, foto opcional, hash de integridade.
- `time_adjustments` — solicitações de ajuste + aprovação.
- `time_balances` — banco de horas materializado por competência.

### Recruitment
- `job_openings` — vagas: cargo, requisitos, status, publicação no Trabalhe Conosco.
- `candidates` — banco de currículos (consentimento LGPD com validade).
- `applications` — candidatura: vaga + candidato + etapa do pipeline (Kanban).
- `pipeline_stages` — etapas configuráveis por tenant.
- `interviews` — agendamentos, entrevistadores, feedback.
- `candidate_evaluations` — notas e pareceres por etapa.

### Benefits
- `benefits` — catálogo por tenant (VT, VA, saúde, convênios…).
- `benefit_providers` — operadoras/convênios.
- `employee_benefits` — adesões, valores, dependentes, histórico de utilização.

### Performance & Learning
- `goals` — metas (empresa/equipe/indivíduo), progresso.
- `review_cycles` / `reviews` — ciclos e avaliações (90/180/360).
- `competencies` / `competency_assessments` — matriz e avaliação de competências.
- `career_paths` — trilhas de carreira por cargo.
- `courses` / `enrollments` / `certificates` — treinamentos, matrículas, certificados.
- `feedbacks` — feedbacks contínuos (públicos/privados).

### Engagement
- `surveys` / `survey_questions` / `survey_responses` — clima e satisfação (respostas anonimizáveis).
- `recognitions` — reconhecimentos entre colaboradores.
- `announcements` — mural de avisos/comunicação interna (segmentável).

### Payroll (estrutura desde o início; cálculo em fase futura)
- `payrolls` / `payslips` — competências e holerites (arquivo assinado em `files`).
- `payroll_events` — proventos/descontos por colaborador.

## 8. Diagrama (visão macro)

```
tenants ─┬─ organizations ─┬─ companies ─┬─ branches
         │                 │             ├─ departments ─ teams
         │                 │             ├─ positions
         │                 │             └─ cost_centers
         │                 └─ users ─┬─ sessions / oauth_accounts / mfa_secrets
         │                           └─ user_roles ─ roles ─ role_permissions ─ permissions
         ├─ subscriptions ─ plans          ├─ invoices
         ├─ tenant_modules / tenant_feature_flags
         └─ audit_logs / notifications / integrations / webhook_*

employees ─┬─ vacations / time_entries / time_balances / employee_documents
           ├─ employee_benefits ─ benefits
           ├─ reviews / goals / enrollments
           └─ payslips
workflow_templates ─ workflow_instances ─ workflow_history
ai_conversations ─ ai_messages ; ai_knowledge_documents ─ ai_embeddings
```

## 9. Justificativa das escolhas (resumo — detalhes no ADR-006)

- **PostgreSQL:** único banco que atende simultaneamente RLS (tenancy), JSONB (workflows/flags/settings), pgvector (RAG de IA) e maturidade transacional. Alternativas: MySQL (sem RLS equivalente), MongoDB (modelo relacional forte aqui — folha, ponto e auditoria são naturalmente relacionais).
- **Prisma:** type-safety ponta a ponta com o monorepo TypeScript, migrations declarativas e Client Extensions (essenciais para injeção de tenant). Alternativas: TypeORM (manutenção irregular), Drizzle (ótimo, mas extensões de cliente e ecossistema NestJS menos maduros à época da decisão).
