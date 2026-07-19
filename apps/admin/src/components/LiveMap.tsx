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
}

export function LiveMap({ sites, attendances }: LiveMapProps) {
  const useGoogle = isGoogleMapsEnabled();

  if (useGoogle) {
    return (
      <Suspense fallback={<LiveMapSchematic sites={sites} attendances={attendances} />}>
        <GoogleLiveMap
          apiKey={getGoogleMapsApiKey()}
          sites={sites}
          attendances={attendances}
        />
      </Suspense>
    );
  }

  return <LiveMapSchematic sites={sites} attendances={attendances} />;
}

/** Indica si la UI está usando Google Maps (útil para avisos en la página). */
export function liveMapUsesGoogle(): boolean {
  return isGoogleMapsEnabled();
}
