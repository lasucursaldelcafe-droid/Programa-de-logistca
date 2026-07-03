import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { envios } from "@/db/schema";
import { generarCodigoSeguimiento, validarNuevoEnvio } from "@/lib/logistica";

export async function GET() {
  const db = getDb();
  const filas = await db.select().from(envios).orderBy(desc(envios.id));
  return NextResponse.json({ envios: filas });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido." },
      { status: 400 },
    );
  }

  const validacion = validarNuevoEnvio(body as Record<string, unknown>);
  if (!validacion.ok) {
    return NextResponse.json(
      { error: "Datos inválidos.", detalles: validacion.errores },
      { status: 400 },
    );
  }

  const db = getDb();
  const [creado] = await db
    .insert(envios)
    .values({ ...validacion.datos, codigo: generarCodigoSeguimiento() })
    .returning();

  return NextResponse.json({ envio: creado }, { status: 201 });
}
