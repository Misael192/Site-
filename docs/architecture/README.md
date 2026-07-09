# PeopleFlow Platform — Documento de Arquitetura (Fase 1)

> **Status:** Aprovado — Fase 1, com os 13 requisitos adicionais incorporados.
> **Versão:** 1.0.0 · **Data:** 2026-07-09
> **Escopo:** Plataforma HCM multi-tenant (Departamento Pessoal + Recursos Humanos), preparada para evoluir de 1 a 10.000 empresas sem refatoração arquitetural.

## Princípio norteador

A PeopleFlow **não é um SaaS de RH — é uma plataforma**. Todos os módulos de negócio (Pessoas, Folha, Recrutamento, Benefícios, etc.) são plugáveis sobre um **Core** que resolve identidade, tenancy, permissões, billing, eventos, workflows, arquivos, notificações, auditoria e IA. Nenhum módulo de negócio acessa infraestrutura diretamente: tudo passa pelos contratos do Core.

## Índice dos documentos

| Nº | Documento | Conteúdo |
|----|-----------|----------|
| 01 | [Visão e Objetivos](./01-visao-e-objetivos.md) | Produto, personas, portais, metas de escala |
| 02 | [Arquitetura da Plataforma](./02-arquitetura-da-plataforma.md) | Core + Modules, monorepo, Clean Architecture, modularidade |
| 03 | [Multi-tenancy](./03-multi-tenancy.md) | Estratégia evolutiva: coluna → schema → banco |
| 04 | [Modelo de Dados](./04-modelo-de-dados.md) | Entidades do Core e dos módulos, convenções, Prisma |
| 05 | [Segurança e LGPD](./05-seguranca-e-lgpd.md) | MFA, RBAC/ABAC, JWT rotativo, criptografia, LGPD by design |
| 06 | [Arquitetura de Eventos](./06-arquitetura-de-eventos.md) | Barramento interno, outbox, contratos de eventos |
| 07 | [Observabilidade](./07-observabilidade.md) | OpenTelemetry, health checks, métricas, logs, tracing |
| 08 | [Feature Flags](./08-feature-flags.md) | Ativação de módulos por empresa, entitlements |
| 09 | [Billing](./09-billing.md) | Planos, assinaturas, limites, upgrade/downgrade |
| 10 | [Workflow Engine](./10-workflow-engine.md) | Motor visual de fluxos configuráveis por empresa |
| 11 | [Módulo de IA](./11-modulo-ia.md) | AI Engine independente: chat, RAG, agentes, memória, tools |
| 12 | [API e Versionamento](./12-api-e-versionamento.md) | `/api/v1`, OpenAPI, contratos, erros, paginação |
| 13 | [Design System](./13-design-system.md) | Flow UI: tokens, tipografia, grid, componentes, motion |
| 14 | [Roadmap de Implementação](./14-roadmap.md) | Fases, entregáveis e critérios de aceite |
| 15 | [Registro de Decisões (ADRs)](./15-decisoes-tecnicas-adr.md) | Todas as decisões com justificativa e alternativas |

## Requisito de qualidade transversal

Conforme a aprovação da Fase 1: **toda decisão técnica importante vem acompanhada de justificativa** — por que a tecnologia/abordagem foi escolhida e quais alternativas foram consideradas. As decisões estão consolidadas no documento [15 — ADRs](./15-decisoes-tecnicas-adr.md) e referenciadas em cada documento como `ADR-NNN`.

## Stack (resumo)

| Camada | Tecnologia | ADR |
|--------|-----------|-----|
| Frontend | Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Flow UI (Design System próprio sobre Radix/shadcn), Framer Motion | ADR-002, ADR-012 |
| Backend | NestJS (modular monolith extraível), TypeScript, Clean Architecture | ADR-003, ADR-004 |
| Banco | PostgreSQL 16 + Prisma ORM + RLS + pgvector | ADR-005, ADR-006 |
| Cache/Filas | Redis (cache, rate limit, BullMQ) | ADR-007 |
| Auth | JWT (access curto) + refresh token rotativo, MFA TOTP, Argon2id | ADR-008 |
| Armazenamento | Supabase Storage (MVP) → Amazon S3 (produção), atrás de `FileStorage` port | ADR-009 |
| Eventos | Event bus interno NestJS + Outbox Pattern → BullMQ → (futuro) Kafka | ADR-010 |
| Observabilidade | OpenTelemetry, Prometheus, pino, Sentry | ADR-011 |
| Deploy | Vercel (web) + Railway (API/DB/Redis) + Docker | ADR-013 |
| IA | Claude API atrás de `LLMProvider` port, RAG com pgvector | ADR-014 |
