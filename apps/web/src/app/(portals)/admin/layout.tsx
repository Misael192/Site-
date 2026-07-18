import { AppShell } from "@/components/app-shell";

const NAV = [
  { label: "Visão geral", href: "/admin" },
  { label: "Empresas e filiais", href: "/admin" },
  { label: "Departamentos e cargos", href: "/admin" },
  { label: "Usuários e permissões", href: "/admin" },
  { label: "Módulos e plano", href: "/admin" },
  { label: "Auditoria", href: "/admin" },
  { label: "Configurações", href: "/admin" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Administração" nav={NAV}>
      {children}
    </AppShell>
  );
}
