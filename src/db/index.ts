import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { MISSING_URL_MESSAGE, resolveDatabaseUrl, sslFor } from "@/lib/env";

const connectionString = resolveDatabaseUrl();

if (!connectionString) throw new Error(MISSING_URL_MESSAGE);

declare global {
  var __lifejournal_sql: ReturnType<typeof postgres> | undefined;
}

const client =
  global.__lifejournal_sql ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    // Required when the connection goes through a transaction pooler,
    // which is the default for both Supabase and Neon.
    prepare: false,
    ssl: sslFor(connectionString),
  });

if (process.env.NODE_ENV !== "production") global.__lifejournal_sql = client;

export const db = drizzle(client, { schema });
export { schema };
