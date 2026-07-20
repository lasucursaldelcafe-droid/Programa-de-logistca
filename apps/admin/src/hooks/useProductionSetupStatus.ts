import { useMemo } from "react";
import {
  getRuntimeGoogleMapsApiKey,
  getRuntimeSetupCompletado,
  getRuntimeVapidKey,
  resolveSetupStatus,
  type ResolvedSetupStatus,
} from "@spe/shared";

function resolveVapidKey(): string {
  const fromEnv = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  return getRuntimeVapidKey();
}

/** Estado de configuración infra (Firebase, Maps) para ocultar pendientes ya resueltos. */
export function useProductionSetupStatus(): ResolvedSetupStatus {
  return useMemo(
    () =>
      resolveSetupStatus({
        backend: "firebase",
        demoMode: false,
        setupCompletado: getRuntimeSetupCompletado(),
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        vapidKey: resolveVapidKey(),
      }),
    [],
  );
}

/** Re-evalúa cuando cambia la clave de mapas (bootstrap remoto). */
export function useProductionSetupStatusLive(): ResolvedSetupStatus {
  const mapsKey = getRuntimeGoogleMapsApiKey();
  const vapidKey = resolveVapidKey();
  return useMemo(
    () =>
      resolveSetupStatus({
        backend: "firebase",
        demoMode: false,
        setupCompletado: getRuntimeSetupCompletado(),
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        vapidKey,
      }),
    [mapsKey, vapidKey],
  );
}
