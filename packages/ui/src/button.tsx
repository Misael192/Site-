import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "pf-focus inline-flex items-center justify-center gap-2 font-medium rounded-[var(--pf-radius-md)] " +
  "transition-colors duration-[var(--pf-duration-micro)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--pf-brand-600)] text-[var(--pf-text-on-brand)] hover:bg-[var(--pf-brand-700)]",
  secondary:
    "bg-[var(--pf-surface)] text-[var(--pf-text)] border border-[var(--pf-border-strong)] hover:bg-[var(--pf-bg)]",
  ghost: "text-[var(--pf-text-muted)] hover:bg-[var(--pf-border)]/40 hover:text-[var(--pf-text)]",
  danger: "bg-[var(--pf-danger)] text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
