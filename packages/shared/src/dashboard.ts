import type {
  AppNotification,
  Attendance,
  Evento,
  Invitation,
  PayrollEntry,
  ShiftEstado,
  Sitio,
  Turno,
  Worker,
  WorkerEstado,
} from "./types";
import { ESTADO_LABEL, SHIFT_LABEL } from "./types";

export interface DashboardKpis {
  workersTotal: number;
  workersEnSitio: number;
  workersDescanso: number;
  workersSinAsignar: number;
  turnosPendientes: number;
  turnosConfirmados: number;
  turnosRechazados: number;
  jornadasActivas: number;
  jornadasCerradas: number;
  alertasGeocerca: number;
  nominaPendienteCount: number;
  nominaPendienteMonto: number;
  nominaPagadaMonto: number;
  invitacionesPendientes: number;
  cuentasSinActivar: number;
}

export interface CountBar {
  label: string;
  value: number;
  tone?: "accent" | "positive" | "alert" | "neutral";
}

export interface SiteDashboardRow {
  siteId: string;
  siteNombre: string;
  eventNombre?: string;
  jornadasActivas: number;
  alertas: number;
  turnosHoy: number;
}

export interface ActivityItem {
  id: string;
  titulo: string;
  mensaje: string;
  timestamp: string;
  urgente: boolean;
  tipo: string;
}

const WORKER_TONE: Record<WorkerEstado, CountBar["tone"]> = {
  en_sitio: "positive",
  descanso: "accent",
  inactivo: "neutral",
  sin_asignar: "neutral",
};

const SHIFT_TONE: Record<ShiftEstado, CountBar["tone"]> = {
  pendiente: "accent",
  confirmado: "positive",
  rechazado: "alert",
  completado: "neutral",
};

export function filterByEventId<T extends { eventId?: string }>(
  items: T[],
  eventId?: string,
): T[] {
  if (!eventId) return items;
  return items.filter((item) => item.eventId === eventId);
}

export function buildDashboardKpis(data: {
  workers: Worker[];
  shifts: Turno[];
  attendances: Attendance[];
  payroll: PayrollEntry[];
  invitations: Invitation[];
  eventId?: string;
}): DashboardKpis {
  const shifts = filterByEventId(data.shifts, data.eventId);
  const attendances = filterByEventId(data.attendances, data.eventId);
  const payroll = filterByEventId(data.payroll, data.eventId);

  const workerIdsInEvent = data.eventId
    ? new Set(shifts.map((s) => s.workerId))
    : null;

  const workersScoped = workerIdsInEvent
    ? data.workers.filter((w) => workerIdsInEvent.has(w.id))
    : data.workers;

  return {
    workersTotal: workersScoped.length,
    workersEnSitio: workersScoped.filter((w) => w.estado === "en_sitio").length,
    workersDescanso: workersScoped.filter((w) => w.estado === "descanso").length,
    workersSinAsignar: workersScoped.filter((w) => w.estado === "sin_asignar").length,
    turnosPendientes: shifts.filter((s) => s.estado === "pendiente").length,
    turnosConfirmados: shifts.filter((s) => s.estado === "confirmado").length,
    turnosRechazados: shifts.filter((s) => s.estado === "rechazado").length,
    jornadasActivas: attendances.filter((a) => a.estado !== "cerrado").length,
    jornadasCerradas: attendances.filter((a) => a.estado === "cerrado").length,
    alertasGeocerca: attendances.filter(
      (a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual",
    ).length,
    nominaPendienteCount: payroll.filter((p) => p.estado === "pendiente").length,
    nominaPendienteMonto: payroll
      .filter((p) => p.estado === "pendiente")
      .reduce((sum, p) => sum + p.total, 0),
    nominaPagadaMonto: payroll
      .filter((p) => p.estado === "pagado")
      .reduce((sum, p) => sum + p.total, 0),
    invitacionesPendientes: data.invitations.filter((i) => i.estado === "pendiente").length,
    cuentasSinActivar: workersScoped.filter((w) => !w.cuentaCreada).length,
  };
}

export function workerStatusBars(workers: Worker[]): CountBar[] {
  const counts = new Map<WorkerEstado, number>();
  for (const w of workers) {
    counts.set(w.estado, (counts.get(w.estado) ?? 0) + 1);
  }
  return (Object.keys(ESTADO_LABEL) as WorkerEstado[]).map((estado) => ({
    label: ESTADO_LABEL[estado],
    value: counts.get(estado) ?? 0,
    tone: WORKER_TONE[estado],
  }));
}

export function shiftStatusBars(shifts: Turno[]): CountBar[] {
  const counts = new Map<ShiftEstado, number>();
  for (const s of shifts) {
    counts.set(s.estado, (counts.get(s.estado) ?? 0) + 1);
  }
  return (Object.keys(SHIFT_LABEL) as ShiftEstado[]).map((estado) => ({
    label: SHIFT_LABEL[estado],
    value: counts.get(estado) ?? 0,
    tone: SHIFT_TONE[estado],
  }));
}

export function attendanceBySiteBars(
  attendances: Attendance[],
  sites: Sitio[],
): CountBar[] {
  const active = attendances.filter((a) => a.estado !== "cerrado");
  return sites.map((site) => ({
    label: site.nombre,
    value: active.filter((a) => a.siteId === site.id).length,
    tone: "positive" as const,
  }));
}

export function payrollStatusBars(payroll: PayrollEntry[]): CountBar[] {
  const pendiente = payroll.filter((p) => p.estado === "pendiente").length;
  const pagado = payroll.filter((p) => p.estado === "pagado").length;
  return [
    { label: "Pendiente", value: pendiente, tone: "accent" },
    { label: "Pagado", value: pagado, tone: "positive" },
  ];
}

export function buildSiteBreakdown(
  sites: Sitio[],
  attendances: Attendance[],
  shifts: Turno[],
  events: Evento[],
  eventId?: string,
): SiteDashboardRow[] {
  const scopedSites = eventId ? sites.filter((s) => s.eventId === eventId) : sites;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return scopedSites.map((site) => {
    const event = events.find((e) => e.id === site.eventId);
    const siteAtt = attendances.filter((a) => a.siteId === site.id);
    const activos = siteAtt.filter((a) => a.estado !== "cerrado");
    const alertas = activos.filter(
      (a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual",
    ).length;
    const turnosHoy = shifts.filter((s) => {
      if (s.siteId !== site.id) return false;
      const inicio = new Date(s.inicio).getTime();
      return Math.abs(inicio - now) < dayMs || inicio > now - dayMs;
    }).length;

    return {
      siteId: site.id,
      siteNombre: site.nombre,
      eventNombre: event?.nombre,
      jornadasActivas: activos.length,
      alertas,
      turnosHoy,
    };
  });
}

export function notificationsToActivity(notifications: AppNotification[]): ActivityItem[] {
  return notifications.slice(0, 12).map((n) => ({
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    timestamp: n.timestamp,
    urgente: n.urgente,
    tipo: n.tipo,
  }));
}

export interface WorkerDashboardKpis {
  turnosPendientes: number;
  turnosConfirmados: number;
  jornadaActiva: boolean;
  alertaGeocerca: boolean;
  nominaPendienteMonto: number;
  horasTrabajadasMes: number;
}

export function buildWorkerDashboardKpis(
  workerId: string,
  shifts: Turno[],
  attendances: Attendance[],
  payroll: PayrollEntry[],
): WorkerDashboardKpis {
  const myShifts = shifts.filter((s) => s.workerId === workerId);
  const activeAtt = attendances.find(
    (a) => a.workerId === workerId && a.estado !== "cerrado",
  );
  const myPayroll = payroll.filter((p) => p.workerId === workerId);
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const horasMes = attendances
    .filter(
      (a) =>
        a.workerId === workerId &&
        a.estado === "cerrado" &&
        a.salida &&
        new Date(a.salida.timestamp).getTime() > monthAgo,
    )
    .reduce((sum, a) => {
      if (!a.salida) return sum;
      const h =
        (new Date(a.salida.timestamp).getTime() -
          new Date(a.entrada.timestamp).getTime()) /
        3_600_000;
      return sum + Math.max(0, h);
    }, 0);

  return {
    turnosPendientes: myShifts.filter((s) => s.estado === "pendiente").length,
    turnosConfirmados: myShifts.filter((s) => s.estado === "confirmado").length,
    jornadaActiva: Boolean(activeAtt),
    alertaGeocerca:
      activeAtt?.estado === "fuera_geocerca" ||
      activeAtt?.estado === "revision_manual",
    nominaPendienteMonto: myPayroll
      .filter((p) => p.estado === "pendiente")
      .reduce((sum, p) => sum + p.total, 0),
    horasTrabajadasMes: Math.round(horasMes * 10) / 10,
  };
}

export function puedeVerDashboardOperativo(role: string): boolean {
  return role === "super_admin" || role === "administrador" || role === "supervisor_sitio";
}
