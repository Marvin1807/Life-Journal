"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/register", { name, email, password });
      router.push("/heute");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Registrierung fehlgeschlagen");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Konto erstellen"
      subtitle="Dein Tagesplan, Training und Ernährung an einem Ort."
      footer={
        <>
          Schon registriert?{" "}
          <Link href="/anmelden" className="font-medium" style={{ color: "var(--accent)" }}>
            Anmelden
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Name">
          <Input
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name"
          />
        </Field>
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
        <Field label="Passwort" hint="Mindestens 8 Zeichen">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" variant="primary" busy={busy}>
          Konto erstellen
        </Button>
        <p className="text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
          Nach der Registrierung findest du einen vollständigen Beispieltag, den du frei anpassen
          kannst.
        </p>
      </form>
    </AuthShell>
  );
}
