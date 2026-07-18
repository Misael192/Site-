import Link from "next/link";
import { Badge, Button, Card, CardContent } from "@peopleflow/ui";
import { ThemeToggle } from "@/components/theme-toggle";

const MODULES = [
  {
    title: "Departamento Pessoal",
    desc: "Ponto digital com banco de horas, admissão 100% online, GED com assinatura eletrônica e gestão completa de férias.",
  },
  {
    title: "Recursos Humanos",
    desc: "Recrutamento com pipeline Kanban, avaliações de desempenho, benefícios, treinamentos e pesquisas de clima.",
  },
  {
    title: "Portais dedicados",
    desc: "Experiências próprias para Admin, RH, DP, gestores e colaboradores — cada um vê apenas o que precisa.",
  },
  {
    title: "Assistente de IA",
    desc: "Dúvidas de CLT com fontes, geração de contratos e advertências, resumo de currículos e relatórios automáticos.",
  },
  {
    title: "Workflows visuais",
    desc: "Cada empresa desenha seus fluxos de aprovação: férias, ajustes de ponto, admissões e documentos.",
  },
  {
    title: "Multiempresa de verdade",
    desc: "Dados isolados por empresa com criptografia e LGPD by design. Do primeiro CNPJ à operação enterprise.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">
          People<span className="text-[var(--pf-brand-600)]">Flow</span>
        </span>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Começar grátis</Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
          <Badge tone="brand">Plataforma HCM multiempresa</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            DP e RH em um só lugar,{" "}
            <span className="text-[var(--pf-brand-600)]">
              do ponto à performance
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--pf-text-muted)]">
            Ponto digital, admissão online, férias, documentos, recrutamento,
            benefícios e um assistente de IA treinado em CLT — tudo com
            segurança LGPD e portais para cada perfil da sua empresa.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Criar conta — 14 dias grátis</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Acessar minha empresa
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <Card key={m.title}>
                <CardContent>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pf-text-muted)]">
                    {m.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--pf-border)] py-8 text-center text-sm text-[var(--pf-text-subtle)]">
        © {new Date().getFullYear()} PeopleFlow — Plataforma de Gestão de
        Pessoas
      </footer>
    </div>
  );
}
