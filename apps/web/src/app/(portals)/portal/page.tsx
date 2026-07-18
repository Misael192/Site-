import { StatCard } from "@peopleflow/ui";

export const metadata = { title: "Portal do Colaborador" };

export default function EmployeeDashboard() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Bem-vindo(a) 👋</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Banco de horas" value="—" hint="Ponto (Fase 2)" />
        <StatCard label="Saldo de férias" value="—" hint="dias disponíveis" />
        <StatCard label="Último holerite" value="—" hint="Payroll (Fase 6)" />
        <StatCard label="Documentos pendentes" value="—" hint="assinaturas" />
      </div>
    </div>
  );
}
