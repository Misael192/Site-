/** Junta classes condicionalmente (versão mínima, sem dependências). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
