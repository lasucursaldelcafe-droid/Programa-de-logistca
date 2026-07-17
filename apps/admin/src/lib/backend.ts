/** Backend de datos: demo local, Firebase o Google Sheets (Apps Script). */

import {
  getEffectiveBackend,
  isEffectiveSheetsBackend,
} from "@spe/shared";

export type DataBackend = "demo" | "firebase" | "sheets";

function buildEnv() {
  return {
    demoMode: import.meta.env.VITE_DEMO_MODE === "true",
    dataBackend: import.meta.env.VITE_DATA_BACKEND,
  };
}

export function getDataBackend(): DataBackend {
  return getEffectiveBackend(buildEnv()) as DataBackend;
}

export function isSheetsBackend(): boolean {
  return isEffectiveSheetsBackend(buildEnv());
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
