# 12 — API e Versionamento

> Requisito 11 da aprovação: API versionada desde o nascimento; documentação 100% OpenAPI.

## 1. Versionamento

- **URI versioning:** `/api/v1/...` desde a primeira rota; `/api/v2/...` quando houver breaking change. Implementado com o versionamento nativo do NestJS (`VersioningType.URI`) — controllers podem coexistir em versões diferentes.
- **Política:** uma versão nova só nasce com breaking change real; mudanças aditivas (campo novo opcional, rota nova) entram na versão corrente. Versão anterior recebe sunset anunciado (header `Deprecation` + `Sunset`) com no mínimo 6 meses para clientes de API.
- *Justificativa:* URI versioning é explícito, cacheável e trivial de rotear/documentar. *Alternativas:* header versioning (invisível em logs e curl, atrito para clientes) e query param (fácil de esquecer, polui contratos).

## 2. OpenAPI como contrato

- `@nestjs/swagger` gera o documento OpenAPI 3.1 a partir dos DTOs/decorators — a documentação **nasce do código** e não desatualiza.
- Swagger UI em `/api/docs` (protegido fora de produção pública); JSON em `/api/docs-json`.
- **Pipeline de contratos:** o JSON gerado alimenta `packages/contracts` (openapi-typescript) → o frontend consome um cliente **tipado**. Breaking change na API quebra o typecheck do web no CI, não em produção.
- Lint de API no CI (Spectral): nomes, paginação, códigos de erro e padrões abaixo são verificados automaticamente.

## 3. Padrões de resposta

### Sucesso
```json
{ "data": { }, "meta": { "requestId": "…" } }
```

### Listas — paginação por cursor
```json
{ "data": [ ], "meta": { "nextCursor": "…", "hasMore": true, "requestId": "…" } }
```
Cursor (UUID v7 ordenável) em vez de offset: estável sob inserção concorrente e O(1) no banco. Filtros e ordenação documentados por recurso (`?status=…&sort=-createdAt`).

### Erros — RFC 9457 (Problem Details)
```json
{
  "type": "https://docs.peopleflow.app/errors/limit-exceeded",
  "title": "Limite do plano excedido",
  "status": 402,
  "code": "LIMIT_EXCEEDED",
  "detail": "O plano atual permite 100 colaboradores.",
  "requestId": "…"
}
```
Catálogo fechado de `code`s (documentado no OpenAPI); mensagens localizadas ficam no front — a API retorna códigos estáveis.

## 4. Convenções

| Tema | Regra |
|------|-------|
| Recursos | substantivos no plural: `/api/v1/employees/{id}/vacations` |
| Autenticação | `Authorization: Bearer <jwt>` ou `X-Api-Key` (server-to-server) |
| Idempotência | mutações críticas (billing, assinatura) aceitam `Idempotency-Key` |
| Rate limit | headers `RateLimit-*` em toda resposta (doc 05 §3) |
| Datas | ISO-8601 UTC; timezone é responsabilidade da apresentação |
| Correlação | `X-Request-Id` ecoado e ligado a trace/logs/auditoria (doc 07) |
