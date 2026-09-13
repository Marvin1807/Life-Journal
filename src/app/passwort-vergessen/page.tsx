"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link: string | null; mailed: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ link: string | null; mailed: boolean }>(
        "/api/auth/reset-request",
        { email },
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Anfrage fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Passwort zurücksetzen"
      subtitle="Wir erstellen einen Link, mit dem du ein neues Passwort setzen kannst."
      footer={
        <Link href="/anmelden" style={{ color: "var(--accent)" }}>
          Zurück zur Anmeldung
        </Link>
      }
    >
      {result ? (
        <div className="flex flex-col gap-3">
          <p className="text-[14px]">
            Wenn es ein Konto mit dieser Adresse gibt, wurde ein Link erstellt.
          </p>
          {result.mailed && (
            <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
              Der Link wurde per E-Mail verschickt.
            </p>
          )}
          {result.link && (
            <div
              className="rounded-xl px-3 py-3 text-[13px] break-all"
              style={{ background: "var(--surface-2)" }}
            >
              <p className="mb-2 font-medium">
                Es ist kein E-Mail-Versand konfiguriert. Nutze diesen Link:
              </p>
              <Link href={result.link} style={{ color: "var(--accent)" }}>
                {result.link}
              </Link>
            </div>
          )}
        </div>
      ) : (
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
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" variant="primary" busy={busy}>
            Link erstellen
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
