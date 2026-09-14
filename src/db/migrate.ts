import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { loadEnv, requireDatabaseUrl, sslFor } from "@/lib/env";

loadEnv();

async function main() {
  const url = requireDatabaseUrl();
  const client = postgres(url, { max: 1, ssl: sslFor(url) });

  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("Migrationen angewendet. Die Datenbank ist bereit.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nMigration fehlgeschlagen:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
