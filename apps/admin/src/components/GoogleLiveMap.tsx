import { useEffect } from "react";
import { APIProvider, Circle, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import type { Attendance, Sitio } from "@spe/shared";
import {
  collectMapMarkers,
  computeMapBounds,
  defaultMapCenter,
  toneColor,
  type MapMarker,
} from "./mapMarkers";
import { MapLegend } from "./MapLegend";

interface GoogleLiveMapProps {
  apiKey: string;
  sites: Sitio[];
  attendances: Attendance[];
}

interface BoundsLiteral {
  north: number;
  south: number;
  east: number;
  west: number;
}

function FitBounds({ bounds }: { bounds: BoundsLiteral }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.fitBounds(bounds, 48);
  }, [map, bounds]);

  return null;
}

function markerIconUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="9" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function ColoredMarker({ marker }: { marker: MapMarker }) {
  return (
    <Marker
      position={{ lat: marker.lat, lng: marker.lng }}
      title={marker.label}
      icon={markerIconUrl(toneColor[marker.tone])}
    />
  );
}

function GoogleMapContent({ sites, attendances }: Omit<GoogleLiveMapProps, "apiKey">) {
  const markers = collectMapMarkers(sites, attendances);
  const bounds = computeMapBounds(markers, sites);
  const center = defaultMapCenter(markers);

  return (
    <Map
      defaultCenter={center}
      defaultZoom={16}
      gestureHandling="greedy"
      disableDefaultUI={false}
      fullscreenControl
      zoomControl
      streetViewControl={false}
      mapTypeControl
      className="h-full w-full"
    >
      {bounds ? <FitBounds bounds={bounds} /> : null}

      {sites.map((s) => (
        <Circle
          key={`fence-${s.id}`}
          center={{ lat: s.lat, lng: s.lng }}
          radius={s.radioGeocerca}
          strokeColor="#E8823C"
          strokeOpacity={0.85}
          strokeWeight={2}
          fillColor="#E8823C"
          fillOpacity={0.12}
        />
      ))}

      {markers.map((m) => (
        <ColoredMarker key={m.id} marker={m} />
      ))}
    </Map>
  );
}

export function GoogleLiveMap({ apiKey, sites, attendances }: GoogleLiveMapProps) {
  const markers = collectMapMarkers(sites, attendances);

  if (markers.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-border bg-bg text-sm text-neutral-500">
        Sin datos de mapa
      </div>
    );
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-border">
      <APIProvider apiKey={apiKey} language="es" region="CO">
        <GoogleMapContent sites={sites} attendances={attendances} />
      </APIProvider>
      <MapLegend />
    </div>
  );
}
