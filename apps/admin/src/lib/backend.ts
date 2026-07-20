/** Backend de datos: Firebase (producción). */

import { getEffectiveBackend } from "@spe/shared";

export type DataBackend = "firebase";

function buildEnv() {
  return {
    demoMode: false,
    dataBackend: import.meta.env.VITE_DATA_BACKEND ?? "firebase",
  };
}

export function getDataBackend(): DataBackend {
  return getEffectiveBackend(buildEnv());
}

export function isSheetsBackend(): boolean {
  return false;
}

export function isDemoBackend(): boolean {
  return false;
}

export function isFirebaseBackend(): boolean {
  return true;
}

/** Integraciones externas bloqueadas por defecto (ahorro tokens API). */
export function integracionesBloqueadasPorDefecto(): boolean {
  return import.meta.env.VITE_BLOQUEAR_INTEGRACIONES !== "false";
}

export function claveDesbloqueoIntegraciones(): string {
  return import.meta.env.VITE_INTEGRACIONES_CLAVE?.trim() || "spe-desbloquear";
}
