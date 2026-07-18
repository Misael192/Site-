import { StatCard } from "@peopleflow/ui";

export const metadata = { title: "Administração" };

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Visão geral da plataforma</h1>
      <p className="mt-1 text-sm text-[var(--pf-text-muted)]">
        Indicadores gerais do tenant. Dados reais entram com o módulo
        Analytics (Fase 3).
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Colaboradores ativos" value="—" hint="módulo People" />
        <StatCard label="Usuários" value="—" hint="Identity" />
        <StatCard label="Módulos ativos" value="—" hint="Feature flags" />
        <StatCard label="Plano" value="Starter" hint="Billing" />
      </div>
    </div>
  );
}
