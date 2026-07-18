import { AppShell } from "@/components/app-shell";

const NAV = [
  { label: "Dashboard", href: "/rh" },
  { label: "Recrutamento", href: "/rh" },
  { label: "Avaliações", href: "/rh" },
  { label: "Benefícios", href: "/rh" },
  { label: "Treinamentos", href: "/rh" },
  { label: "Clima e engajamento", href: "/rh" },
];

export default function RhLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Painel RH" nav={NAV}>
      {children}
    </AppShell>
  );
}
