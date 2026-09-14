/**
 * Die Erkennung der Datenbankverbindung muss zwei Eigenheiten von Vercel
 * aushalten: übernommene Platzhalter aus .env.example und frei wählbare
 * Präfixe der Datenbank-Integrationen.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "DIRECT_DATABASE_URL",
  "STORAGE_DATABASE_URL",
  "STORAGE_DATABASE_URL_UNPOOLED",
  "NEON_POSTGRES_URL",
];

let saved: Record<string, string | undefined> = {};

async function resolve() {
  // Das Modul liest process.env bei jedem Aufruf, ein Neuimport genügt.
  const mod = await import("@/lib/env");
  return { runtime: mod.resolveDatabaseUrl(), direct: mod.resolveDirectUrl() };
}

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

const REAL = "postgres://u:p@db.example.com:5432/app";

describe("Verbindung finden", () => {
  it("nimmt DATABASE_URL", async () => {
    process.env.DATABASE_URL = REAL;
    expect((await resolve()).runtime).toBe(REAL);
  });

  it("nimmt POSTGRES_URL, wenn DATABASE_URL fehlt", async () => {
    process.env.POSTGRES_URL = REAL;
    expect((await resolve()).runtime).toBe(REAL);
  });

  it("ignoriert den Platzhalter aus .env.example", async () => {
    process.env.DATABASE_URL = "postgres://user:passwort@host:5432/datenbank";
    expect((await resolve()).runtime).toBeUndefined();
  });

  it("ignoriert den Supabase-Platzhalter [YOUR-PASSWORD]", async () => {
    process.env.DATABASE_URL = "postgres://postgres:[YOUR-PASSWORD]@db.abc.supabase.co:5432/postgres";
    expect((await resolve()).runtime).toBeUndefined();
  });

  it("nimmt die echte Verbindung, auch wenn daneben ein Platzhalter steht", async () => {
    process.env.DATABASE_URL = "postgres://user:passwort@host:5432/datenbank";
    process.env.STORAGE_DATABASE_URL = REAL;
    expect((await resolve()).runtime).toBe(REAL);
  });

  it("findet Variablen mit eigenem Präfix", async () => {
    process.env.NEON_POSTGRES_URL = REAL;
    expect((await resolve()).runtime).toBe(REAL);
  });

  it("ignoriert Werte, die keine Verbindung sind", async () => {
    process.env.DATABASE_URL = "";
    process.env.POSTGRES_URL = "bitte hier eintragen";
    expect((await resolve()).runtime).toBeUndefined();
  });
});

describe("Verbindung für Schemaänderungen", () => {
  it("bevorzugt die ungepoolte Verbindung", async () => {
    const pooled = "postgres://u:p@pooler.example.com:6543/app";
    const direct = "postgres://u:p@direct.example.com:5432/app";
    process.env.DATABASE_URL = pooled;
    process.env.POSTGRES_URL_NON_POOLING = direct;
    const r = await resolve();
    expect(r.runtime).toBe(pooled);
    expect(r.direct).toBe(direct);
  });

  it("bevorzugt die ungepoolte Verbindung auch mit Präfix", async () => {
    const pooled = "postgres://u:p@pooler.example.com:6543/app";
    const direct = "postgres://u:p@direct.example.com:5432/app";
    process.env.STORAGE_DATABASE_URL = pooled;
    process.env.STORAGE_DATABASE_URL_UNPOOLED = direct;
    const r = await resolve();
    expect(r.runtime).toBe(pooled);
    expect(r.direct).toBe(direct);
  });

  it("fällt auf die normale Verbindung zurück, wenn es keine ungepoolte gibt", async () => {
    process.env.DATABASE_URL = REAL;
    expect((await resolve()).direct).toBe(REAL);
  });
});
