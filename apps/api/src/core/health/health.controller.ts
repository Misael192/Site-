import {
  Controller,
  Get,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Health checks (doc 07 §1): `live` = processo vivo (restart);
 * `ready` = dependências ok (roteamento de tráfego/deploy).
 */
@ApiTags("health")
// health não é versionado nem prefixado — é contrato com o orquestrador
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get("live")
  live() {
    return { status: "ok" };
  }

  @Public()
  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: "degraded", database: "down" });
    }
    return { status: "ok", database: "up" };
  }
}
