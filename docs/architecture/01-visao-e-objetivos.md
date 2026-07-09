# 01 — Visão e Objetivos

## 1. O que é a PeopleFlow

A PeopleFlow é uma **plataforma HCM (Human Capital Management) multi-tenant** que unifica Departamento Pessoal (DP) e Recursos Humanos (RH) em um único produto SaaS, com portais dedicados por persona e um Core de plataforma que sustenta módulos plugáveis.

## 2. Objetivo de escala (requisito 13 da aprovação)

A arquitetura deve suportar, **sem refatoração arquitetural**:

| Estágio | Empresas | Implicação arquitetural |
|---------|----------|-------------------------|
| Lançamento | 1 | Custo mínimo: 1 banco, 1 API, tenancy por coluna |
| Tração | 100 | RLS + índices compostos por tenant, cache Redis por tenant |
| Crescimento | 1.000 | Tenants "quentes" migram para schema dedicado; filas particionadas |
| Enterprise | 10.000 | Tenants enterprise em banco dedicado; sharding por `tenant_id` |

O que torna isso possível sem reescrita é a **abstração de tenancy** (ver [doc 03](./03-multi-tenancy.md)): nenhum código de módulo conhece a estratégia física de isolamento — ele só conhece o `TenantContext`.

## 3. Personas e portais

| Portal | Persona | Capacidades principais |
|--------|---------|------------------------|
| **Landing Page** | Visitante | Institucional, planos, Trabalhe Conosco público por empresa |
| **Painel Administrativo** | Admin da plataforma / Admin da empresa | Empresas, filiais, departamentos, cargos, usuários, permissões (RBAC), feature flags, billing, logs, auditoria, configurações |
| **Painel do RH** | Analista/Gestor de RH | Recrutamento (vagas, pipeline Kanban, entrevistas), gestão comportamental, benefícios, desenvolvimento/performance, engajamento (clima, reconhecimento, mural) |
| **Painel do DP** | Analista de DP | Ponto (banco de horas, escalas, jornadas, aprovações), admissão digital, documentos (GED), férias, relatórios |
| **Portal do Gestor** | Líder de equipe | Aprovações (férias, horas extras, documentos, admissões), indicadores da equipe, relatórios |
| **Portal do Colaborador** | Funcionário | Login, cadastro, holerites, férias, ponto, documentos, benefícios, cursos, assinaturas, banco de horas |

## 4. Módulos de negócio (visão de produto)

### Departamento Pessoal
1. **Controle de Ponto Digital** — registro online (web/mobile), banco de horas, horas extras, escalas, jornada, aprovação de ajustes, relatórios, geolocalização opcional.
2. **Admissão Digital** — cadastro, upload de documentos, checklist, assinatura eletrônica, contratos, histórico.
3. **Gestão Eletrônica de Documentos (GED)** — nuvem, organização por colaborador, versões, assinatura digital, compartilhamento seguro, permissões.
4. **Gestão de Férias** — solicitação, aprovação, calendário, histórico, alertas automáticos, relatórios.

### Recursos Humanos
1. **Recrutamento e Seleção** — vagas, página Trabalhe Conosco, banco de currículos, pipeline Kanban, entrevistas, avaliação de candidatos, histórico.
2. **Gestão Comportamental** — avaliações, feedbacks, competências, perfil comportamental, histórico de desempenho.
3. **Benefícios Corporativos** — cadastro, utilização, convênios, VT/VA, plano de saúde, relatórios.
4. **Desenvolvimento e Performance** — plano de carreira, metas, avaliações periódicas, treinamentos, certificados, indicadores.
5. **Engajamento e Retenção** — pesquisa de clima e satisfação, reconhecimento, comunicação interna, mural, indicadores de retenção.

### Transversais
- **Dashboard** — colaboradores, admissões, demissões, férias, banco de horas, absenteísmo, turnover, benefícios, vagas, candidatos, desempenho — tudo em gráficos.
- **Assistente de IA** — dúvidas de CLT, advertências, contratos, descrições de cargo, comunicados, resumo de currículos, apoio ao recrutamento, relatórios automáticos.

## 5. Requisitos não-funcionais (resumo)

| Requisito | Como é atendido | Doc |
|-----------|-----------------|-----|
| Multi-tenancy evolutivo | Coluna → Schema → Banco atrás de abstração | 03 |
| Segurança | MFA, RBAC+ABAC, JWT rotativo, AES-256, Argon2, rate limit, CSRF/CSP/Helmet | 05 |
| LGPD | Privacy by design: consentimento, minimização, eliminação, auditoria | 05 |
| Escalabilidade | Modular monolith extraível, eventos, cache, filas | 02, 06 |
| Observabilidade | OpenTelemetry, métricas, logs estruturados, tracing, error tracking | 07 |
| Modularidade comercial | Feature flags por empresa + entitlements por plano | 08, 09 |
| Extensibilidade de processos | Workflow Engine visual por empresa | 10 |
| Qualidade | Clean Architecture, SOLID, testes automatizados, OpenAPI, ADRs | 02, 12, 15 |
