# 05 — Segurança e LGPD

> Decisões relacionadas: ADR-008 (autenticação), ADR-006 (RLS). Todos os itens do requisito 4 da aprovação implementados desde a primeira versão.

## 1. Autenticação

| Mecanismo | Especificação |
|-----------|---------------|
| **Senhas** | **Argon2id** (memory 64 MiB, iterations 3, parallelism 4 — ajustável por config). *Justificativa:* vencedor do Password Hashing Competition, resistente a GPU/ASIC; bcrypt (alternativa) tem custo de memória fixo baixo e trunca em 72 bytes. |
| **JWT de acesso** | Vida curta (15 min), assinado **RS256** (chave privada só na API; web e serviços validam com a pública). Claims: `sub`, `tid` (tenant), `sid` (sessão), `roles`. |
| **Refresh token rotativo** | Opaco (256 bits aleatórios), armazenado **hasheado** em `sessions`, em cookie `httpOnly; Secure; SameSite=Strict`. A cada uso é **rotacionado**; reuso de token antigo ⇒ **revogação da família inteira** (detecção de roubo). Vida: 7 dias deslizantes, 30 dias absolutos. |
| **MFA** | TOTP (RFC 6238) com segredo criptografado + 10 códigos de recuperação hasheados. Obrigatório configurável por tenant/role (ex.: admins sempre). |
| **OAuth** | Google/Microsoft via `oauth_accounts`; sempre vinculado a um `user` local. |
| **API Keys** | Formato `pfk_live_<prefixo>.<segredo>`; só o hash do segredo é persistido; escopos explícitos; rotação e expiração. |

## 2. Autorização — RBAC + ABAC

- **RBAC (base):** `permissions` no formato `module.resource.action` (ex.: `people.vacation.approve`), agregadas em `permission_groups` e `roles`. Papéis padrão criados no provisioning do tenant: Admin, RH, DP, Gestor, Colaborador — todos customizáveis.
- **ABAC (quando necessário):** implementado com **CASL**; condições por atributo em cima do RBAC. Exemplos reais: *Gestor aprova férias apenas de subordinados diretos* (`employee.managerId == user.employeeId`); *Colaborador lê apenas os próprios holerites*.
- **Enforcement em camadas:** guard no controller (decorator `@RequirePermission(...)`) + verificação no caso de uso (defesa em profundidade) + RLS no banco (última linha).
- *Justificativa:* RBAC puro não expressa "só da minha equipe"; ABAC puro é difícil de auditar. O híbrido RBAC-com-condições é o padrão dos HCMs maduros. Alternativas: OPA/Cerbos (poderosos, porém um serviço a mais para operar no MVP — a interface `PolicyEngine` permite adotá-los depois).

## 3. Proteções de borda (API Gateway)

| Proteção | Implementação |
|----------|---------------|
| **Rate limit** | Sliding window em Redis, por IP + por usuário + por API key; limites distintos para login (5/min), API geral (por plano), IA (por tokens). Resposta 429 + `Retry-After`. |
| **CSRF** | Cookies `SameSite=Strict` + double-submit token nas rotas com sessão de navegador; APIs por Bearer/API key são isentas por design. |
| **CSP / Helmet** | Helmet no NestJS e headers no Next.js: CSP com nonce (sem `unsafe-inline`), HSTS, `X-Content-Type-Options`, `frame-ancestors 'none'`. |
| **Validação de entrada** | DTOs com class-validator (whitelist + forbidNonWhitelisted); uploads validados por magic number, tamanho e antivírus (ClamAV) antes de ir ao storage. |
| **CORS** | Allowlist explícita por ambiente. |

## 4. Criptografia

- **Em trânsito:** TLS 1.2+ em tudo (inclusive interno).
- **Em repouso (banco):** campos sensíveis (CPF, RG, dados bancários, saúde, segredos MFA, credenciais de integração) criptografados na aplicação com **AES-256-GCM** usando **envelope encryption**: DEK por tenant, criptografada por uma KEK gerenciada (KMS na produção; env cifrada no MVP). Rotação de chaves suportada por versionamento (`key_version` na coluna).
- **Storage:** buckets privados; acesso exclusivamente por **URLs assinadas** de curta duração; criptografia server-side do provedor.
- *Justificativa:* envelope encryption permite rotacionar a KEK sem recriptografar tudo e isola o raio de exposição por tenant — alinhado à estratégia de tenancy evolutiva.

## 5. LGPD by Design

| Princípio | Implementação |
|-----------|---------------|
| Base legal e consentimento | Registro de consentimento com finalidade e validade (candidatos: expiração e re-consentimento automáticos) |
| Minimização | Coleta-se apenas o exigido pelo processo; campos sensíveis marcados no schema e criptografados |
| Direito de acesso/portabilidade | Endpoint de exportação dos dados do titular (JSON/PDF) |
| Direito de eliminação | Anonimização irreversível preservando obrigações legais (dados trabalhistas têm retenção obrigatória — a política de retenção por tipo de dado fica em `settings`) |
| Trilha de auditoria | `audit_logs` append-only: **toda** mutação registra ator, before/after, IP, trace_id |
| DPO/Incidentes | Runbook de resposta a incidentes + relatório de impacto (RIPD) como parte da documentação operacional |

## 6. Auditoria completa

- Interceptor global captura mutações (create/update/delete) e decisões de acesso negado.
- Eventos de segurança dedicados: login (sucesso/falha), MFA, troca de senha, rotação/reuso de refresh token, criação de API key, mudança de permissão, exportação de dados.
- `audit_logs` é **append-only** (sem UPDATE/DELETE — revogado por grant) e correlacionado a traces via `trace_id` (doc 07).

## 7. Segurança no ciclo de desenvolvimento

- CI: `pnpm audit` + Dependabot; SAST (Semgrep) nos PRs; secret scanning.
- Testes automatizados de autorização: suíte que verifica cada rota contra papéis sem permissão (garante que rota nova sem guard falhe o build).
- Sem segredos em código: env vars validadas no boot (zod) — boot falha se configuração de segurança estiver ausente.
