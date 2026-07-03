import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { envios } from "@/db/schema";
import { esEstadoValido, esTransicionValida } from "@/lib/logistica";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: Contexto) {
  const { id } = await context.params;
  const envioId = Number(id);
  if (!Number.isInteger(envioId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido." },
      { status: 400 },
    );
  }

  const nuevoEstado = (body as { estado?: unknown }).estado;
  if (!esEstadoValido(nuevoEstado)) {
    return NextResponse.json(
      { error: "Estado no reconocido." },
      { status: 400 },
    );
  }

  const db = getDb();
  const [actual] = await db.select().from(envios).where(eq(envios.id, envioId));
  if (!actual) {
    return NextResponse.json({ error: "Envío no encontrado." }, { status: 404 });
  }

  if (
    actual.estado !== nuevoEstado &&
    !esTransicionValida(actual.estado, nuevoEstado)
  ) {
    return NextResponse.json(
      {
        error: `No se puede pasar de "${actual.estado}" a "${nuevoEstado}".`,
      },
      { status: 409 },
    );
  }

  const [actualizado] = await db
    .update(envios)
    .set({ estado: nuevoEstado, actualizadoEn: new Date().toISOString() })
    .where(eq(envios.id, envioId))
    .returning();

  return NextResponse.json({ envio: actualizado });
}

export async function DELETE(_request: Request, context: Contexto) {
  const { id } = await context.params;
  const envioId = Number(id);
  if (!Number.isInteger(envioId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const db = getDb();
  const borrados = await db
    .delete(envios)
    .where(eq(envios.id, envioId))
    .returning();

  if (borrados.length === 0) {
    return NextResponse.json({ error: "Envío no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
