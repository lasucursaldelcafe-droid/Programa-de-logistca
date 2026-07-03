import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ESTADOS_ENVIO = [
  "pendiente",
  "en_transito",
  "entregado",
  "cancelado",
] as const;

export type EstadoEnvio = (typeof ESTADOS_ENVIO)[number];

export const envios = sqliteTable("envios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codigo: text("codigo").notNull().unique(),
  origen: text("origen").notNull(),
  destino: text("destino").notNull(),
  destinatario: text("destinatario").notNull(),
  pesoKg: integer("peso_kg").notNull().default(0),
  estado: text("estado", { enum: ESTADOS_ENVIO }).notNull().default("pendiente"),
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
  actualizadoEn: text("actualizado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Envio = typeof envios.$inferSelect;
export type NuevoEnvio = typeof envios.$inferInsert;
