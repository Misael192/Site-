import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-surface)]",
        "shadow-[var(--pf-shadow-1)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-[var(--pf-text)]", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

/** KPI de dashboard (doc 13 §4 — StatCard). */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-[var(--pf-text-muted)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--pf-text)]">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-[var(--pf-text-subtle)]">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
