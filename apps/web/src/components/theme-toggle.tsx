"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@peopleflow/ui";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(
      (document.documentElement.dataset.theme as "light" | "dark") ?? "light",
    );
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("pf-theme", next);
    setTheme(next);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </Button>
  );
}
