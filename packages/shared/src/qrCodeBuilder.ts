import type { QrCode, QrModo } from "./types";

export interface CreateQrCodeInput {
  eventId: string;
  eventNombre: string;
  siteId: string;
  siteNombre: string;
  modo: QrModo;
  ventanaInicio: string;
  ventanaFin: string;
  radioGeocerca: number;
  descripcionDatos: string;
  intervaloRotacionSegundos?: number;
  creadoPor: string;
}

export function buildQrCodeId(siteId: string, nowMs = Date.now()): string {
  return `qr-${siteId}-${nowMs.toString(36)}`;
}

export function buildQrCodeToken(fromUuid: string): string {
  return fromUuid.replace(/-/g, "").slice(0, 16);
}

/** Documento Firestore para qrCodes (sin id). Omite campos opcionales cuando no aplican. */
export function buildQrCodeDocument(
  data: CreateQrCodeInput,
  opts: {
    token: string;
    secret?: string;
    creadoEn?: string;
  },
): Omit<QrCode, "id"> {
  const creadoEn = opts.creadoEn ?? new Date().toISOString();

  return {
    eventId: data.eventId,
    eventNombre: data.eventNombre,
    siteId: data.siteId,
    siteNombre: data.siteNombre,
    token: opts.token,
    modo: data.modo,
    ventanaInicio: data.ventanaInicio,
    ventanaFin: data.ventanaFin,
    radioGeocerca: data.radioGeocerca,
    descripcionDatos: data.descripcionDatos,
    activo: true,
    creadoEn,
    creadoPor: data.creadoPor,
    ...(data.modo === "rotativo" && opts.secret
      ? {
          secret: opts.secret,
          ...(data.intervaloRotacionSegundos != null
            ? { intervaloRotacionSegundos: data.intervaloRotacionSegundos }
            : {}),
        }
      : {}),
  };
}

export function assertFirestoreSafe(value: unknown, path = "root"): void {
  if (value === undefined) {
    throw new Error(`Valor undefined en ${path}`);
  }
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFirestoreSafe(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    assertFirestoreSafe(nested, `${path}.${key}`);
  }
}
