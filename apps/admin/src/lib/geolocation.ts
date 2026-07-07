import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "./platform";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

async function getNativePosition(): Promise<GeoPosition> {
  const perm = await Geolocation.checkPermissions();
  if (perm.location !== "granted") {
    const req = await Geolocation.requestPermissions();
    if (req.location !== "granted") {
      throw new Error("Permiso de ubicación denegado");
    }
  }
  const pos = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15_000,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

export async function getCurrentPosition(): Promise<GeoPosition> {
  if (isNativePlatform()) {
    return getNativePosition();
  }

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
      (err) => reject(new Error(err.message || "No se pudo obtener ubicación")),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
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
    (err) => onError?.(err.message),
    { enableHighAccuracy: true, maximumAge: 10_000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}
