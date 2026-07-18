import type {
  ApiProblem,
  AuthTokens,
  LoginInput,
  SignupInput,
} from "@peopleflow/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

class ApiError extends Error {
  constructor(public readonly problem: ApiProblem) {
    super(problem.detail ?? problem.title);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { data: T } | ApiProblem;
  if (!res.ok) throw new ApiError(json as ApiProblem);
  return (json as { data: T }).data;
}

export const api = {
  login: (input: LoginInput) => post<AuthTokens>("/api/v1/auth/login", input),
  signup: (input: SignupInput) => post<AuthTokens>("/api/v1/auth/signup", input),
};

/**
 * Armazenamento de tokens do scaffold (localStorage).
 * Fase 1 completa: refresh token migra para cookie httpOnly emitido pela
 * API (doc 05 §1) — este módulo é o único ponto a mudar.
 */
export const tokenStore = {
  save(tokens: AuthTokens) {
    localStorage.setItem("pf-access", tokens.accessToken);
    localStorage.setItem("pf-refresh", tokens.refreshToken);
  },
  accessToken: () => localStorage.getItem("pf-access"),
  clear() {
    localStorage.removeItem("pf-access");
    localStorage.removeItem("pf-refresh");
  },
};
