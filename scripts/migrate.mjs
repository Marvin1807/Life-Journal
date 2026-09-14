/**
 * Legt fehlende Tabellen an. Läuft automatisch bei jedem Deployment.
 *
 * Plain JavaScript on purpose: this runs during the Vercel build, where a
 * TypeScript loader may not be available.
 *
 * Ohne konfigurierte Datenbank bricht das Skript nicht ab — dann soll ein
 * lokaler Build weiterhin funktionieren. Ist eine Datenbank konfiguriert und
 * die Migration schlägt fehl, scheitert das Deployment absichtlich, statt eine
 * kaputte App online zu stellen.
 */
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const url =
  process.env.DIRECT_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.log("Keine Datenbank konfiguriert — Migration übersprungen.");
  process.exit(0);
}

const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const client = postgres(url, { max: 1, ssl: isLocal ? false : "require" });

// Two builds can run at the same time; the lock makes sure only one of them
// changes the schema.
const LOCK_KEY = 429173;

try {
  await client`select pg_advisory_lock(${LOCK_KEY})`;
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("Datenbank ist auf dem aktuellen Stand.");
  } finally {
    await client`select pg_advisory_unlock(${LOCK_KEY})`;
  }
} catch (err) {
  console.error("\nDie Datenbank konnte nicht vorbereitet werden.");
  console.error(err instanceof Error ? err.message : err);
  console.error(
    "\nPrüfe den Verbindungsstring: Steht dort noch [YOUR-PASSWORD] statt deines echten Passworts?",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
