import { useMemo } from "react";
import {
  getRuntimeGoogleMapsApiKey,
  getRuntimeSetupCompletado,
  resolveSetupStatus,
  type ResolvedSetupStatus,
} from "@spe/shared";

/** Estado de configuración infra (Firebase, Maps) para ocultar pendientes ya resueltos. */
export function useProductionSetupStatus(): ResolvedSetupStatus {
  return useMemo(
    () =>
      resolveSetupStatus({
        backend: "firebase",
        demoMode: false,
        setupCompletado: getRuntimeSetupCompletado(),
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      }),
    [],
  );
}

/** Re-evalúa cuando cambia la clave de mapas (bootstrap remoto). */
export function useProductionSetupStatusLive(): ResolvedSetupStatus {
  const mapsKey = getRuntimeGoogleMapsApiKey();
  return useMemo(
    () =>
      resolveSetupStatus({
        backend: "firebase",
        demoMode: false,
        setupCompletado: getRuntimeSetupCompletado(),
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      }),
    [mapsKey],
  );
}
