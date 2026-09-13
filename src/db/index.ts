import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your PostgreSQL/Supabase database.",
  );
}

declare global {
  var __lifejournal_sql: ReturnType<typeof postgres> | undefined;
}

const client =
  global.__lifejournal_sql ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    prepare: false,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : "require",
  });

if (process.env.NODE_ENV !== "production") global.__lifejournal_sql = client;

export const db = drizzle(client, { schema });
export { schema };
