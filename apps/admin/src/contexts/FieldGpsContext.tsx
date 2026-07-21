import { createContext, useContext, type ReactNode } from "react";
import type { Attendance, Sitio } from "@spe/shared";
import { useAuth } from "./AuthContext";
import { useGeofenceMonitor } from "../hooks/useGeofenceMonitor";
import {
  getActiveAttendance,
  useAttendances,
  useSites,
} from "../hooks/useDataStore";

interface FieldGpsState {
  active: Attendance | null;
  site: Sitio | null;
  /** `null` = aún sin fix GPS; no asumir “dentro”. */
  dentroGeocerca: boolean | null;
  gpsError: string | null;
  tracking: boolean;
}

const FieldGpsContext = createContext<FieldGpsState | null>(null);

/**
 * Mantiene el GPS activo en toda la app de campo mientras haya jornada abierta.
 * Antes solo corría en /worker/entrada y el mapa de supervisión se congelaba.
 */
export function FieldGpsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const attendances = useAttendances();
  const sites = useSites();
  const workerId = user?.workerId?.trim() ?? "";
  const active = workerId ? getActiveAttendance(attendances, workerId) : null;
  const site = active ? (sites.find((s) => s.id === active.siteId) ?? null) : null;
  const tracking = Boolean(active && active.estado !== "cerrado");
  const { dentroGeocerca, gpsError } = useGeofenceMonitor(active, site, tracking);

  return (
    <FieldGpsContext.Provider
      value={{ active, site, dentroGeocerca, gpsError, tracking }}
    >
      {children}
    </FieldGpsContext.Provider>
  );
}

export function useFieldGps(): FieldGpsState {
  const ctx = useContext(FieldGpsContext);
  if (!ctx) {
    return {
      active: null,
      site: null,
      dentroGeocerca: null,
      gpsError: null,
      tracking: false,
    };
  }
  return ctx;
}
