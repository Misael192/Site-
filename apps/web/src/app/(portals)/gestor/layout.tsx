import { AppShell } from "@/components/app-shell";

const NAV = [
  { label: "Minha equipe", href: "/gestor" },
  { label: "Aprovações", href: "/gestor" },
  { label: "Indicadores", href: "/gestor" },
  { label: "Relatórios", href: "/gestor" },
];

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Portal do Gestor" nav={NAV}>
      {children}
    </AppShell>
  );
}
