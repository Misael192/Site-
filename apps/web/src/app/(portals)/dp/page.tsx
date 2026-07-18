import { StatCard } from "@peopleflow/ui";

export const metadata = { title: "Painel DP" };

export default function DpDashboard() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Departamento Pessoal</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Admissões em andamento" value="—" hint="Fase 2" />
        <StatCard label="Ajustes de ponto pendentes" value="—" hint="Fase 2" />
        <StatCard label="Férias a vencer" value="—" hint="Alertas automáticos" />
        <StatCard label="Absenteísmo" value="—" hint="Analytics" />
      </div>
    </div>
  );
}
