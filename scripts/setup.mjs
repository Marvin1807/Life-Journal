/**
 * Erstellt .env.local beim ersten Start und fragt dafür nur den
 * Verbindungsstring der Datenbank ab.
 */
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

writeFileSync(FILE, `DATABASE_URL=${url}\n`);

console.log(`\n${FILE} wurde angelegt.`);
console.log("Nächster Schritt:  npm run dev\n");
