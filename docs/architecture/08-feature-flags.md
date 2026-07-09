# 08 — Feature Flags e Ativação de Módulos

> Requisito 7 da aprovação: ativar módulos por empresa.

## 1. Dois conceitos distintos (e por quê)

| Conceito | Tabela | Quem controla | Exemplo |
|----------|--------|---------------|---------|
| **Entitlement de módulo** | `tenant_modules` (derivado do plano ± overrides) | Billing/comercial | Empresa A tem RH e DP; não tem Payroll nem IA |
| **Feature flag** | `feature_flags` + `tenant_feature_flags` | Engenharia/produto | rollout gradual de "novo editor de escalas", kill switch de IA |

Separar evita o erro clássico de misturar contrato comercial (estável, auditável, cobrável) com rollout técnico (volátil, reversível).

## 2. Modelo

```
plans.entitlements (JSON)      ─┐
                                ├─> resolução ─> tenant_modules (materializado)
tenant_modules.overrides       ─┘
feature_flags (definição: chave, tipo bool/string/number/json, default, escopo)
tenant_feature_flags (override por tenant; opcional % rollout e segmento)
```

Exemplo do requisito:

```
Empresa A: people ✅  recruitment ✅  payroll ❌  ai ❌
Empresa B: todos ✅
```

## 3. Enforcement em três camadas

1. **API:** guard `@RequireModule('payroll')` em todo controller de módulo → 403 `MODULE_NOT_ENABLED` se o tenant não tem o módulo.
2. **Web:** navegação, rotas e menus são montados a partir dos entitlements do tenant (endpoint `/api/v1/me/entitlements`, cacheado) — módulo desativado não aparece.
3. **Workers/eventos:** handlers verificam entitlement antes de processar (um tenant sem IA não consome fila de IA).

## 4. Avaliação e performance

- Serviço `FeatureFlagService.isEnabled(flag, ctx)` com cache Redis (TTL 30s) + invalidação por evento `platform.flag.changed`.
- Avaliação é **local e síncrona** no request (nunca uma chamada externa no hot path).
- *Justificativa:* solução própria sobre Postgres+Redis em vez de LaunchDarkly/Unleash — flags aqui são parte do modelo de negócio (módulo por empresa), precisam de join com billing e tenancy; um SaaS externo adicionaria custo e uma dependência de disponibilidade no hot path. A interface permite plugar Unleash depois se o rollout técnico ficar sofisticado.
