import type { Attendance, Sitio } from "@spe/shared";

interface MapMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  tone: "site" | "activo" | "alerta" | "revision";
}

interface LiveMapProps {
  sites: Sitio[];
  attendances: Attendance[];
}

function collectMarkers(sites: Sitio[], attendances: Attendance[]): MapMarker[] {
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

const toneColor: Record<MapMarker["tone"], string> = {
  site: "#E8823C",
  activo: "#3DDC97",
  alerta: "#D9455F",
  revision: "#fbbf24",
};

export function LiveMap({ sites, attendances }: LiveMapProps) {
  const markers = collectMarkers(sites, attendances);
  if (markers.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-border bg-bg text-sm text-neutral-500">
        Sin datos de mapa
      </div>
    );
  }

  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);
  const minLat = Math.min(...lats) - 0.001;
  const maxLat = Math.max(...lats) + 0.001;
  const minLng = Math.min(...lngs) - 0.001;
  const maxLng = Math.max(...lngs) + 0.001;

  const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100;
  const toY = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat)) * 100;

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-border bg-[#111]">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {[20, 40, 60, 80].map((n) => (
          <g key={n} className="text-neutral-800">
            <line x1={n} y1={0} x2={n} y2={100} stroke="currentColor" strokeWidth={0.15} />
            <line x1={0} y1={n} x2={100} y2={n} stroke="currentColor" strokeWidth={0.15} />
          </g>
        ))}
        {sites.map((s) => (
          <circle
            key={`fence-${s.id}`}
            cx={toX(s.lng)}
            cy={toY(s.lat)}
            r={(s.radioGeocerca / 111_000) * 100 * 8}
            fill="none"
            stroke="#E8823C33"
            strokeWidth={0.4}
            strokeDasharray="1 1"
          />
        ))}
        {markers.map((m) => (
          <g key={m.id}>
            <circle cx={toX(m.lng)} cy={toY(m.lat)} r={1.8} fill={toneColor[m.tone]} />
            <text
              x={toX(m.lng) + 2.5}
              y={toY(m.lat) + 0.8}
              fontSize={2.5}
              fill="#d4d4d4"
            >
              {m.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#E8823C]" /> Sitio</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3DDC97]" /> Activo</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#D9455F]" /> Alerta</span>
      </div>
    </div>
  );
}
