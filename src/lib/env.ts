import { config } from "dotenv";

/**
 * Loads environment variables for scripts run outside Next.js (migrations,
 * drizzle-kit). Next itself reads .env.local automatically, plain Node does
 * not — so the same file works for both.
 */
export function loadEnv(): void {
  config({ path: ".env.local", quiet: true });
  config({ path: ".env", quiet: true });
}

/**
 * Values that look like a connection string but are not one. Vercel prefills
 * the environment variables of a new project from `.env.example`, so the
 * documented placeholder can end up configured as if it were real.
 */
function isUsable(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v.startsWith("postgres://") && !v.startsWith("postgresql://")) return false;
  const placeholders = ["user:passwort@host", "user:password@host", "[YOUR-PASSWORD]", "passwort@host"];
  return !placeholders.some((p) => v.toLowerCase().includes(p.toLowerCase()));
}

/**
 * Finds a connection string among the environment variables.
 *
 * Besides the documented names this also accepts prefixed ones such as
 * `STORAGE_DATABASE_URL`, because Vercel's database integrations let you
 * choose a prefix and then create every variable with it.
 */
function findUrl(suffixes: string[]): string | undefined {
  for (const suffix of suffixes) {
    const direct = process.env[suffix];
    if (isUsable(direct)) return direct;
  }
  for (const suffix of suffixes) {
    for (const [name, value] of Object.entries(process.env)) {
      if (name.endsWith(`_${suffix}`) && isUsable(value)) return value;
    }
  }
  return undefined;
}

/**
 * The connection the app uses at runtime.
 *
 * `DATABASE_URL` is what the setup asks for. `POSTGRES_URL` is what Vercel's
 * database integrations set automatically, so a one-click deployment needs no
 * manual configuration at all.
 */
export function resolveDatabaseUrl(): string | undefined {
  return findUrl(["DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"]);
}

/**
 * The connection used for migrations. Schema changes need a direct connection:
 * a transaction pooler rejects some DDL, so the non-pooled URL wins here.
 */
export function resolveDirectUrl(): string | undefined {
  return (
    findUrl(["DIRECT_DATABASE_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"]) ??
    resolveDatabaseUrl()
  );
}

/** Connection options that work for Supabase, Neon and a local database. */
export function sslFor(url: string): "require" | false {
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  return local ? false : "require";
}

export const MISSING_URL_MESSAGE =
  "Es ist keine Datenbank konfiguriert. Setze DATABASE_URL auf den Verbindungsstring deiner PostgreSQL-Datenbank (Vorlage: .env.example).";

export function requireDatabaseUrl(): string {
  const url = resolveDatabaseUrl();
  if (!url) throw new Error(MISSING_URL_MESSAGE);
  return url;
}
