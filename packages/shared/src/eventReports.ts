import { filterByEventId } from "./dashboard";
import { calcHoursFromAttendance } from "./payroll";
import { INVITATION_LABEL, REPORTE_ESTADO_LABEL, SHIFT_LABEL, ESTADO_LABEL } from "./types";
import type {
  Attendance,
  Evento,
  Invitation,
  PayrollEntry,
  Reporte,
  Sitio,
  Turno,
  Worker,
} from "./types";

export type InformeTab = "operativo" | "rendimiento" | "costos" | "contactos";

export interface InformeMetric {
  label: string;
  value: string | number;
  detalle?: string;
}

export interface InformeWorkerPerformance {
  workerId: string;
  workerNombre: string;
  turnosConfirmados: number;
  turnosCompletados: number;
  jornadasCerradas: number;
  horasTotales: number;
  alertasGeocerca: number;
  reportesAbiertos: number;
  rating: number;
  puntualidadPct: number;
}

export interface InformeContacto {
  workerId: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  cuentaActiva: boolean;
  turnosEnEvento: number;
  ultimaJornada?: string;
}

export interface EventInformeData {
  evento: Evento;
  operativo: InformeMetric[];
  rendimiento: InformeWorkerPerformance[];
  costos: InformeMetric[];
  contactos: InformeContacto[];
  resumenCostoTotal: number;
}

function workerIdsInEvent(shifts: Turno[], eventId: string): Set<string> {
  return new Set(shifts.filter((s) => s.eventId === eventId).map((s) => s.workerId));
}

export function buildOperationalReport(data: {
  evento: Evento;
  sites: Sitio[];
  shifts: Turno[];
  attendances: Attendance[];
  reportes: Reporte[];
}): InformeMetric[] {
  const { evento } = data;
  const shifts = filterByEventId(data.shifts, evento.id);
  const attendances = filterByEventId(data.attendances, evento.id);
  const reportes = filterByEventId(data.reportes, evento.id);
  const sites = data.sites.filter((s) => s.eventId === evento.id);

  const activas = attendances.filter((a) => a.estado !== "cerrado");
  const cerradas = attendances.filter((a) => a.estado === "cerrado");
  const fueraGeocerca = attendances.filter(
    (a) => a.estado === "fuera_geocerca" || (a.alertasGeocerca?.length ?? 0) > 0,
  );

  return [
    { label: "Evento", value: evento.nombre },
    {
      label: "Período",
      value: `${new Date(evento.fechaInicio).toLocaleDateString("es-CO")} – ${new Date(evento.fechaFin).toLocaleDateString("es-CO")}`,
    },
    { label: "Sitios operativos", value: sites.length },
    { label: "Turnos programados", value: shifts.length },
    { label: "Turnos confirmados", value: shifts.filter((s) => s.estado === "confirmado").length },
    { label: "Jornadas activas", value: activas.length },
    { label: "Jornadas cerradas", value: cerradas.length },
    { label: "Alertas geocerca", value: fueraGeocerca.length },
    { label: "Reportes abiertos", value: reportes.filter((r) => r.estado === "abierto").length },
    { label: "Reportes resueltos", value: reportes.filter((r) => r.estado === "resuelto").length },
    {
      label: "Temática laboral",
      value: evento.temaLaboral?.trim() ? "Definida" : "Pendiente",
      detalle: evento.temaLaboral ?? "",
    },
  ];
}

export function buildPerformanceReport(data: {
  evento: Evento;
  workers: Worker[];
  shifts: Turno[];
  attendances: Attendance[];
  reportes: Reporte[];
}): InformeWorkerPerformance[] {
  const shifts = filterByEventId(data.shifts, data.evento.id);
  const attendances = filterByEventId(data.attendances, data.evento.id);
  const reportes = filterByEventId(data.reportes, data.evento.id);
  const ids = workerIdsInEvent(shifts, data.evento.id);

  return data.workers
    .filter((w) => ids.has(w.id))
    .map((worker) => {
      const workerShifts = shifts.filter((s) => s.workerId === worker.id);
      const workerAtt = attendances.filter((a) => a.workerId === worker.id);
      const confirmados = workerShifts.filter((s) => s.estado === "confirmado" || s.estado === "completado");
      const cerradas = workerAtt.filter((a) => a.estado === "cerrado");
      const horasTotales = cerradas.reduce((sum, a) => sum + calcHoursFromAttendance(a), 0);
      const alertas = workerAtt.reduce((sum, a) => sum + (a.alertasGeocerca?.length ?? 0), 0);
      const reportesAbiertos = reportes.filter(
        (r) => r.workerId === worker.id && r.estado !== "resuelto",
      ).length;

      const puntualidadBase = confirmados.length || 1;
      const aTiempo = cerradas.filter((a) => a.entrada.dentroGeocerca).length;

      return {
        workerId: worker.id,
        workerNombre: worker.nombre,
        turnosConfirmados: confirmados.length,
        turnosCompletados: workerShifts.filter((s) => s.estado === "completado").length,
        jornadasCerradas: cerradas.length,
        horasTotales: Math.round(horasTotales * 100) / 100,
        alertasGeocerca: alertas,
        reportesAbiertos,
        rating: worker.rating,
        puntualidadPct: Math.round((aTiempo / puntualidadBase) * 100),
      };
    })
    .sort((a, b) => b.horasTotales - a.horasTotales);
}

export function buildCostReport(data: {
  evento: Evento;
  payroll: PayrollEntry[];
}): { metrics: InformeMetric[]; total: number } {
  const payroll = filterByEventId(data.payroll, data.evento.id);
  const pendiente = payroll.filter((p) => p.estado === "pendiente");
  const pagado = payroll.filter((p) => p.estado === "pagado");
  const totalHoras = payroll.reduce((s, p) => s + p.horasTrabajadas, 0);
  const totalRefrigerios = payroll.reduce((s, p) => s + p.totalRefrigerios, 0);
  const subtotalHoras = payroll.reduce((s, p) => s + p.subtotalHoras, 0);
  const total = payroll.reduce((s, p) => s + p.total, 0);

  return {
    total,
    metrics: [
      { label: "Entradas de nómina", value: payroll.length },
      { label: "Horas liquidadas", value: Math.round(totalHoras * 100) / 100 },
      { label: "Subtotal horas (COP)", value: subtotalHoras },
      { label: "Refrigerios (COP)", value: totalRefrigerios },
      { label: "Costo pendiente (COP)", value: pendiente.reduce((s, p) => s + p.total, 0) },
      { label: "Costo pagado (COP)", value: pagado.reduce((s, p) => s + p.total, 0) },
      { label: "Costo total evento (COP)", value: total },
    ],
  };
}

export function buildContactsReport(data: {
  evento: Evento;
  workers: Worker[];
  shifts: Turno[];
  attendances: Attendance[];
  invitations: Invitation[];
}): InformeContacto[] {
  const shifts = filterByEventId(data.shifts, data.evento.id);
  const attendances = filterByEventId(data.attendances, data.evento.id);
  const ids = workerIdsInEvent(shifts, data.evento.id);

  return data.workers
    .filter((w) => ids.has(w.id))
    .map((worker) => {
      const workerAtt = attendances
        .filter((a) => a.workerId === worker.id)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
      const ultima = workerAtt[0];

      return {
        workerId: worker.id,
        nombre: worker.nombre,
        email: worker.email,
        telefono: worker.telefono,
        rol: worker.rolPlataforma,
        cuentaActiva: worker.cuentaCreada === true,
        turnosEnEvento: shifts.filter((s) => s.workerId === worker.id).length,
        ultimaJornada: ultima?.creadoEn,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function buildFullEventInforme(data: {
  evento: Evento;
  sites: Sitio[];
  workers: Worker[];
  shifts: Turno[];
  attendances: Attendance[];
  reportes: Reporte[];
  payroll: PayrollEntry[];
  invitations: Invitation[];
}): EventInformeData {
  const costos = buildCostReport({ evento: data.evento, payroll: data.payroll });
  return {
    evento: data.evento,
    operativo: buildOperationalReport(data),
    rendimiento: buildPerformanceReport(data),
    costos: costos.metrics,
    resumenCostoTotal: costos.total,
    contactos: buildContactsReport(data),
  };
}

export function exportInformeCsv(informe: EventInformeData, tab: InformeTab): string {
  const header = [`Informe ${tab} — ${informe.evento.nombre}`, `Generado: ${new Date().toISOString()}`];
  const lines: string[] = [...header, ""];

  if (tab === "operativo" || tab === "costos") {
    const rows = tab === "operativo" ? informe.operativo : informe.costos;
    lines.push("Métrica,Valor,Detalle");
    for (const m of rows) {
      lines.push(`"${m.label}","${m.value}","${m.detalle ?? ""}"`);
    }
  }

  if (tab === "rendimiento") {
    lines.push(
      "Trabajador,Turnos confirmados,Jornadas,Horas,Alertas geocerca,Reportes abiertos,Rating,Puntualidad %",
    );
    for (const r of informe.rendimiento) {
      lines.push(
        `"${r.workerNombre}",${r.turnosConfirmados},${r.jornadasCerradas},${r.horasTotales},${r.alertasGeocerca},${r.reportesAbiertos},${r.rating},${r.puntualidadPct}`,
      );
    }
  }

  if (tab === "contactos") {
    lines.push("Nombre,Email,Teléfono,Rol,Cuenta activa,Turnos,Última jornada");
    for (const c of informe.contactos) {
      lines.push(
        `"${c.nombre}","${c.email}","${c.telefono}","${c.rol}",${c.cuentaActiva ? "Sí" : "No"},${c.turnosEnEvento},"${c.ultimaJornada ?? ""}"`,
      );
    }
  }

  return lines.join("\n");
}

export { SHIFT_LABEL, ESTADO_LABEL, REPORTE_ESTADO_LABEL, INVITATION_LABEL };
