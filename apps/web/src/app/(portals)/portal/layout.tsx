import { AppShell } from "@/components/app-shell";

const NAV = [
  { label: "Início", href: "/portal" },
  { label: "Registrar ponto", href: "/portal" },
  { label: "Meus holerites", href: "/portal" },
  { label: "Minhas férias", href: "/portal" },
  { label: "Documentos", href: "/portal" },
  { label: "Benefícios", href: "/portal" },
  { label: "Cursos", href: "/portal" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Portal do Colaborador" nav={NAV}>
      {children}
    </AppShell>
  );
}
