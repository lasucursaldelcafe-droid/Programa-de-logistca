import { DEMO_MODE } from "./mode";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export async function getCurrentPosition(): Promise<GeoPosition> {
  if (DEMO_MODE) {
    return { lat: 4.6538, lng: -74.0839, accuracy: 10 };
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
  if (DEMO_MODE) {
    const id = window.setInterval(() => {
      onPosition({ lat: 4.6538 + (Math.random() - 0.5) * 0.0002, lng: -74.0839 + (Math.random() - 0.5) * 0.0002 });
    }, 10_000);
    onPosition({ lat: 4.6538, lng: -74.0839 });
    return () => window.clearInterval(id);
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
