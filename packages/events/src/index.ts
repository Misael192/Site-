/**
 * Contratos de eventos de domínio — doc 06 (Arquitetura de Eventos).
 *
 * Todos os módulos publicam e consomem eventos usando este envelope.
 * O transporte (EventEmitter2/BullMQ/Kafka) é um detalhe do adapter;
 * o contrato definido aqui é estável entre fases (ADR-010).
 */
import { v7 as uuidv7 } from "uuid";

/** Envelope único de todos os eventos da plataforma. */
export interface DomainEvent<TPayload = unknown> {
  /** UUID v7 — ordenável no tempo, usado para deduplicação nos handlers. */
  id: string;
  /** Nome no padrão `modulo.entidade.acao` (passado). Ex.: "people.vacation.approved". */
  name: EventName;
  /** Versão do schema do payload — payloads evoluem sem quebrar consumidores. */
  version: number;
  tenantId: string;
  /** Usuário/sistema que causou o evento (null para jobs automáticos). */
  actorId: string | null;
  /** ISO-8601 UTC. */
  occurredAt: string;
  /** Igual ao trace_id da requisição de origem (doc 07 — correlação ponta a ponta). */
  correlationId: string;
  /** id do evento que causou este, quando em cadeia. */
  causationId: string | null;
  payload: TPayload;
}

/** Catálogo inicial de eventos (doc 06 §2). Novos eventos entram aqui. */
export const EVENT_NAMES = [
  // Core
  "core.tenant.provisioned",
  "core.user.created",
  "core.user.password_changed",
  "core.session.refresh_reuse_detected",
  "billing.subscription.created",
  "billing.subscription.upgraded",
  "billing.subscription.downgraded",
  "platform.flag.changed",
  "files.signature.completed",
  "workflow.instance.started",
  "workflow.instance.completed",
  // People / DP
  "people.employee.created",
  "people.employee.updated",
  "people.employee.terminated",
  "people.vacation.requested",
  "people.vacation.approved",
  "people.vacation.rejected",
  "people.time_entry.recorded",
  "people.time_adjustment.requested",
  "people.time_adjustment.approved",
  // Recrutamento
  "recruitment.job_opening.published",
  "recruitment.candidate.applied",
  "recruitment.application.stage_changed",
  // Payroll (fase futura — contrato reservado desde já)
  "payroll.payroll.generated",
  "payroll.payslip.signed",
  "esocial.event.sent",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface CreateEventInput<TPayload> {
  name: EventName;
  version?: number;
  tenantId: string;
  actorId?: string | null;
  correlationId: string;
  causationId?: string | null;
  payload: TPayload;
}

/** Fábrica que garante envelope completo e consistente. */
export function createDomainEvent<TPayload>(
  input: CreateEventInput<TPayload>,
): DomainEvent<TPayload> {
  return {
    id: uuidv7(),
    name: input.name,
    version: input.version ?? 1,
    tenantId: input.tenantId,
    actorId: input.actorId ?? null,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    payload: input.payload,
  };
}
