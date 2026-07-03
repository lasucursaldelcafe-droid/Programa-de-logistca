import { ESTADOS_ENVIO, type EstadoEnvio } from "@/db/schema";

/**
 * Transiciones de estado permitidas para un envío. Un envío entregado o
 * cancelado es terminal y no admite más cambios.
 */
const TRANSICIONES: Record<EstadoEnvio, EstadoEnvio[]> = {
  pendiente: ["en_transito", "cancelado"],
  en_transito: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

export function esEstadoValido(valor: unknown): valor is EstadoEnvio {
  return (
    typeof valor === "string" &&
    (ESTADOS_ENVIO as readonly string[]).includes(valor)
  );
}

export function esTransicionValida(
  desde: EstadoEnvio,
  hacia: EstadoEnvio,
): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/** Genera un código de seguimiento único legible, p.ej. "ENV-8F3K2Q". */
export function generarCodigoSeguimiento(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sufijo = "";
  for (let i = 0; i < 6; i++) {
    sufijo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `ENV-${sufijo}`;
}

export interface EntradaEnvio {
  origen?: unknown;
  destino?: unknown;
  destinatario?: unknown;
  pesoKg?: unknown;
}

export interface EnvioValidado {
  origen: string;
  destino: string;
  destinatario: string;
  pesoKg: number;
}

export type ResultadoValidacion =
  | { ok: true; datos: EnvioValidado }
  | { ok: false; errores: string[] };

export function validarNuevoEnvio(entrada: EntradaEnvio): ResultadoValidacion {
  const errores: string[] = [];

  const origen = typeof entrada.origen === "string" ? entrada.origen.trim() : "";
  const destino =
    typeof entrada.destino === "string" ? entrada.destino.trim() : "";
  const destinatario =
    typeof entrada.destinatario === "string" ? entrada.destinatario.trim() : "";

  if (!origen) errores.push("El origen es obligatorio.");
  if (!destino) errores.push("El destino es obligatorio.");
  if (!destinatario) errores.push("El destinatario es obligatorio.");

  const pesoNum = Number(entrada.pesoKg);
  const pesoKg = Number.isFinite(pesoNum) ? Math.round(pesoNum) : 0;
  if (pesoKg < 0) errores.push("El peso no puede ser negativo.");

  if (errores.length > 0) {
    return { ok: false, errores };
  }
  return { ok: true, datos: { origen, destino, destinatario, pesoKg } };
}
