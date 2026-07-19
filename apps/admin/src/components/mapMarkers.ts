import type { Attendance, Sitio } from "@spe/shared";

export type MapMarkerTone = "site" | "activo" | "alerta" | "revision";

export interface MapMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  tone: MapMarkerTone;
}

export const toneColor: Record<MapMarkerTone, string> = {
  site: "#E8823C",
  activo: "#3DDC97",
  alerta: "#D9455F",
  revision: "#fbbf24",
};

export function collectMapMarkers(sites: Sitio[], attendances: Attendance[]): MapMarker[] {
  const markers: MapMarker[] = sites.map((s) => ({
    id: `site-${s.id}`,
    label: s.nombre,
    lat: s.lat,
    lng: s.lng,
    tone: "site",
  }));

  for (const a of attendances) {
    if (a.estado === "cerrado" || !a.ubicacionActual) continue;
    markers.push({
      id: a.id,
      label: a.workerNombre ?? a.workerId,
      lat: a.ubicacionActual.lat,
      lng: a.ubicacionActual.lng,
      tone:
        a.estado === "fuera_geocerca"
          ? "alerta"
          : a.estado === "revision_manual"
            ? "revision"
            : "activo",
    });
  }
  return markers;
}

export function computeMapBounds(
  markers: MapMarker[],
  sites: Sitio[],
): { north: number; south: number; east: number; west: number } | null {
  const points: Array<{ lat: number; lng: number }> = [...markers];

  for (const s of sites) {
    const delta = s.radioGeocerca / 111_000;
    points.push(
      { lat: s.lat + delta, lng: s.lng + delta },
      { lat: s.lat - delta, lng: s.lng - delta },
    );
  }

  if (points.length === 0) return null;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.0008;

  return {
    north: Math.max(...lats) + pad,
    south: Math.min(...lats) - pad,
    east: Math.max(...lngs) + pad,
    west: Math.min(...lngs) - pad,
  };
}

export function defaultMapCenter(markers: MapMarker[]): { lat: number; lng: number } {
  if (markers.length === 0) return { lat: 4.6533, lng: -74.0836 };
  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}
