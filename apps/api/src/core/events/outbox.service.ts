import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { DomainEvent } from "@peopleflow/events";
import { Prisma } from "@peopleflow/database";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Outbox Pattern (doc 06 §3, ADR-010).
 *
 * `append` grava o evento NA MESMA transação do estado de negócio;
 * o dispatcher publica pendentes no barramento in-process (EventEmitter2).
 * Fase 2: dispatcher passa a publicar também em BullMQ para handlers com I/O.
 */
@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  /** Grava o evento dentro da transação corrente (atomicidade estado+evento). */
  async append(tx: Prisma.TransactionClient, event: DomainEvent): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        id: event.id,
        tenantId: event.tenantId,
        name: event.name,
        envelope: event as unknown as Prisma.InputJsonValue,
      },
    });
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.dispatchPending();
    }, 2_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async dispatchPending(): Promise<void> {
    const pending = await this.prisma.outboxEvent.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    for (const row of pending) {
      try {
        const envelope = row.envelope as unknown as DomainEvent;
        await this.emitter.emitAsync(row.name, envelope);
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
      } catch (err) {
        this.logger.error(`Falha ao publicar evento ${row.name}#${row.id}`, err);
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: { status: "FAILED", attempts: { increment: 1 } },
        });
      }
    }
  }
}
