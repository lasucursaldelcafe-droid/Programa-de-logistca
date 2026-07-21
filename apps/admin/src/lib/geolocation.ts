import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "./platform";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 5_000,
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 10_000,
};

function assertSecureContext(): void {
  if (typeof window === "undefined") return;
  if (window.isSecureContext) return;
  throw new Error(
    "La ubicación GPS requiere HTTPS (o localhost). Abre la app desde el enlace seguro de la web o la APK instalada.",
  );
}

function mapBrowserGeoError(err: GeolocationPositionError): Error {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new Error(
        "Permiso de ubicación denegado. Actívalo en el navegador o en Ajustes del teléfono e inténtalo de nuevo.",
      );
    case err.POSITION_UNAVAILABLE:
      return new Error(
        "No se pudo obtener GPS. Sal a un lugar más abierto, activa la ubicación del teléfono e inténtalo de nuevo.",
      );
    case err.TIMEOUT:
      return new Error(
        "Tiempo de espera del GPS agotado. Comprueba que la ubicación esté activada y vuelve a intentar.",
      );
    default:
      return new Error(err.message || "No se pudo obtener ubicación");
  }
}

async function getNativePosition(): Promise<GeoPosition> {
  const perm = await Geolocation.checkPermissions();
  if (perm.location !== "granted") {
    const req = await Geolocation.requestPermissions();
    if (req.location !== "granted") {
      throw new Error(
        "Permiso de ubicación denegado. Actívalo en Ajustes de la app e inténtalo de nuevo.",
      );
    }
  }
  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15_000,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error GPS";
    if (/denied|permission/i.test(msg)) {
      throw new Error(
        "Permiso de ubicación denegado. Actívalo en Ajustes de la app e inténtalo de nuevo.",
      );
    }
    if (/timeout/i.test(msg)) {
      throw new Error(
        "Tiempo de espera del GPS agotado. Sal a un lugar abierto e inténtalo de nuevo.",
      );
    }
    throw new Error(msg || "No se pudo obtener ubicación");
  }
}

export async function getCurrentPosition(): Promise<GeoPosition> {
  if (isNativePlatform()) {
    return getNativePosition();
  }

  assertSecureContext();

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no disponible en este navegador"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(mapBrowserGeoError(err)),
      GEO_OPTIONS,
    );
  });
}

export function watchPosition(
  onPosition: (pos: GeoPosition) => void,
  onError?: (message: string) => void,
): () => void {
  if (isNativePlatform()) {
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        onPosition(await getNativePosition());
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Error GPS");
      }
      if (active) window.setTimeout(poll, 10_000);
    };
    void poll();
    return () => {
      active = false;
    };
  }

  try {
    assertSecureContext();
  } catch (err) {
    onError?.(err instanceof Error ? err.message : "GPS requiere HTTPS");
    return () => undefined;
  }

  if (!navigator.geolocation) {
    onError?.("Geolocalización no disponible");
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) =>
      onPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
    (err) => onError?.(mapBrowserGeoError(err).message),
    WATCH_OPTIONS,
  );
  return () => navigator.geolocation.clearWatch(watchId);
}
