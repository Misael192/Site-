import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule, type JwtSignOptions } from "@nestjs/jwt";
import { loadEnv } from "../../config/env";
import { AuditService } from "../audit/audit.service";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { TenantContextService } from "../tenants/tenant-context";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { ProvisioningService } from "./provisioning.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const env = loadEnv();
        return {
          privateKey: env.jwtPrivateKey,
          publicKey: env.jwtPublicKey,
          signOptions: {
            algorithm: "RS256",
            expiresIn: env.jwtAccessTtl as JwtSignOptions["expiresIn"],
          },
          verifyOptions: { algorithms: ["RS256"] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ProvisioningService,
    AuditService,
    TenantContextService,
    // ordem importa: autentica primeiro, depois autoriza (doc 05 §2)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [TenantContextService, AuditService],
})
export class AuthModule {}
