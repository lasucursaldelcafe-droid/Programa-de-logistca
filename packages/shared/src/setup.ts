import type { Evento, PayrollRate, QrCode, SetupConfig, SetupPaso, Sitio } from "./types";

export const WIZARD_STEPS: Array<{ id: SetupPaso; titulo: string; descripcion: string }> = [
  {
    id: "evento",
    titulo: "Evento",
    descripcion: "Nombre y fechas del evento operativo",
  },
  {
    id: "sitios",
    titulo: "Sitios",
    descripcion: "Ubicaciones con geocerca GPS",
  },
  {
    id: "tarifas",
    titulo: "Tarifas",
    descripcion: "Pago por hora y refrigerios",
  },
  {
    id: "qr",
    titulo: "Códigos QR",
    descripcion: "Activación de entrada por sitio",
  },
  {
    id: "resumen",
    titulo: "Resumen",
    descripcion: "Verificar y finalizar configuración",
  },
];

export const DEFAULT_PAYROLL_RATES: Omit<PayrollRate, "id">[] = [
  { perfil: "logistica", tarifaPorHora: 18_000, costoRefrigerioAlmuerzo: 12_000, costoRefrigerioSnack: 5_000 },
  { perfil: "montaje", tarifaPorHora: 20_000, costoRefrigerioAlmuerzo: 12_000, costoRefrigerioCena: 10_000 },
  { perfil: "recreacion", tarifaPorHora: 16_000, costoRefrigerioAlmuerzo: 11_000, costoRefrigerioSnack: 4_500 },
  { perfil: "anfitrion", tarifaPorHora: 17_000, costoRefrigerioAlmuerzo: 11_000 },
  { perfil: "chef", tarifaPorHora: 25_000, costoRefrigerioAlmuerzo: 15_000, costoRefrigerioCena: 12_000 },
  { perfil: "supervisor", tarifaPorHora: 28_000, costoRefrigerioAlmuerzo: 15_000, costoRefrigerioCena: 12_000 },
  { perfil: "seguridad", tarifaPorHora: 19_000, costoRefrigerioAlmuerzo: 12_000 },
];

export function setupStepIndex(paso: SetupPaso): number {
  return WIZARD_STEPS.findIndex((s) => s.id === paso);
}

export function nextSetupPaso(paso: SetupPaso): SetupPaso | null {
  const idx = setupStepIndex(paso);
  if (idx < 0 || idx >= WIZARD_STEPS.length - 1) return null;
  return WIZARD_STEPS[idx + 1]?.id ?? null;
}

export function validateEventoStep(data: {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}): string | null {
  if (!data.nombre.trim()) return "El nombre del evento es obligatorio";
  if (!data.fechaInicio || !data.fechaFin) return "Indica fecha de inicio y fin";
  if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
    return "La fecha de fin debe ser posterior al inicio";
  }
  return null;
}

export function validateSitioStep(data: {
  nombre: string;
  lat: string;
  lng: string;
  radioGeocerca: string;
}): string | null {
  if (!data.nombre.trim()) return "El nombre del sitio es obligatorio";
  const lat = Number(data.lat);
  const lng = Number(data.lng);
  const radio = Number(data.radioGeocerca);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) return "Latitud inválida";
  if (Number.isNaN(lng) || lng < -180 || lng > 180) return "Longitud inválida";
  if (Number.isNaN(radio) || radio < 10) return "El radio de geocerca debe ser ≥ 10 m";
  return null;
}

export function buildSetupSummary(data: {
  config: SetupConfig;
  evento: Evento | null;
  sites: Sitio[];
  rates: PayrollRate[];
  qrCodes: QrCode[];
}): Array<{ label: string; ok: boolean; detalle: string }> {
  const eventSites = data.evento
    ? data.sites.filter((s) => s.eventId === data.evento?.id)
    : [];
  const eventQr = data.evento
    ? data.qrCodes.filter((q) => q.eventId === data.evento?.id && q.activo)
    : [];

  return [
    {
      label: "Evento creado",
      ok: Boolean(data.evento),
      detalle: data.evento?.nombre ?? "Pendiente",
    },
    {
      label: "Sitios configurados",
      ok: eventSites.length > 0,
      detalle: `${eventSites.length} sitio(s)`,
    },
    {
      label: "Tarifas de nómina",
      ok: data.rates.length >= 5,
      detalle: `${data.rates.length} perfil(es)`,
    },
    {
      label: "Códigos QR activos",
      ok: eventQr.length >= eventSites.length && eventSites.length > 0,
      detalle: `${eventQr.length} QR para ${eventSites.length} sitio(s)`,
    },
    {
      label: "Configuración finalizada",
      ok: data.config.completado,
      detalle: data.config.completado ? "Completa" : "En progreso",
    },
  ];
}

export function needsSetupAttention(config: SetupConfig | null): boolean {
  return config !== null && !config.completado;
}
