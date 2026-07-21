import { useEffect, useRef } from "react";
import { haversineMeters, isInsideGeofence } from "@spe/shared";
import type { Attendance, Sitio } from "@spe/shared";
import { useGeolocationWatch } from "./useGeolocation";
import {
  confirmArrivalAtSite,
  recordGeofenceAlert,
  recordGeofenceReentry,
  updateAttendanceLocation,
} from "./useDataStore";

const MIN_WRITE_INTERVAL_MS = 10_000;
const MIN_MOVE_METERS = 8;

export function useGeofenceMonitor(
  attendance: Attendance | null,
  site: Sitio | null,
  enabled: boolean,
): { dentroGeocerca: boolean | null; gpsError: string | null } {
  const { position, error } = useGeolocationWatch(enabled && attendance?.estado !== "cerrado");
  const prevDentroRef = useRef<boolean | null>(null);
  const salioRef = useRef(false);
  const lastWriteRef = useRef<{ t: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!enabled || !attendance || !site || !position) return;
    if (attendance.estado === "cerrado") return;

    const radio = site.radioGeocerca > 0 ? site.radioGeocerca : 100;
    const dentro = isInsideGeofence(
      position,
      { lat: site.lat, lng: site.lng },
      radio,
    );

    const prev = prevDentroRef.current;
    const now = Date.now();
    const last = lastWriteRef.current;
    const moved =
      !last ||
      haversineMeters(last.lat, last.lng, position.lat, position.lng) >= MIN_MOVE_METERS;
    const crossed = prev !== null && prev !== dentro;
    const firstFix = prev === null;
    const due = !last || now - last.t >= MIN_WRITE_INTERVAL_MS;

    if (firstFix || crossed || (due && moved) || (due && !last)) {
      lastWriteRef.current = { t: now, lat: position.lat, lng: position.lng };
      void updateAttendanceLocation(attendance.id, position, dentro).catch((err) => {
        console.error("No se pudo actualizar ubicación GPS", err);
      });
    }

    // Salió del área asignada
    if (!dentro && prev === true && attendance.estado !== "fuera_geocerca") {
      salioRef.current = true;
      void recordGeofenceAlert(attendance.id).catch((err) => {
        console.error("No se pudo registrar alerta de geocerca", err);
      });
    }

    // Llegó al área (entrada GPS tras check-in fuera de geocerca)
    if (
      dentro &&
      (prev === false || prev === null) &&
      (attendance.estado === "revision_manual" || attendance.estado === "fuera_geocerca")
    ) {
      void confirmArrivalAtSite(attendance.id).catch((err) => {
        console.error("No se pudo confirmar llegada al sitio", err);
      });
      salioRef.current = false;
    }

    // Re-entrada tras haber salido
    if (dentro && prev === false && salioRef.current && attendance.estado === "fuera_geocerca") {
      salioRef.current = false;
      void recordGeofenceReentry(attendance.id).catch((err) => {
        console.error("No se pudo registrar re-entrada", err);
      });
    }

    prevDentroRef.current = dentro;
  }, [enabled, attendance, site, position]);

  const dentroGeocerca =
    position && site
      ? isInsideGeofence(
          position,
          { lat: site.lat, lng: site.lng },
          site.radioGeocerca > 0 ? site.radioGeocerca : 100,
        )
      : null;

  return { dentroGeocerca, gpsError: error };
}
