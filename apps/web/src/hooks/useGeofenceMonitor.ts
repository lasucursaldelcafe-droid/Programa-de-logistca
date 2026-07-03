import { useEffect } from "react";
import { isInsideGeofence } from "@spe/shared";
import type { Attendance, Sitio } from "@spe/shared";
import { useGeolocationWatch } from "./useGeolocation";
import { recordGeofenceAlert, updateAttendanceLocation } from "./useDataStore";

export function useGeofenceMonitor(
  attendance: Attendance | null,
  site: Sitio | null,
  enabled: boolean,
): { dentroGeocerca: boolean; gpsError: string | null } {
  const { position, error } = useGeolocationWatch(enabled && attendance?.estado !== "cerrado");

  useEffect(() => {
    if (!enabled || !attendance || !site || !position) return;
    if (attendance.estado === "cerrado") return;

    const dentro = isInsideGeofence(
      position,
      { lat: site.lat, lng: site.lng },
      site.radioGeocerca,
    );

    void updateAttendanceLocation(attendance.id, position, dentro);

    if (!dentro && attendance.estado === "activo") {
      void recordGeofenceAlert(attendance.id);
    }
  }, [enabled, attendance, site, position]);

  const dentroGeocerca =
    position && site
      ? isInsideGeofence(position, { lat: site.lat, lng: site.lng }, site.radioGeocerca)
      : true;

  return { dentroGeocerca, gpsError: error };
}
