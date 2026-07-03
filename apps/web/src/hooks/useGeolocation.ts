import { useEffect, useState } from "react";
import { watchPosition, type GeoPosition } from "../lib/geolocation";

export function useGeolocationWatch(enabled: boolean): {
  position: GeoPosition | null;
  error: string | null;
} {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setError(null);
      return;
    }
    return watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
      },
      (msg) => setError(msg),
    );
  }, [enabled]);

  return { position, error };
}
