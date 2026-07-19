import type { Attendance, Sitio } from "@spe/shared";
import { collectMapMarkers, toneColor } from "./mapMarkers";
import { MapLegend } from "./MapLegend";

interface LiveMapSchematicProps {
  sites: Sitio[];
  attendances: Attendance[];
}

export function LiveMapSchematic({ sites, attendances }: LiveMapSchematicProps) {
  const markers = collectMapMarkers(sites, attendances);
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
      <MapLegend />
    </div>
  );
}
