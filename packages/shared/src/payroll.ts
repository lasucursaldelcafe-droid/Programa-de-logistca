import type { Attendance, PayrollEntry, PayrollRate, PerfilTrabajo, RefrigerioAsignado, Worker } from "./types";

const MS_PER_HOUR = 3_600_000;

export function calcHoursFromAttendance(attendance: Attendance): number {
  if (!attendance.salida) return 0;
  const start = new Date(attendance.entrada.timestamp).getTime();
  const end = new Date(attendance.salida.timestamp).getTime();
  if (end <= start) return 0;
  return Math.round(((end - start) / MS_PER_HOUR) * 100) / 100;
}

export function pickBestRate(
  perfiles: PerfilTrabajo[],
  rates: PayrollRate[],
): { perfil: PerfilTrabajo; tarifaPorHora: number } | null {
  let best: { perfil: PerfilTrabajo; tarifaPorHora: number } | null = null;
  for (const perfil of perfiles) {
    const rate = rates.find((r) => r.perfil === perfil);
    if (!rate) continue;
    if (!best || rate.tarifaPorHora > best.tarifaPorHora) {
      best = { perfil, tarifaPorHora: rate.tarifaPorHora };
    }
  }
  return best;
}

export function assignRefrigerios(
  horas: number,
  perfil: PerfilTrabajo,
  rates: PayrollRate[],
): RefrigerioAsignado[] {
  const rate = rates.find((r) => r.perfil === perfil);
  const almuerzo = rate?.costoRefrigerioAlmuerzo ?? 12_000;
  const cena = rate?.costoRefrigerioCena ?? 10_000;
  const snack = rate?.costoRefrigerioSnack ?? 5_000;

  const items: RefrigerioAsignado[] = [];
  if (horas >= 4) items.push({ tipo: "almuerzo", costo: almuerzo });
  if (horas >= 8) items.push({ tipo: "cena", costo: cena });
  if (horas >= 6 && horas < 8) items.push({ tipo: "snack", costo: snack });
  return items;
}

export function buildPayrollEntry(
  attendance: Attendance,
  worker: Worker,
  rates: PayrollRate[],
  meta?: { calculadoPor?: string; calculadoPorNombre?: string },
): Omit<PayrollEntry, "id"> | null {
  if (attendance.estado !== "cerrado" || !attendance.salida) return null;

  const horasTrabajadas = calcHoursFromAttendance(attendance);
  if (horasTrabajadas <= 0) return null;

  const best = pickBestRate(worker.perfiles, rates);
  if (!best) return null;

  const refrigerios = assignRefrigerios(horasTrabajadas, best.perfil, rates);
  const subtotalHoras = Math.round(horasTrabajadas * best.tarifaPorHora);
  const totalRefrigerios = refrigerios.reduce((sum, r) => sum + r.costo, 0);

  return {
    workerId: worker.id,
    workerNombre: worker.nombre,
    eventId: attendance.eventId,
    eventNombre: attendance.eventNombre,
    siteId: attendance.siteId,
    siteNombre: attendance.siteNombre,
    attendanceId: attendance.id,
    perfilAplicado: best.perfil,
    periodoInicio: attendance.entrada.timestamp,
    periodoFin: attendance.salida.timestamp,
    horasTrabajadas,
    tarifaAplicada: best.tarifaPorHora,
    subtotalHoras,
    refrigerios,
    totalRefrigerios,
    total: subtotalHoras + totalRefrigerios,
    estado: "pendiente",
    calculadoEn: new Date().toISOString(),
    calculadoPor: meta?.calculadoPor,
    calculadoPorNombre: meta?.calculadoPorNombre,
  };
}

export function formatCurrencyCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function exportPayrollCsv(entries: PayrollEntry[]): string {
  const header = [
    "Trabajador",
    "Evento",
    "Sitio",
    "Perfil",
    "Horas",
    "Tarifa/h",
    "Subtotal horas",
    "Refrigerios",
    "Total refrigerios",
    "Total",
    "Estado",
    "Periodo inicio",
    "Periodo fin",
  ].join(",");

  const rows = entries.map((e) => {
    const refrigerios = e.refrigerios.map((r) => `${r.tipo}:${r.costo}`).join("; ");
    return [
      csvEscape(e.workerNombre),
      csvEscape(e.eventNombre ?? e.eventId),
      csvEscape(e.siteNombre ?? e.siteId),
      csvEscape(e.perfilAplicado),
      e.horasTrabajadas.toFixed(2),
      e.tarifaAplicada,
      e.subtotalHoras,
      csvEscape(refrigerios),
      e.totalRefrigerios,
      e.total,
      e.estado,
      e.periodoInicio,
      e.periodoFin,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv"): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
