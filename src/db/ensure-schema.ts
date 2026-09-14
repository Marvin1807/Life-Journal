import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { resolveDirectUrl, sslFor } from "@/lib/env";

declare global {
  var __lifejournal_schema_ready: Promise<void> | undefined;
}

/** Sperre, damit parallel startende Instanzen sich nicht überschneiden. */
const LOCK_KEY = 429173;

/**
 * Bringt das Datenbankschema auf den aktuellen Stand. Pro Serverinstanz nur
 * einmal; weitere Aufrufe warten auf denselben Durchlauf.
 */
export function ensureSchema(): Promise<void> {
  global.__lifejournal_schema_ready ??= run();
  return global.__lifejournal_schema_ready;
}

async function run(): Promise<void> {
  const url = resolveDirectUrl();
  if (!url) {
    console.warn(
      "[life-journal] Keine Datenbank konfiguriert. Setze DATABASE_URL und starte ein neues Deployment.",
    );
    return;
  }

  const client = postgres(url, { max: 1, ssl: sslFor(url) });
  try {
    await client`select pg_advisory_lock(${LOCK_KEY})`;
    try {
      await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    } finally {
      await client`select pg_advisory_unlock(${LOCK_KEY})`;
    }
  } catch (err) {
    // Der Server startet trotzdem: Ein Fehler hier darf die App nicht
    // komplett blockieren, die Ursache muss aber sichtbar sein.
    console.error("[life-journal] Schema konnte nicht angelegt werden:", err);
  } finally {
    await client.end();
  }
}
