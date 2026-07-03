import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";

/**
 * Crea el esquema de la base de datos de forma idempotente. Funciona tanto
 * con SQLite local (file:) como con Turso remoto si se define TURSO_DATABASE_URL.
 */
async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/logistica.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith("file:")) {
    // Asegura que exista el directorio del archivo SQLite local.
    mkdirSync("./data", { recursive: true });
  }

  const client = createClient(authToken ? { url, authToken } : { url });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS envios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      origen TEXT NOT NULL,
      destino TEXT NOT NULL,
      destinatario TEXT NOT NULL,
      peso_kg INTEGER NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      creado_en TEXT NOT NULL DEFAULT (datetime('now')),
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("Base de datos inicializada correctamente.");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
