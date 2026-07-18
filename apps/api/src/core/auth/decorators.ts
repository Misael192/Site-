import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "pf:is_public";
/** Marca rota como pública (sem JWT) — login, signup, health, Trabalhe Conosco. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRED_PERMISSION_KEY = "pf:required_permission";
/** Exige permissão RBAC `module.resource.action` (doc 05 §2). */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
