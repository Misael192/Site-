import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "./decorators";
import { AuthService } from "./auth.service";
import { ProvisioningService } from "./provisioning.service";
import { LoginDto, RefreshDto, SignupDto } from "./dto";
import { TenantContextService } from "../tenants/tenant-context";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly provisioning: ProvisioningService,
    private readonly ctx: TenantContextService,
  ) {}

  @Public()
  @Post("signup")
  @ApiOperation({ summary: "Cria tenant + admin (provisioning completo) e autentica" })
  async signup(@Body() dto: SignupDto, @Req() req: Request) {
    await this.provisioning.provisionTenant(dto);
    const tokens = await this.auth.login({
      tenantSlug: dto.tenantSlug,
      email: dto.adminEmail,
      password: dto.adminPassword,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    });
    return { data: tokens };
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Autentica e emite access JWT + refresh rotativo" })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const tokens = await this.auth.login({
      ...dto,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    });
    return { data: tokens };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Rotaciona o refresh token (detecção de reuso)" })
  async refresh(@Body() dto: RefreshDto) {
    return { data: await this.auth.refresh(dto.refreshToken) };
  }

  @Post("logout")
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoga a sessão corrente" })
  async logout(): Promise<void> {
    const { sessionId, tenantId } = this.ctx.get();
    await this.auth.logout(sessionId, tenantId);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Perfil + roles + permissões + módulos ativos do tenant" })
  async me() {
    const { tenantId, userId } = this.ctx.get();
    return { data: await this.auth.me(tenantId, userId) };
  }
}
