# 06 — Arquitetura de Eventos

> Decisão relacionada: ADR-010. Requisito 5 da aprovação: barramento interno de eventos desde a primeira versão.

## 1. Por que eventos desde o dia 1

Os módulos não podem se chamar diretamente (regra de dependência — doc 02 §1). Toda comunicação entre módulos acontece por **eventos de domínio**. Isso:

1. Mantém os módulos extraíveis para serviços independentes no futuro (o transporte muda, o contrato não).
2. Alimenta gratuitamente auditoria, notificações, webhooks, analytics e workflows — todos são *assinantes*.
3. Prepara integrações fiscais (eSocial) que são naturalmente assíncronas.

## 2. Contrato de evento (envelope)

Todos os eventos compartilham o mesmo envelope, definido em `packages/events` (tipado, versionado):

```ts
interface DomainEvent<T> {
  id: string;               // UUID v7
  name: string;             // "people.employee.created"
  version: number;          // versão do schema do payload
  tenantId: string;
  actorId: string | null;   // usuário/sistema que causou
  occurredAt: string;       // ISO-8601
  correlationId: string;    // = trace_id da requisição de origem
  causationId: string | null; // id do evento que causou este (cadeias)
  payload: T;               // dados do evento — schema zod versionado
}
```

**Convenção de nomes:** `modulo.entidade.acao` no passado. Exemplos do catálogo inicial:

```
people.employee.created        people.employee.updated
people.vacation.requested      people.vacation.approved
people.time_adjustment.requested
recruitment.candidate.applied  recruitment.application.stage_changed
payroll.payroll.generated      payroll.payslip.signed
esocial.event.sent             billing.subscription.upgraded
workflow.instance.completed    files.signature.completed
```

## 3. Fluxo com Outbox Pattern

```
Use Case
  └─ transação Prisma:
       1. escreve o estado (ex.: INSERT vacations …)
       2. INSERT em outbox_events (mesmo commit)          ← atomicidade garantida
Dispatcher (worker)
  └─ lê outbox pendente → publica no barramento → marca como publicado
Barramento (fase 1: EventEmitter2 in-process + BullMQ p/ handlers assíncronos)
  └─ handlers: Audit, Notifications, Analytics, Workflow Engine, Webhooks
```

- **Outbox é obrigatório** para eventos que disparam efeitos externos: sem ele, um commit seguido de crash perderia o evento (ou publicaria evento de transação revertida).
- Handlers são **idempotentes** (dedup por `event.id`) e com retry exponencial + dead-letter queue (BullMQ).
- Handlers síncronos in-process (EventEmitter2) são permitidos apenas para efeitos internos baratos e sem I/O externo.

## 4. Evolução do transporte (sem mudar contratos)

| Fase | Transporte | Gatilho para evoluir |
|------|-----------|----------------------|
| 1 (MVP) | EventEmitter2 (in-process) + BullMQ/Redis (assíncrono) | — |
| 2 | BullMQ como transporte principal, particionado por tenant | volume/isolamento de carga |
| 3 | Kafka/NATS (broker dedicado) | extração de módulos para serviços |

A publicação passa pelo port `EventBus.publish(event)` — trocar o transporte é trocar o adapter. *Justificativa:* Kafka no dia 1 é custo operacional sem demanda; Redis já está na stack (cache/rate limit/filas). Alternativas consideradas: RabbitMQ (bom, mas mais uma peça para operar), SQS/SNS (lock-in AWS prematuro; Railway é o alvo inicial).

## 5. Webhooks para clientes

Eventos selecionados são replicáveis para endpoints do cliente (`webhook_endpoints`): assinatura HMAC-SHA256 no header, retries com backoff, log completo em `webhook_logs`, e desativação automática após N falhas consecutivas.
