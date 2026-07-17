import { isEffectiveDemoMode } from "@spe/shared";

function buildEnv() {
  return {
    demoMode: import.meta.env.VITE_DEMO_MODE === "true",
    dataBackend: import.meta.env.VITE_DATA_BACKEND,
  };
}

/** Modo demo efectivo (build o configuración runtime desde celular). */
export function isDemoMode(): boolean {
  return isEffectiveDemoMode(buildEnv());
}

/** @deprecated Usa isDemoMode() — valor fijo del build. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
