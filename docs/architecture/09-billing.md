# 09 — Billing

> Requisito 8 da aprovação: estrutura completa desde o MVP, mesmo antes de cobrar.

## 1. Modelo

```
plans ──< subscriptions >── tenants
              │
              ├──< invoices (fatura por ciclo; status: draft → open → paid/failed/void)
              └──< usage_records (medições p/ limites e cobrança por uso)
```

| Entidade | Campos-chave |
|----------|--------------|
| `plans` | nome, preço base, ciclo (mensal/anual), `entitlements` JSON: módulos incluídos + limites (`max_employees`, `storage_gb`, `ai_tokens_month`, `api_rate`) |
| `subscriptions` | tenant, plano, status (`trialing/active/past_due/canceled`), `current_period_start/end`, âncora de cobrança |
| `invoices` | valor, moeda, itens (JSON), vencimento, `gateway_ref`, tentativas |
| `usage_records` | métrica, quantidade, período — alimentado por eventos (ex.: `people.employee.created` incrementa headcount) |

## 2. Ciclo de vida

- **Trial:** assinatura nasce `trialing` com plano padrão; expiração dispara `billing.trial.expired` → notificação + downgrade suave.
- **Upgrade:** imediato; entitlements re-resolvidos na hora (evento `billing.subscription.upgraded` invalida caches de `tenant_modules`); cobrança pró-rata.
- **Downgrade:** agendado para o fim do período (evita estorno); validação prévia: se o tenant excede limites do plano de destino (ex.: 300 funcionários indo para plano de 100), o downgrade exige adequação.
- **Inadimplência:** `past_due` → régua de notificação → restrição progressiva (somente leitura) → suspensão. Nunca deleção de dados (LGPD/retenção).

## 3. Enforcement de limites

`LimitsService.check(metric, ctx)` consulta `usage_records` materializados vs `entitlements` (cacheado em Redis). Chamado nos casos de uso que consomem cota (criar colaborador, upload, chamada de IA). Excedente ⇒ 402 `LIMIT_EXCEEDED` com detalhe do limite — o front usa isso para exibir call-to-action de upgrade.

## 4. Gateway de pagamento

- Port `PaymentGateway` (criar cliente, assinar, cobrar, webhook de status). MVP: implementação `NoopGateway` (faturas geradas, cobrança manual). Produção: adapter Stripe primeiro (webhooks assinados), com espaço para gateways locais (Pagar.me/Asaas) por causa de Pix/boleto.
- *Justificativa:* desenhar o modelo de dados de billing depois que existem tenants em produção é retrabalho garantido (migração de contratos vivos). Criar a estrutura agora custa pouco e destrava o go-to-market. A abstração de gateway evita lock-in e permite Pix/boleto no Brasil. *Alternativa rejeitada:* acoplar direto ao Stripe Billing como fonte de verdade (dificulta gateways locais e deixa entitlements fora do nosso banco, quebrando o enforcement local — doc 08).
