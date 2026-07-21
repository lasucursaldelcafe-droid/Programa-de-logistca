import { lazy, Suspense } from "react";
import type { Attendance, Sitio } from "@spe/shared";
import { isGoogleMapsEnabled, getGoogleMapsApiKey } from "../lib/googleMaps";
import { LiveMapSchematic } from "./LiveMapSchematic";

const GoogleLiveMap = lazy(() =>
  import("./GoogleLiveMap").then((m) => ({ default: m.GoogleLiveMap })),
);

interface LiveMapProps {
  sites: Sitio[];
  attendances: Attendance[];
  className?: string;
}

export function LiveMap({ sites, attendances, className }: LiveMapProps) {
  const useGoogle = isGoogleMapsEnabled();
  const heightClass = className ?? "spe-map-frame";

  if (useGoogle) {
    return (
      <Suspense fallback={<LiveMapSchematic sites={sites} attendances={attendances} className={heightClass} />}>
        <GoogleLiveMap
          apiKey={getGoogleMapsApiKey()}
          sites={sites}
          attendances={attendances}
          className={heightClass}
        />
      </Suspense>
    );
  }

  return <LiveMapSchematic sites={sites} attendances={attendances} className={heightClass} />;
}

/** Indica si la UI está usando Google Maps (útil para avisos en la página). */
export function liveMapUsesGoogle(): boolean {
  return isGoogleMapsEnabled();
}
