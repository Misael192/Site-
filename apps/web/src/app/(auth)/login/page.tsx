"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@peopleflow/ui";
import { api, tokenStore } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const tokens = await api.login({
        tenantSlug: String(form.get("tenantSlug")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      tokenStore.save(tokens);
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="text-xl font-semibold">Entrar na PeopleFlow</h1>
          <p className="mt-1 text-sm text-[var(--pf-text-muted)]">
            Acesse com os dados da sua empresa.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="tenantSlug">Empresa (subdomínio)</Label>
              <Input id="tenantSlug" name="tenantSlug" placeholder="acme" required />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-[var(--pf-danger)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--pf-text-muted)]">
            Ainda não tem conta?{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--pf-brand-600)]"
            >
              Criar empresa
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
