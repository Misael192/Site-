import { StatCard } from "@peopleflow/ui";

export const metadata = { title: "Painel RH" };

export default function RhDashboard() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Recursos Humanos</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vagas abertas" value="—" hint="Recrutamento (Fase 3)" />
        <StatCard label="Candidatos ativos" value="—" hint="Pipeline Kanban" />
        <StatCard label="Turnover (12m)" value="—" hint="Analytics" />
        <StatCard label="eNPS" value="—" hint="Pesquisa de clima (Fase 5)" />
      </div>
    </div>
  );
}
