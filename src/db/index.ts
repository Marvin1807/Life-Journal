import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { MISSING_URL_MESSAGE, resolveDatabaseUrl, sslFor } from "@/lib/env";

type Database = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __lifejournal_sql: ReturnType<typeof postgres> | undefined;
  var __lifejournal_db: Database | undefined;
}

/**
 * Opens the connection on first use, not when this module is imported.
 *
 * Next.js loads every route module while building. If the client were created
 * at import time, a build without a configured database would fail — which
 * makes "deploy first, attach the database afterwards" impossible. Connecting
 * lazily keeps the build independent of the database and turns a missing
 * configuration into a clear error on the first request instead.
 */
function connect(): Database {
  if (global.__lifejournal_db) return global.__lifejournal_db;

  const url = resolveDatabaseUrl();
  if (!url) throw new Error(MISSING_URL_MESSAGE);

  const client =
    global.__lifejournal_sql ??
    postgres(url, {
      max: 10,
      idle_timeout: 20,
      // Required when the connection goes through a transaction pooler,
      // which is the default for both Supabase and Neon.
      prepare: false,
      ssl: sslFor(url),
    });

  const instance = drizzle(client, { schema });
  global.__lifejournal_sql = client;
  global.__lifejournal_db = instance;
  return instance;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const real = connect() as object;
    const value = Reflect.get(real, property, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
}) as Database;

export { schema };
