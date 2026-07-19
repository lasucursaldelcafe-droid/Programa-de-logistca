/** Clave de Maps JavaScript API (build-time VITE_ o runtime en bootstrap). */
export function getGoogleMapsApiKey(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("spe-runtime-config-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { googleMapsApiKey?: string };
        const fromRuntime = parsed.googleMapsApiKey?.trim();
        if (fromRuntime) return fromRuntime;
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
