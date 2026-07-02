import { getDb } from "@/db";
import { envios } from "@/db/schema";
import { generarCodigoSeguimiento } from "@/lib/logistica";

async function main() {
  const db = getDb();

  const ejemplos = [
    {
      origen: "Bogotá",
      destino: "Medellín",
      destinatario: "Ana Gómez",
      pesoKg: 3,
      estado: "en_transito" as const,
    },
    {
      origen: "Cali",
      destino: "Barranquilla",
      destinatario: "Luis Pérez",
      pesoKg: 12,
      estado: "pendiente" as const,
    },
  ];

  for (const e of ejemplos) {
    await db
      .insert(envios)
      .values({ ...e, codigo: generarCodigoSeguimiento() })
      .onConflictDoNothing();
  }

  console.log(`Sembrados ${ejemplos.length} envíos de ejemplo.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
