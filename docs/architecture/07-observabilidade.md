# 07 — Observabilidade

> Decisão relacionada: ADR-011. Requisito 6 da aprovação.

## 1. Pilares e ferramentas

| Pilar | Ferramenta | Detalhe |
|-------|-----------|---------|
| **Tracing distribuído** | **OpenTelemetry** (SDK Node auto-instrumentation: HTTP, Prisma, Redis, BullMQ) | `trace_id` propagado do Next.js → API → workers → eventos (`correlationId`) |
| **Métricas** | OpenTelemetry Metrics → Prometheus (exposição `/metrics`) | RED (rate/errors/duration) por rota; métricas de negócio: logins, batidas de ponto, jobs, tokens de IA |
| **Logs estruturados** | **pino** (JSON) | Campos obrigatórios: `trace_id`, `tenant_id`, `user_id`, `module`. Nunca dados sensíveis (redaction automática de CPF, tokens, senhas) |
| **Error tracking** | **Sentry** (web + API) | Release tracking, source maps, alertas |
| **Health checks** | NestJS Terminus | `/health/live` (processo vivo) e `/health/ready` (Postgres, Redis, storage, filas) — usados pelo orquestrador p/ restart e deploy |

## 2. Decisões e justificativas

- **OpenTelemetry como camada única de instrumentação:** padrão aberto, independente de vendor — os dados podem ir para Grafana Tempo, Datadog ou Honeycomb trocando só o exporter (OTLP). *Alternativa rejeitada:* instrumentar direto com SDK de um vendor (lock-in em cima de um custo que cresce com o número de tenants).
- **pino em vez de winston:** ~5x mais rápido em JSON (logging é hot path em API multi-tenant), redaction nativa.
- **`tenant_id` como dimensão obrigatória:** permite responder "qual tenant está degradando o sistema?" e medir custo por tenant — insumo direto para billing por uso e para decidir promoção de estratégia de tenancy (doc 03).

## 3. Correlação ponta a ponta

```
Request (web) ── traceparent ──> API ── trace_id ──┬─> logs (pino)
                                                    ├─> spans (OTel)
                                                    ├─> audit_logs.trace_id
                                                    └─> DomainEvent.correlationId ──> workers/handlers
```

Um incidente é investigável a partir de qualquer ponta: do erro no Sentry chega-se aos logs, ao trace, à trilha de auditoria e aos eventos derivados — com um único identificador.

## 4. Alertas mínimos (produção)

- Error rate > 2% por 5 min (por rota e global);
- p95 de latência acima do SLO por rota;
- Fila BullMQ com backlog crescente ou DLQ > 0;
- Health check `ready` falhando;
- Tentativas de login anômalas / reuso de refresh token (segurança, doc 05).
