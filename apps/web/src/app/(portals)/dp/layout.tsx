import { AppShell } from "@/components/app-shell";

const NAV = [
  { label: "Dashboard", href: "/dp" },
  { label: "Colaboradores", href: "/dp" },
  { label: "Ponto e jornada", href: "/dp" },
  { label: "Admissões", href: "/dp" },
  { label: "Férias", href: "/dp" },
  { label: "Documentos", href: "/dp" },
];

export default function DpLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Painel DP" nav={NAV}>
      {children}
    </AppShell>
  );
}
