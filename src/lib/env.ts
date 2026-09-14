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

/** Connection options that work for Supabase, Neon and a local database. */
export function sslFor(url: string): "require" | false {
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  return local ? false : "require";
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL fehlt. Lege .env.local an (Vorlage: .env.example) und trage deinen PostgreSQL-Verbindungsstring ein.",
    );
  }
  return url;
}
