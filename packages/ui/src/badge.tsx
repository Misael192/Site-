import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  brand: "bg-[var(--pf-brand-100)] text-[var(--pf-brand-700)]",
  success: "bg-[color-mix(in_srgb,var(--pf-success)_14%,transparent)] text-[var(--pf-success)]",
  warning: "bg-[color-mix(in_srgb,var(--pf-warning)_14%,transparent)] text-[var(--pf-warning)]",
  danger: "bg-[color-mix(in_srgb,var(--pf-danger)_14%,transparent)] text-[var(--pf-danger)]",
  neutral: "bg-[var(--pf-border)]/50 text-[var(--pf-text-muted)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
