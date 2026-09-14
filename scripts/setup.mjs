/**
 * Erstellt .env.local beim ersten Start: fragt den Verbindungsstring ab und
 * erzeugt das Session-Secret selbst, damit niemand ein schwaches wählt.
 */
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const FILE = ".env.local";

if (existsSync(FILE)) {
  console.log(`${FILE} existiert bereits — es wird nichts überschrieben.`);
  process.exit(0);
}

const rl = createInterface({ input: stdin, output: stdout });

console.log("\nLife Journal — Einrichtung\n");
console.log("Du brauchst den Verbindungsstring deiner PostgreSQL-Datenbank.");
console.log("Bei Supabase: Project Settings → Database → Connection string → URI.\n");

const url = (await rl.question("DATABASE_URL: ")).trim();
rl.close();

if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
  console.error("\nDas sieht nicht nach einem PostgreSQL-Verbindungsstring aus.");
  console.error("Er beginnt mit postgres:// oder postgresql://");
  process.exit(1);
}

const secret = randomBytes(48).toString("base64url");
writeFileSync(FILE, `DATABASE_URL=${url}\nAUTH_SECRET=${secret}\n`);

console.log(`\n${FILE} wurde angelegt, das Secret ist zufällig erzeugt.`);
console.log("Nächster Schritt:  npm run db:migrate\n");
