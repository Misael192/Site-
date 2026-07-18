"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@peopleflow/ui";
import { api, tokenStore } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const tokens = await api.signup({
        tenantSlug: String(form.get("tenantSlug")),
        organizationName: String(form.get("organizationName")),
        companyName: String(form.get("companyName")),
        adminName: String(form.get("adminName")),
        adminEmail: String(form.get("adminEmail")),
        adminPassword: String(form.get("adminPassword")),
      });
      tokenStore.save(tokens);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="text-xl font-semibold">Criar sua empresa</h1>
          <p className="mt-1 text-sm text-[var(--pf-text-muted)]">
            14 dias grátis. Sem cartão de crédito.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="organizationName">Nome do grupo/empresa</Label>
              <Input id="organizationName" name="organizationName" required />
            </div>
            <div>
              <Label htmlFor="companyName">Razão social</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div>
              <Label htmlFor="tenantSlug">Subdomínio</Label>
              <Input
                id="tenantSlug"
                name="tenantSlug"
                placeholder="acme"
                pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
                required
              />
            </div>
            <div>
              <Label htmlFor="adminName">Seu nome</Label>
              <Input id="adminName" name="adminName" required />
            </div>
            <div>
              <Label htmlFor="adminEmail">Seu e-mail</Label>
              <Input id="adminEmail" name="adminEmail" type="email" required />
            </div>
            <div>
              <Label htmlFor="adminPassword">Senha (mín. 10 caracteres)</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                minLength={10}
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-[var(--pf-danger)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando…" : "Criar empresa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
