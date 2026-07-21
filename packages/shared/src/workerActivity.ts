import type {
  Attendance,
  Reporte,
  ShiftEstado,
  Turno,
  Worker,
  WorkerEstado,
} from "./types";
import { ATTENDANCE_LABEL, ESTADO_LABEL, SHIFT_LABEL } from "./types";

/** Qué está haciendo un trabajador ahora (vista CEO / dirección). */
export type WorkerActivityKind =
  | "en_jornada"
  | "fuera_geocerca"
  | "revision_manual"
  | "turno_confirmado"
  | "turno_pendiente"
  | "sin_actividad"
  | "deshabilitado";

export interface WorkerActivityRow {
  workerId: string;
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  rolPlataforma: Worker["rolPlataforma"];
  perfiles: string[];
  fichaEstado: WorkerEstado;
  kind: WorkerActivityKind;
  /** Frase corta: qué hace ahora */
  actividad: string;
  /** Contexto: evento / sitio / turno */
  contexto: string;
  eventNombre?: string;
  siteNombre?: string;
  turnoEstado?: ShiftEstado;
  jornadaEstado?: Attendance["estado"];
  ubicacion?: { lat: number; lng: number };
  entradaEn?: string;
  reportesAbiertos: number;
  sortPriority: number;
}

const KIND_PRIORITY: Record<WorkerActivityKind, number> = {
  fuera_geocerca: 0,
  revision_manual: 1,
  en_jornada: 2,
  turno_confirmado: 3,
  turno_pendiente: 4,
  sin_actividad: 5,
  deshabilitado: 6,
};

function activeAttendanceForWorker(
  workerId: string,
  attendances: Attendance[],
): Attendance | null {
  const activas = attendances.filter(
    (a) => a.workerId === workerId && a.estado !== "cerrado",
  );
  if (activas.length === 0) return null;
  return [...activas].sort((a, b) => b.entrada.timestamp.localeCompare(a.entrada.timestamp))[0] ?? null;
}

function relevantShiftForWorker(workerId: string, shifts: Turno[]): Turno | null {
  const now = Date.now();
  const candidates = shifts.filter(
    (s) =>
      s.workerId === workerId &&
      (s.estado === "confirmado" || s.estado === "pendiente"),
  );
  if (candidates.length === 0) return null;

  const scored = candidates.map((s) => {
    const start = new Date(s.inicio).getTime();
    const end = new Date(s.fin).getTime();
    let score = 100;
    if (!Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end) {
      score = 0;
    } else if (!Number.isNaN(start) && start > now) {
      score = 1 + (start - now) / 1e12;
    } else {
      score = 50;
    }
    if (s.estado === "pendiente") score += 0.5;
    return { s, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.s ?? null;
}

function formatWhen(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Construye la vista «trabajadores y qué hacen» para CEO / Master.
 * Une ficha + jornada GPS activa + turno relevante + reportes abiertos.
 */
export function buildWorkerActivityRows(input: {
  workers: Worker[];
  attendances: Attendance[];
  shifts: Turno[];
  reportes?: Reporte[];
}): WorkerActivityRow[] {
  const { workers, attendances, shifts, reportes = [] } = input;

  const rows = workers.map((w): WorkerActivityRow => {
    const reportesAbiertos = reportes.filter(
      (r) => r.workerId === w.id && r.estado !== "resuelto",
    ).length;

    if (w.habilitado === false) {
      return {
        workerId: w.id,
        nombre: w.nombre,
        documento: w.documento,
        email: w.email,
        telefono: w.telefono,
        rolPlataforma: w.rolPlataforma,
        perfiles: w.perfiles,
        fichaEstado: w.estado,
        kind: "deshabilitado",
        actividad: "Cuenta deshabilitada",
        contexto: ESTADO_LABEL[w.estado],
        reportesAbiertos,
        sortPriority: KIND_PRIORITY.deshabilitado,
      };
    }

    const jornada = activeAttendanceForWorker(w.id, attendances);
    if (jornada) {
      let kind: WorkerActivityKind = "en_jornada";
      if (jornada.estado === "fuera_geocerca") kind = "fuera_geocerca";
      else if (jornada.estado === "revision_manual") kind = "revision_manual";

      const actividad =
        kind === "fuera_geocerca"
          ? "Fuera de geocerca (alerta)"
          : kind === "revision_manual"
            ? "En revisión manual GPS"
            : "Trabajando en sitio (jornada activa)";

      const partes = [
        jornada.eventNombre,
        jornada.siteNombre,
        ATTENDANCE_LABEL[jornada.estado],
      ].filter(Boolean);

      return {
        workerId: w.id,
        nombre: w.nombre,
        documento: w.documento,
        email: w.email,
        telefono: w.telefono,
        rolPlataforma: w.rolPlataforma,
        perfiles: w.perfiles,
        fichaEstado: w.estado,
        kind,
        actividad,
        contexto: partes.join(" · "),
        eventNombre: jornada.eventNombre,
        siteNombre: jornada.siteNombre,
        jornadaEstado: jornada.estado,
        ubicacion: jornada.ubicacionActual,
        entradaEn: jornada.entrada.timestamp,
        reportesAbiertos,
        sortPriority: KIND_PRIORITY[kind],
      };
    }

    const turno = relevantShiftForWorker(w.id, shifts);
    if (turno) {
      const kind: WorkerActivityKind =
        turno.estado === "confirmado" ? "turno_confirmado" : "turno_pendiente";
      const cuando = formatWhen(turno.inicio);
      const actividad =
        kind === "turno_confirmado"
          ? "Turno confirmado — aún no marca entrada"
          : "Turno pendiente de aceptación";

      const partes = [
        turno.eventNombre,
        turno.siteNombre,
        SHIFT_LABEL[turno.estado],
        cuando ? `inicio ${cuando}` : null,
      ].filter(Boolean);

      return {
        workerId: w.id,
        nombre: w.nombre,
        documento: w.documento,
        email: w.email,
        telefono: w.telefono,
        rolPlataforma: w.rolPlataforma,
        perfiles: w.perfiles,
        fichaEstado: w.estado,
        kind,
        actividad,
        contexto: partes.join(" · "),
        eventNombre: turno.eventNombre,
        siteNombre: turno.siteNombre,
        turnoEstado: turno.estado,
        reportesAbiertos,
        sortPriority: KIND_PRIORITY[kind],
      };
    }

    return {
      workerId: w.id,
      nombre: w.nombre,
      documento: w.documento,
      email: w.email,
      telefono: w.telefono,
      rolPlataforma: w.rolPlataforma,
      perfiles: w.perfiles,
      fichaEstado: w.estado,
      kind: "sin_actividad",
      actividad: "Sin jornada ni turno activo",
      contexto: ESTADO_LABEL[w.estado],
      reportesAbiertos,
      sortPriority: KIND_PRIORITY.sin_actividad,
    };
  });

  return rows.sort((a, b) => {
    if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export const WORKER_ACTIVITY_KIND_LABEL: Record<WorkerActivityKind, string> = {
  en_jornada: "En jornada",
  fuera_geocerca: "Fuera de geocerca",
  revision_manual: "Revisión GPS",
  turno_confirmado: "Turno listo",
  turno_pendiente: "Turno pendiente",
  sin_actividad: "Sin actividad",
  deshabilitado: "Deshabilitado",
};
