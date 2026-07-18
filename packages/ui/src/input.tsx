import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { cn } from "./cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "pf-focus h-10 w-full rounded-[var(--pf-radius-md)] border border-[var(--pf-border-strong)]",
        "bg-[var(--pf-surface)] px-3 text-sm text-[var(--pf-text)]",
        "placeholder:text-[var(--pf-text-subtle)]",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-[var(--pf-text)]", className)}
      {...props}
    />
  );
}
