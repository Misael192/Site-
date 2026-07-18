/**
 * Contratos compartilhados API ↔ Web (doc 12).
 *
 * Na Fase 1 completa este pacote passa a ser gerado a partir do OpenAPI
 * (openapi-typescript). Os tipos manuais abaixo cobrem o núcleo de auth
 * e os padrões de resposta/erro para o scaffold.
 */
import { z } from "zod";

// ── Padrões de resposta (doc 12 §3) ─────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  meta: { requestId: string };
}

export interface ApiList<T> {
  data: T[];
  meta: { nextCursor: string | null; hasMore: boolean; requestId: string };
}

/** Erros seguem RFC 9457 (Problem Details) com catálogo fechado de códigos. */
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  detail?: string;
  requestId: string;
}

export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "MFA_REQUIRED",
  "FORBIDDEN",
  "MODULE_NOT_ENABLED",
  "LIMIT_EXCEEDED",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "TENANT_NOT_FOUND",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// ── Auth ─────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  /** slug do tenant: subdomínio (ex.: "acme" → acme.peopleflow.app) */
  tenantSlug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  organizationName: z.string().min(2).max(120),
  companyName: z.string().min(2).max(120),
  adminName: z.string().min(2).max(120),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(10).max(128),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  tenantSlug: z.string().min(3).max(40),
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthTokens {
  accessToken: string;
  /** opaco, rotativo — doc 05 §1 */
  refreshToken: string;
  expiresInSeconds: number;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roles: string[];
  permissions: string[];
  /** módulos ativos do tenant — o web monta a navegação a partir disto (doc 08 §3) */
  enabledModules: string[];
}

// ── Catálogo de módulos da plataforma (doc 02 §1) ───────────────────────────

export const PLATFORM_MODULES = [
  "people",
  "payroll",
  "recruitment",
  "benefits",
  "learning",
  "performance",
  "documents",
  "analytics",
  "ai",
] as const;

export type PlatformModule = (typeof PLATFORM_MODULES)[number];
