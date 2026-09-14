/**
 * Legt fehlende Tabellen an. Läuft automatisch bei jedem Deployment.
 *
 * Plain JavaScript on purpose: this runs during the Vercel build, where a
 * TypeScript loader may not be available.
 *
 * Ohne konfigurierte Datenbank bricht das Skript nicht ab — dann soll ein
 * Build weiterhin durchlaufen, damit man die Datenbank auch nachträglich
 * verbinden kann. Ist eine Datenbank konfiguriert und die Migration schlägt
 * fehl, scheitert das Deployment absichtlich, statt eine kaputte App online
 * zu stellen.
 */
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

// Schemaänderungen brauchen eine direkte Verbindung: Ein Transaction-Pooler
// lehnt manche DDL ab. Deshalb gewinnt hier die ungepoolte URL.
const url =
  process.env.DIRECT_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.log("Keine Datenbank konfiguriert — Migration übersprungen.");
  console.log("Setze DATABASE_URL und starte das Deployment erneut.");
  process.exit(0);
}

/** Sagt, was bei dieser Art Fehler erfahrungsgemäß schiefgelaufen ist. */
function hintFor(message) {
  const m = message.toLowerCase();
  if (m.includes("password authentication") || m.includes("sasl") || m.includes("auth")) {
    return "Das Passwort stimmt nicht. Steht im Verbindungsstring noch [YOUR-PASSWORD] statt deines echten Passworts?";
  }
  if (m.includes("econnrefused") || m.includes("timeout") || m.includes("enotfound")) {
    return "Die Datenbank ist nicht erreichbar. Prüfe Host und Port im Verbindungsstring, und ob die Datenbank läuft.";
  }
  if (m.includes("does not exist")) {
    return "Die angegebene Datenbank existiert nicht. Prüfe den Namen am Ende des Verbindungsstrings.";
  }
  return "Prüfe den Verbindungsstring in DATABASE_URL.";
}

const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const client = postgres(url, { max: 1, ssl: isLocal ? false : "require" });

// Zwei Builds können gleichzeitig laufen; die Sperre stellt sicher, dass nur
// einer davon das Schema ändert.
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
  const message = err instanceof Error ? err.message : String(err);
  console.error("\nDie Datenbank konnte nicht vorbereitet werden.");
  console.error(message);
  console.error("\n" + hintFor(message));
  process.exitCode = 1;
} finally {
  await client.end();
}
