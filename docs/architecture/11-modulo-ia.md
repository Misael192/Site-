# 11 — Módulo de IA (AI Engine)

> Decisão relacionada: ADR-014. Requisito 10 da aprovação: IA nasce como módulo independente; novos agentes entram sem alterar o restante da plataforma.

## 1. Arquitetura

```
AI Engine (Core/AI)
├── Chat               # conversas persistidas (ai_conversations / ai_messages), streaming SSE
├── Prompt Library     # prompts versionados por caso de uso (ai_prompts)
├── Knowledge Base     # documentos por tenant + base global (CLT, normas)
├── Embeddings         # pgvector; pipeline de ingestão (chunking → embedding → índice)
├── RAG                # retrieve → rerank → augment → generate, com citações
├── Agents             # registry de agentes especializados (plugáveis)
├── Memory             # curto prazo (janela da conversa) + longo prazo (fatos por usuário/tenant)
├── Tools              # function calling: ferramentas expostas pelos módulos
└── Logs               # ai_usage_logs: tokens, custo, latência por tenant (billing + limites)
```

### Contratos que garantem independência

```ts
interface LLMProvider {            // adapter: Claude API (padrão); trocável
  complete(req: CompletionRequest): AsyncIterable<CompletionChunk>;
  embed(texts: string[]): Promise<number[][]>;
}

interface Agent {                  // novos agentes = nova classe registrada; zero mudança no resto
  slug: string;                    // "clt-assistant", "recruiter-copilot"
  systemPrompt(ctx: TenantContext): string;
  tools(): ToolDefinition[];       // subconjunto do Tool Registry
  guardrails(): Guardrail[];
}

interface AITool {                 // módulos expõem ferramentas; o engine não conhece domínio
  name: string;                    // "get_employee_vacation_balance"
  requiredPermission: string;      // reusa RBAC — a IA NUNCA excede a permissão do usuário
  schema: JSONSchema;
  execute(input, ctx): Promise<unknown>;
}
```

## 2. Agentes do lançamento (casos de uso do produto)

| Agente | Entrega |
|--------|---------|
| **Assistente CLT** | dúvidas trabalhistas via RAG sobre base curada (CLT, súmulas, reforma) — com citações e disclaimer de não-aconselhamento jurídico |
| **Gerador de documentos** | advertências, contratos, comunicados internos, descrições de cargo — a partir da Prompt Library + dados do contexto (via tools) |
| **Copiloto de recrutamento** | resume currículos, compara candidatos à vaga, sugere perguntas de entrevista |
| **Analista de relatórios** | gera relatórios narrativos a partir de indicadores (tools do módulo Analytics) |

Adicionar um agente = registrar nova implementação de `Agent`. Nenhuma mudança em chat, RAG, memória ou billing.

## 3. Segurança e tenancy da IA

- **Isolamento de conhecimento:** embeddings e documentos sempre filtrados por `tenant_id` (+ RLS); a base global (CLT) é somente leitura e compartilhada.
- **Permissões:** toda tool executa com o RBAC do usuário da conversa — a IA não lê férias, salários ou documentos que o usuário não pode ler.
- **Dados sensíveis:** redaction de PII configurável antes do envio ao provedor; logs de IA não armazenam conteúdo sensível bruto.
- **Custos/limites:** cada chamada registra tokens em `ai_usage_logs`; `LimitsService` (doc 09) corta ao atingir a cota do plano; módulo IA é entitlement (doc 08).

## 4. Decisões (ADR-014)

- **pgvector em vez de vector DB dedicado (Pinecone/Qdrant):** os vetores moram ao lado dos dados com o mesmo modelo de tenancy/RLS e sem um serviço a mais; volume por tenant (documentos de RH) está confortavelmente na faixa do pgvector com HNSW. Migração futura fica atrás do port `VectorStore`.
- **Claude API como provedor padrão** atrás de `LLMProvider`: qualidade em português jurídico/trabalhista e tool use maduro; o port garante que trocar/adicionar provedor (ou modelos por tarefa: barato para resumo, topo de linha para geração de contrato) não toca os agentes.
- **RAG com citações obrigatórias no Assistente CLT:** requisito de confiabilidade — resposta sem fonte recuperada vira "não sei" em vez de alucinação.
