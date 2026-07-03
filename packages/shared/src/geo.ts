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

export function parseQrPayload(raw: string): { qrId: string; token: string } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^spe:qr:([^:]+):([a-zA-Z0-9_-]+)$/);
  if (!match) return null;
  return { qrId: match[1]!, token: match[2]! };
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
