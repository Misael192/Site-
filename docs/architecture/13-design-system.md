# 13 — Design System: Flow UI

> Decisão relacionada: ADR-012. Requisito 12 da aprovação: Design System próprio da PeopleFlow, não apenas shadcn.

## 1. Estratégia

**Flow UI** é o Design System proprietário, publicado como `packages/ui`. Ele usa **Radix UI (primitivos de acessibilidade) e shadcn como camada de partida interna**, mas tudo que os apps consomem é a API do Flow UI: tokens, componentes e guidelines próprios. Nenhum app importa shadcn/Radix diretamente.

- *Justificativa:* escrever primitivos acessíveis (focus trap, aria, teclado) do zero é caro e propenso a erro — Radix resolve isso; shadcn dá implementações de referência **que passam a ser código nosso** (copiadas, não dependência). A identidade, os tokens e a API pública são 100% PeopleFlow — atendendo ao requisito sem reinventar acessibilidade.
- *Alternativas:* usar shadcn puro (visual genérico, sem identidade — rejeitado pelo requisito); MUI/Ant (identidade forte demais deles, theming lutando contra o framework); tudo do zero (custo e risco de acessibilidade).

## 2. Tokens (fonte única: `packages/ui/tokens`)

Definidos em JSON (Style Dictionary) e emitidos como CSS variables + preset Tailwind — **um só lugar alimenta web, e futuramente mobile**.

```
Cores
├── brand:    primary (indigo→violet), accent (teal)
├── semantic: success / warning / danger / info
├── neutral:  12 steps (base das superfícies)
└── surface:  bg, card, elevated, overlay — mapeados por tema

Temas: light e dark de primeira classe — tokens semânticos trocam por [data-theme];
       componentes NUNCA usam cor crua, só token semântico.

Tipografia: Inter (UI) + JetBrains Mono (dados/tabelas)
├── escala: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48
└── pesos: 400 / 500 / 600 / 700 — line-height e tracking por passo

Espaçamento: escala de 4px (0.5 → 24 = 2px → 96px)
Raios: sm 6 / md 10 / lg 16 / full
Sombras: 5 níveis de elevação (com variante dark)
Grid: 12 colunas fluidas, gutter 24px; breakpoints sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536
Z-index: escala nomeada (dropdown < sticky < overlay < modal < toast)
Ícones: Lucide (stroke 1.5, grid 24) — biblioteca única para consistência
```

## 3. Motion Guidelines (Framer Motion)

| Regra | Valor |
|-------|-------|
| Durações | micro 120ms · padrão 200ms · entradas de página 300ms |
| Easing | `ease-out` para entradas, `ease-in` para saídas, spring leve para elementos interativos |
| Princípio | animação comunica hierarquia e causa-efeito; nunca decorativa em fluxo de trabalho |
| Acessibilidade | `prefers-reduced-motion` desativa tudo exceto opacidade |
| Padrões prontos | page transition, stagger de listas, feedback de sucesso, skeleton shimmer |

## 4. Catálogo de componentes (v1)

- **Base:** Button, IconButton, Input, Select, Combobox, DatePicker, Checkbox, Radio, Switch, Textarea, Badge, Avatar, Tooltip, Tabs, Accordion, Dialog, Drawer, Popover, Toast, Skeleton, EmptyState.
- **Dados:** DataTable (server-side: ordenação/filtro/paginação por cursor), StatCard (KPI), ChartContainer (Recharts tematizado pelos tokens), Timeline, KanbanBoard (pipeline de recrutamento), Calendar (férias/escalas).
- **Aplicação:** AppShell (sidebar por portal + topbar + breadcrumb), PageHeader, FormSection, FilterBar, ApprovalCard (workflows), FileUploader, SignaturePad, OrgChart.
- Cada componente com: estados (hover/focus/disabled/loading/error), documentação em **Storybook**, testes de acessibilidade (axe) no CI.

## 5. Qualidade visual de referência

Direção estética inspirada em Stripe/Notion/Linear (densidade calma, contraste tipográfico, cor com parcimônia) e nos HCMs Sólides/Convenia/Gupy para padrões de domínio (pipeline, calendário de férias, holerite). Dark mode não é filtro invertido: superfícies e elevações têm mapa próprio de tokens.
