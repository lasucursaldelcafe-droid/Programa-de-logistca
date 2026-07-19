import { useEffect, useRef } from "react";
import { isInsideGeofence } from "@spe/shared";
import type { Attendance, Sitio } from "@spe/shared";
import { useGeolocationWatch } from "./useGeolocation";
import {
  confirmArrivalAtSite,
  recordGeofenceAlert,
  recordGeofenceReentry,
  updateAttendanceLocation,
} from "./useDataStore";

export function useGeofenceMonitor(
  attendance: Attendance | null,
  site: Sitio | null,
  enabled: boolean,
): { dentroGeocerca: boolean; gpsError: string | null } {
  const { position, error } = useGeolocationWatch(enabled && attendance?.estado !== "cerrado");
  const prevDentroRef = useRef<boolean | null>(null);
  const salioRef = useRef(false);

  useEffect(() => {
    if (!enabled || !attendance || !site || !position) return;
    if (attendance.estado === "cerrado") return;

    const dentro = isInsideGeofence(
      position,
      { lat: site.lat, lng: site.lng },
      site.radioGeocerca,
    );

    const prev = prevDentroRef.current;

    void updateAttendanceLocation(attendance.id, position, dentro);

    // Salió del área asignada
    if (!dentro && prev === true && attendance.estado !== "fuera_geocerca") {
      salioRef.current = true;
      void recordGeofenceAlert(attendance.id);
    }

    // Llegó al área (entrada GPS tras check-in fuera de geocerca)
    if (
      dentro &&
      (prev === false || prev === null) &&
      (attendance.estado === "revision_manual" || attendance.estado === "fuera_geocerca")
    ) {
      void confirmArrivalAtSite(attendance.id);
      salioRef.current = false;
    }

    // Re-entrada tras haber salido
    if (dentro && prev === false && salioRef.current && attendance.estado === "fuera_geocerca") {
      salioRef.current = false;
      void recordGeofenceReentry(attendance.id);
    }

    prevDentroRef.current = dentro;
  }, [enabled, attendance, site, position]);

  const dentroGeocerca =
    position && site
      ? isInsideGeofence(position, { lat: site.lat, lng: site.lng }, site.radioGeocerca)
      : true;

  return { dentroGeocerca, gpsError: error };
}
