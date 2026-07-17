/** Backend de datos: demo local, Firebase o Google Sheets (Apps Script). */

export type DataBackend = "demo" | "firebase" | "sheets";

export function getDataBackend(): DataBackend {
  if (import.meta.env.VITE_DEMO_MODE === "true") return "demo";
  if (import.meta.env.VITE_DATA_BACKEND === "sheets") return "sheets";
  return "firebase";
}

export function isSheetsBackend(): boolean {
  return getDataBackend() === "sheets";
}

export function isDemoBackend(): boolean {
  return getDataBackend() === "demo";
}

export function isFirebaseBackend(): boolean {
  return getDataBackend() === "firebase";
}

/** Integraciones externas bloqueadas por defecto (ahorro tokens API). */
export function integracionesBloqueadasPorDefecto(): boolean {
  return import.meta.env.VITE_BLOQUEAR_INTEGRACIONES !== "false";
}

export function claveDesbloqueoIntegraciones(): string {
  return import.meta.env.VITE_INTEGRACIONES_CLAVE?.trim() || "spe-desbloquear";
}
