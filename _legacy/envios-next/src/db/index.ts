import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Local development uses an on-disk SQLite file so the app runs with zero
 * external services. Setting TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) switches
 * the same code to a hosted Turso database without further changes.
 */
const url = process.env.TURSO_DATABASE_URL ?? "file:./data/logistica.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | undefined;
let db: LibSQLDatabase<typeof schema> | undefined;

export function getDb(): LibSQLDatabase<typeof schema> {
  if (!db) {
    client = createClient(authToken ? { url, authToken } : { url });
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
