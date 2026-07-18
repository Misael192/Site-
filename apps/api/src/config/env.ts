/**
 * Configuração validada no boot (doc 05 §7): a aplicação NÃO SOBE se a
 * configuração de segurança estiver ausente/inválida em produção.
 */
import { generateKeyPairSync } from "node:crypto";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(3001),
  API_CORS_ORIGINS: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY_BASE64: z.string().optional(),
  JWT_PUBLIC_KEY_BASE64: z.string().optional(),
  JWT_ACCESS_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
});

export interface AppEnv {
  nodeEnv: "development" | "test" | "production";
  port: number;
  corsOrigins: string[];
  jwtPrivateKey: string;
  jwtPublicKey: string;
  jwtAccessTtl: string;
  refreshTokenTtlDays: number;
}

let cached: AppEnv | null = null;

export function loadEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.parse(process.env);

  let privateKey = parsed.JWT_PRIVATE_KEY_BASE64
    ? Buffer.from(parsed.JWT_PRIVATE_KEY_BASE64, "base64").toString("utf8")
    : undefined;
  let publicKey = parsed.JWT_PUBLIC_KEY_BASE64
    ? Buffer.from(parsed.JWT_PUBLIC_KEY_BASE64, "base64").toString("utf8")
    : undefined;

  if (!privateKey || !publicKey) {
    // Em produção o par RS256 é obrigatório (ADR-008); em dev geramos um
    // par efêmero para não bloquear o primeiro `pnpm dev`.
    if (parsed.NODE_ENV === "production") {
      throw new Error(
        "JWT_PRIVATE_KEY_BASE64/JWT_PUBLIC_KEY_BASE64 são obrigatórias em produção",
      );
    }
    const pair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
    // eslint-disable-next-line no-console
    console.warn(
      "[env] JWT keys ausentes — usando par RS256 efêmero (somente dev).",
    );
  }

  cached = {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.API_PORT,
    corsOrigins: parsed.API_CORS_ORIGINS.split(",").map((s) => s.trim()),
    jwtPrivateKey: privateKey,
    jwtPublicKey: publicKey,
    jwtAccessTtl: parsed.JWT_ACCESS_TTL,
    refreshTokenTtlDays: parsed.REFRESH_TOKEN_TTL_DAYS,
  };
  return cached;
}
