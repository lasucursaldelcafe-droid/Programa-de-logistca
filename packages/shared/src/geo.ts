import type { GeoCoord } from "./types";

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideGeofence(
  point: GeoCoord,
  center: GeoCoord,
  radiusMeters: number,
): boolean {
  return haversineMeters(point.lat, point.lng, center.lat, center.lng) <= radiusMeters;
}

export function formatQrPayload(qrId: string, token: string): string {
  return `spe:qr:${qrId}:${token}`;
}

/**
 * URL pública que abre el alta/onboarding al escanear con la cámara del teléfono.
 * Ejemplo: https://…/Programa-de-logistca/unirse-qr?qr=…&t=…
 */
export function formatQrJoinUrl(
  appBaseUrl: string,
  qrId: string,
  token: string,
  opts?: { useHashRouter?: boolean },
): string {
  const base = appBaseUrl.replace(/\/?$/, "/");
  const qs = `qr=${encodeURIComponent(qrId)}&t=${encodeURIComponent(token)}`;
  if (opts?.useHashRouter) {
    return `${base}#/unirse-qr?${qs}`;
  }
  return `${base}unirse-qr?${qs}`;
}

export function parseQrPayload(raw: string): { qrId: string; token: string } | null {
  const trimmed = raw.trim();
  const legacy = trimmed.match(/^spe:qr:([^:]+):([a-zA-Z0-9_-]+)$/);
  if (legacy) {
    return { qrId: legacy[1]!, token: legacy[2]! };
  }

  // URL de onboarding: …/unirse-qr?qr=…&t=… (también con hash router)
  try {
    const asUrl = trimmed.includes("://")
      ? new URL(trimmed)
      : trimmed.startsWith("/unirse-qr") || trimmed.includes("unirse-qr?")
        ? new URL(trimmed, "https://spe.local/")
        : null;
    if (asUrl) {
      const hash = asUrl.hash.startsWith("#") ? asUrl.hash.slice(1) : asUrl.hash;
      const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
      const params = new URLSearchParams(asUrl.search || hashQuery);
      const qrId = params.get("qr")?.trim();
      const token = params.get("t")?.trim();
      if (qrId && token) return { qrId, token };
    }
  } catch {
    // ignore
  }

  return null;
}

export function getRotatingToken(
  qrId: string,
  secret: string,
  intervalSeconds: number,
  nowMs = Date.now(),
): string {
  const slot = Math.floor(nowMs / (intervalSeconds * 1000));
  const raw = `${qrId}:${secret}:${slot}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, "0").slice(0, 12);
}

export function isWithinTimeWindow(inicio: string, fin: string, now = new Date()): boolean {
  const start = new Date(inicio);
  const end = new Date(fin);
  return now >= start && now <= end;
}
