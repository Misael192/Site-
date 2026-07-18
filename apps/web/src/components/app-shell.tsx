import Link from "next/link";
import { Badge } from "@peopleflow/ui";
import { ThemeToggle } from "./theme-toggle";

export interface NavItem {
  label: string;
  href: string;
}

/**
 * Shell padrão dos portais (doc 13 §4 — AppShell): sidebar por portal +
 * topbar. A navegação exibida vem do portal; na Fase 1 completa ela é
 * filtrada pelos entitlements do tenant (doc 08 §3).
 */
export function AppShell({
  portalName,
  nav,
  children,
}: {
  portalName: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-5 sm:flex">
        <Link href="/" className="px-2 text-base font-bold tracking-tight">
          People<span className="text-[var(--pf-brand-600)]">Flow</span>
        </Link>
        <span className="mt-1 px-2">
          <Badge tone="brand">{portalName}</Badge>
        </span>
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="pf-focus rounded-[var(--pf-radius-md)] px-3 py-2 text-sm text-[var(--pf-text-muted)] transition-colors hover:bg-[var(--pf-bg)] hover:text-[var(--pf-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[var(--pf-border)] bg-[var(--pf-surface)] px-6">
          <span className="text-sm font-medium text-[var(--pf-text-muted)]">
            {portalName}
          </span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
