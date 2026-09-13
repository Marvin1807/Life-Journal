"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { email, password });
      router.push("/heute");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Anmeldung fehlgeschlagen");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Life Journal"
      subtitle="Melde dich an, um deinen Tag zu planen."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="font-medium" style={{ color: "var(--accent)" }}>
            Registrieren
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="E-Mail">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@beispiel.de"
          />
        </Field>
        <Field label="Passwort">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" variant="primary" busy={busy}>
          Anmelden
        </Button>
        <Link
          href="/passwort-vergessen"
          className="text-center text-[13px]"
          style={{ color: "var(--ink-3)" }}
        >
          Passwort vergessen?
        </Link>
      </form>
    </AuthShell>
  );
}
