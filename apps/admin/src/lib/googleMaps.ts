import { getRuntimeGoogleMapsApiKey } from "@spe/shared";

/** Clave de Maps JavaScript API (build VITE_, runtime bootstrap o localStorage). */
export function getGoogleMapsApiKey(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (fromEnv) return fromEnv;

  const fromRuntime = getRuntimeGoogleMapsApiKey();
  if (fromRuntime) return fromRuntime;

  if (typeof window !== "undefined") {
    try {
      const raw =
        localStorage.getItem("spe-runtime-config-v2") ??
        localStorage.getItem("spe-runtime-config-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { googleMapsApiKey?: string };
        const fromStored = parsed.googleMapsApiKey?.trim();
        if (fromStored) return fromStored;
      }
    } catch {
      /* ignore */
    }
  }

  return "";
}

export function isGoogleMapsEnabled(): boolean {
  return getGoogleMapsApiKey().length > 0;
}
