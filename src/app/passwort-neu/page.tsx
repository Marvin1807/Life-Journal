"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/reset-confirm", { token, password });
      setDone(true);
      setTimeout(() => router.push("/anmelden"), 1500);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Zurücksetzen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="text-[14px]">
        Der Link ist unvollständig. Fordere unter{" "}
        <Link href="/passwort-vergessen" style={{ color: "var(--accent)" }}>
          Passwort vergessen
        </Link>{" "}
        einen neuen an.
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-[14px]">
        Dein Passwort wurde geändert. Du wirst zur Anmeldung weitergeleitet.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <Field label="Neues Passwort" hint="Mindestens 8 Zeichen">
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
        Passwort speichern
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Neues Passwort" subtitle="Wähle ein neues Passwort für dein Konto.">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
