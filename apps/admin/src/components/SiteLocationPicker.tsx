import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Circle, Map, Marker, useMap, type MapMouseEvent } from "@vis.gl/react-google-maps";
import { geocodeAddress, reverseGeocode } from "../lib/geocode";
import { getGoogleMapsApiKey, isGoogleMapsEnabled } from "../lib/googleMaps";

export interface SiteLocationValue {
  direccion: string;
  lat: string;
  lng: string;
  radioGeocerca: string;
}

interface SiteLocationPickerProps {
  value: SiteLocationValue;
  onChange: (value: SiteLocationValue) => void;
}

const DEFAULT_CENTER = { lat: 4.6533, lng: -74.0836 };
const SCHEMATIC_SPAN = 0.004;

function parseCoord(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function SchematicSiteMap({
  lat,
  lng,
  radioMeters,
  onPick,
}: {
  lat: number;
  lng: number;
  radioMeters: number;
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  const minLat = lat - SCHEMATIC_SPAN;
  const maxLat = lat + SCHEMATIC_SPAN;
  const minLng = lng - SCHEMATIC_SPAN;
  const maxLng = lng + SCHEMATIC_SPAN;

  const toX = (lon: number) => ((lon - minLng) / (maxLng - minLng)) * 100;
  const toY = (latitude: number) => (1 - (latitude - minLat) / (maxLat - minLat)) * 100;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const pickedLng = minLng + (x / 100) * (maxLng - minLng);
    const pickedLat = maxLat - (y / 100) * (maxLat - minLat);
    onPick({ lat: pickedLat, lng: pickedLng });
  };

  const radiusSvg = (radioMeters / 111_000) * 100 * (100 / SCHEMATIC_SPAN / 2);
  const pinX = toX(lng);
  const pinY = toY(lat);

  return (
    <div className="spe-map-frame relative overflow-hidden rounded-xl border border-accent/30 bg-[#111]">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full cursor-crosshair"
        onClick={handleClick}
        role="img"
        aria-label="Mapa esquemático: haz clic para seleccionar el punto de trabajo"
      >
        {[20, 40, 60, 80].map((n) => (
          <g key={n} className="text-neutral-800">
            <line x1={n} y1={0} x2={n} y2={100} stroke="currentColor" strokeWidth={0.15} />
            <line x1={0} y1={n} x2={100} y2={n} stroke="currentColor" strokeWidth={0.15} />
          </g>
        ))}
        <line x1={pinX} y1={0} x2={pinX} y2={100} stroke="#E8823C" strokeWidth={0.12} strokeOpacity={0.35} />
        <line x1={0} y1={pinY} x2={100} y2={pinY} stroke="#E8823C" strokeWidth={0.12} strokeOpacity={0.35} />
        <circle
          cx={pinX}
          cy={pinY}
          r={Math.min(radiusSvg, 45)}
          fill="#E8823C"
          fillOpacity={0.12}
          stroke="#E8823C"
          strokeWidth={0.45}
          strokeOpacity={0.85}
          pointerEvents="none"
        />
        <circle cx={pinX} cy={pinY} r={3.2} fill="#E8823C" stroke="white" strokeWidth={0.55} pointerEvents="none" />
        <circle cx={pinX} cy={pinY} r={0.9} fill="white" pointerEvents="none" />
      </svg>
      <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded bg-bg/95 px-2 py-1.5 text-center text-xs text-neutral-300">
        <span className="font-medium text-accent">Selecciona el punto:</span> haz clic en el mapa
      </p>
    </div>
  );
}

/** Recentra suavemente cuando cambian las coordenadas (búsqueda o clic), sin bloquear pan/zoom manual. */
function PanToPin({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;
    const prevCoords = prev.current;
    if (prevCoords && prevCoords.lat === lat && prevCoords.lng === lng) return;
    prev.current = { lat, lng };
    if (prevCoords) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);

  return null;
}

function GoogleSiteMapInner({
  lat,
  lng,
  radioMeters,
  onPick,
}: {
  lat: number;
  lng: number;
  radioMeters: number;
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      const ll = event.detail.latLng;
      if (!ll) return;
      onPick({ lat: ll.lat, lng: ll.lng });
    },
    [onPick],
  );

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      const ll = event.latLng;
      if (!ll) return;
      onPick({ lat: ll.lat(), lng: ll.lng() });
    },
    [onPick],
  );

  return (
    <Map
      defaultCenter={{ lat, lng }}
      defaultZoom={17}
      gestureHandling="greedy"
      disableDefaultUI={false}
      zoomControl
      streetViewControl={false}
      mapTypeControl
      onClick={handleMapClick}
      className="h-full w-full cursor-crosshair"
    >
      <PanToPin lat={lat} lng={lng} />
      <Marker
        key={`${lat.toFixed(6)}-${lng.toFixed(6)}`}
        position={{ lat, lng }}
        draggable
        title="Arrastra el pin o haz clic en el mapa"
        onDragEnd={handleMarkerDragEnd}
      />
      <Circle
        center={{ lat, lng }}
        radius={radioMeters}
        clickable={false}
        strokeColor="#E8823C"
        strokeOpacity={0.9}
        strokeWeight={2}
        fillColor="#E8823C"
        fillOpacity={0.15}
      />
    </Map>
  );
}

function GoogleSiteMap({
  apiKey,
  lat,
  lng,
  radioMeters,
  onPick,
}: {
  apiKey: string;
  lat: number;
  lng: number;
  radioMeters: number;
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  return (
    <div className="spe-map-frame relative overflow-hidden rounded-xl border border-accent/30">
      <APIProvider apiKey={apiKey} language="es" region="CO">
        <GoogleSiteMapInner lat={lat} lng={lng} radioMeters={radioMeters} onPick={onPick} />
      </APIProvider>
      <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded bg-bg/95 px-2 py-1.5 text-center text-xs text-neutral-300">
        <span className="font-medium text-accent">Selecciona el punto:</span> clic en el mapa o arrastra el pin
      </p>
    </div>
  );
}

export function SiteLocationPicker({ value, onChange }: SiteLocationPickerProps) {
  const [geocodeBusy, setGeocodeBusy] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const apiKey = getGoogleMapsApiKey();
  const mapsEnabled = isGoogleMapsEnabled();

  const lat = parseCoord(value.lat, DEFAULT_CENTER.lat);
  const lng = parseCoord(value.lng, DEFAULT_CENTER.lng);
  const radio = Math.max(10, parseCoord(value.radioGeocerca, 80));

  const patch = (partial: Partial<SiteLocationValue>) => {
    onChange({ ...value, ...partial });
  };

  const handlePick = async (coords: { lat: number; lng: number }) => {
    patch({
      lat: coords.lat.toFixed(6),
      lng: coords.lng.toFixed(6),
    });
    if (mapsEnabled) {
      try {
        const addr = await reverseGeocode(coords.lat, coords.lng, apiKey);
        if (addr) patch({ direccion: addr });
      } catch {
        /* mantener dirección anterior */
      }
    }
  };

  async function buscarDireccion() {
    setGeocodeError(null);
    if (!value.direccion.trim()) {
      setGeocodeError("Escribe una dirección para buscar en el mapa.");
      return;
    }
    if (!mapsEnabled) {
      setGeocodeError(
        "Configura la clave de Google Maps para buscar direcciones automáticamente.",
      );
      return;
    }
    setGeocodeBusy(true);
    try {
      const result = await geocodeAddress(value.direccion, apiKey);
      if (!result) {
        setGeocodeError("No se encontró esa dirección. Ajusta el texto o marca el punto en el mapa.");
        return;
      }
      patch({
        direccion: result.formattedAddress,
        lat: result.lat.toFixed(6),
        lng: result.lng.toFixed(6),
      });
    } catch (err) {
      setGeocodeError(err instanceof Error ? err.message : "Error al geocodificar");
    } finally {
      setGeocodeBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <label className="block text-sm">
        Dirección del sitio
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            value={value.direccion}
            onChange={(e) => patch({ direccion: e.target.value })}
            placeholder="Ej. Carrera 7 # 71-21, Bogotá"
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-bg px-3 py-2"
            required
          />
          <button
            type="button"
            onClick={() => void buscarDireccion()}
            disabled={geocodeBusy}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/50 disabled:opacity-50"
          >
            {geocodeBusy ? "Buscando…" : "Buscar en mapa"}
          </button>
        </div>
      </label>

      {geocodeError && (
        <p className="text-sm text-alert">{geocodeError}</p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-neutral-200">Seleccionar punto en el mapa</h3>
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-neutral-400">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>

      {mapsEnabled ? (
        <GoogleSiteMap
          apiKey={apiKey}
          lat={lat}
          lng={lng}
          radioMeters={radio}
          onPick={(c) => void handlePick(c)}
        />
      ) : (
        <>
          <SchematicSiteMap lat={lat} lng={lng} radioMeters={radio} onPick={(c) => void handlePick(c)} />
          <p className="text-xs text-neutral-500">
            Sin clave de Google Maps: haz clic en el mapa esquemático o ingresa latitud/longitud abajo.
            Configura <code className="text-neutral-400">VITE_GOOGLE_MAPS_API_KEY</code> para mapa real,
            arrastrar el pin y búsqueda por dirección.
          </p>
        </>
      )}
      </div>

      <label className="block text-sm">
        Área de trabajo (radio geocerca: {radio} m)
        <input
          type="range"
          min={10}
          max={500}
          step={5}
          value={radio}
          onChange={(e) => patch({ radioGeocerca: e.target.value })}
          className="mt-2 w-full accent-accent"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-500">
          <span>10 m</span>
          <span>500 m</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          El personal debe estar dentro de este círculo para marcar entrada válida por GPS.
        </p>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Latitud
          <input
            value={value.lat}
            onChange={(e) => patch({ lat: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm"
            required
          />
        </label>
        <label className="text-sm">
          Longitud
          <input
            value={value.lng}
            onChange={(e) => patch({ lng: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm"
            required
          />
        </label>
      </div>
    </div>
  );
}
