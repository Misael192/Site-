import { StatCard } from "@peopleflow/ui";

export const metadata = { title: "Portal do Gestor" };

export default function GestorDashboard() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Minha equipe</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pessoas na equipe" value="—" hint="People" />
        <StatCard label="Aprovações pendentes" value="—" hint="Workflows (Fase 2)" />
        <StatCard label="Férias agendadas" value="—" hint="Calendário" />
        <StatCard label="Horas extras no mês" value="—" hint="Ponto" />
      </div>
    </div>
  );
}
