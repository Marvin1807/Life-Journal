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
 * The connection the app uses at runtime.
 *
 * `DATABASE_URL` is what the setup asks for. `POSTGRES_URL` is what Vercel's
 * Supabase and Neon integrations set automatically, so a one-click deployment
 * needs no manual configuration at all.
 */
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

/**
 * The connection used for migrations. Schema changes need a direct connection:
 * a transaction pooler rejects some DDL, so the non-pooled URL wins here.
 */
export function resolveDirectUrl(): string | undefined {
  return (
    process.env.DIRECT_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
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
