import { Module } from "@nestjs/common";
import { AuthModule } from "./core/auth/auth.module";
import { EventsModule } from "./core/events/events.module";
import { HealthController } from "./core/health/health.controller";
import { PrismaModule } from "./core/prisma/prisma.module";

/**
 * Raiz da plataforma (doc 02 §1).
 *
 * Core: Prisma (dados), Events (barramento+outbox), Auth (Identity/IAM/RBAC).
 * Módulos de negócio (People, Recruitment, …) entram nas Fases 2+ como
 * imports adicionais — cada um com suas camadas de Clean Architecture.
 */
@Module({
  imports: [PrismaModule, EventsModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
