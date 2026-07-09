# 10 — Workflow Engine

> Requisito 9 da aprovação: **não** workflows fixos — um motor visual em que cada empresa cria seus próprios fluxos.

## 1. Conceito

O Workflow Engine é um módulo do Core que executa **grafos definidos em JSON** (criados num editor visual). Processos como aprovação de férias, admissão, ajuste de ponto e assinatura de documentos **não são hardcoded**: os módulos disparam um *trigger* e o engine conduz o fluxo configurado pelo tenant.

```
Solicitação → Condição → Aprovação → Documento → Assinatura → Fim
```

## 2. Definição do fluxo (workflow_templates)

```jsonc
{
  "name": "Aprovação de Férias",
  "version": 3,
  "trigger": { "event": "people.vacation.requested" },
  "nodes": [
    { "id": "start",  "type": "trigger" },
    { "id": "cond1",  "type": "condition",
      "expr": "input.days > 20",                       // expressão sandboxed
      "onTrue": "apr2", "onFalse": "apr1" },
    { "id": "apr1",   "type": "approval",
      "assignee": { "strategy": "manager_of_requester" },
      "slaHours": 48, "onApprove": "doc", "onReject": "end_rejected" },
    { "id": "apr2",   "type": "approval",
      "assignee": { "strategy": "role", "role": "hr_admin" },
      "onApprove": "apr1", "onReject": "end_rejected" },
    { "id": "doc",    "type": "document",
      "template": "aviso_ferias", "output": "files" },
    { "id": "sign",   "type": "signature",
      "signers": ["requester", "hr_admin"], "after": "doc", "next": "end_ok" },
    { "id": "end_ok", "type": "end", "result": "approved" },
    { "id": "end_rejected", "type": "end", "result": "rejected" }
  ]
}
```

### Tipos de nó (catálogo inicial)

| Tipo | Função |
|------|--------|
| `trigger` | evento de domínio ou ação manual que inicia o fluxo |
| `condition` | expressão sobre o contexto (avaliada em sandbox — sem `eval`) |
| `approval` | tarefa para aprovador (estratégias: gestor do solicitante, role, usuário, cadeia) com SLA/escalonamento |
| `document` | gera documento a partir de template (variáveis do contexto) |
| `signature` | dispara assinatura eletrônica (Core/Files) |
| `notification` | notifica pessoas/canais |
| `webhook` | chama sistema externo |
| `delay` | espera tempo/data |
| `end` | encerra com resultado |

## 3. Execução

- `workflow_instances`: máquina de estados persistida (template+versão, nó atual, contexto JSON, status). Instâncias em andamento continuam na **versão em que começaram** (templates são imutáveis por versão — nova edição gera versão nova).
- `workflow_history`: cada transição gravada (nó, ator, decisão, comentário, timestamp) — trilha de auditoria do processo.
- Avanço de estado é assíncrono (BullMQ): aprovações esperam humanos; SLAs geram jobs agendados de escalonamento; retomada é idempotente.
- Aprovações aparecem como tarefas nos portais (gestor/RH) e por notificação com deep-link.

## 4. Editor visual

- Web: editor drag-and-drop com **React Flow** (nós tipados = paleta do catálogo acima), validação do grafo no cliente e no servidor (sem nós órfãos, sem ciclos sem saída, um `end` alcançável).
- *Justificativa:* React Flow é o padrão de mercado para editores de grafo em React, MIT, controlável pelo nosso Design System. *Alternativas:* BPMN.io/Camunda (BPMN completo é excessivo para usuários de RH e o runtime Camunda é um serviço Java a mais); Temporal (excelente para orquestração de código, mas workflows aqui são dados criados por usuários finais, não código).

## 5. Por que motor próprio (resumo do trade-off)

Um motor próprio sobre Postgres+BullMQ dá: multi-tenancy nativo, versionamento por template, integração direta com RBAC/eventos/assinatura, e UI 100% no nosso Design System. O custo é implementar a máquina de estados — mitigado pelo catálogo pequeno e fechado de nós. Engines prontos trariam servidor adicional, modelo de permissões próprio e fricção com a estratégia de tenancy.
