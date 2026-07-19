import type { Attendance, Evento, Sitio, Turno } from "@spe/shared";

/** Datos de ejemplo para que /mapa muestre sitios y personal activo en modo demo. */
const EVENT_ID = "ev-demo-mapa";
const SITE_ENTRADA = "site-demo-entrada";
const SITE_ESCENARIO = "site-demo-escenario";

export const DEMO_MAP_EVENT: Evento = {
  id: EVENT_ID,
  nombre: "Evento demo SPE",
  fechaInicio: new Date(Date.now() - 86400000).toISOString(),
  fechaFin: new Date(Date.now() + 86400000 * 2).toISOString(),
  sitioIds: [SITE_ENTRADA, SITE_ESCENARIO],
  temaLaboral:
    "Atención al público, montaje de áreas y apoyo logístico. Uniforme visible y actitud profesional.",
  reglasOperativas:
    "Marcar entrada con QR en el sitio asignado.\nPermanecer dentro del radio GPS durante la jornada.\nReportar incidentes desde la app.",
  tiempoMinimoEstadiaMinutos: 30,
  supervisionActiva: true,
};

export const DEMO_MAP_SITES: Sitio[] = [
  {
    id: SITE_ENTRADA,
    eventId: EVENT_ID,
    nombre: "Entrada principal",
    lat: 4.6533,
    lng: -74.0836,
    radioGeocerca: 80,
  },
  {
    id: SITE_ESCENARIO,
    eventId: EVENT_ID,
    nombre: "Escenario central",
    lat: 4.6541,
    lng: -74.0828,
    radioGeocerca: 100,
  },
];

export const DEMO_MAP_SHIFTS: Turno[] = [
  {
    id: "shift-demo-maria",
    workerId: "w-demo-maria",
    workerNombre: "María López (demo)",
    siteId: SITE_ENTRADA,
    siteNombre: "Entrada principal",
    eventId: EVENT_ID,
    eventNombre: DEMO_MAP_EVENT.nombre,
    inicio: new Date(Date.now() - 3600000).toISOString(),
    fin: new Date(Date.now() + 8 * 3600000).toISOString(),
    estado: "confirmado",
  },
  {
    id: "shift-demo-ana",
    workerId: "w-demo-ana",
    workerNombre: "Ana Torres (demo)",
    siteId: SITE_ESCENARIO,
    siteNombre: "Escenario central",
    eventId: EVENT_ID,
    eventNombre: DEMO_MAP_EVENT.nombre,
    inicio: new Date(Date.now() - 7200000).toISOString(),
    fin: new Date(Date.now() + 6 * 3600000).toISOString(),
    estado: "confirmado",
  },
];

export const DEMO_MAP_ATTENDANCES: Attendance[] = [
  {
    id: "att-demo-maria",
    workerId: "w-demo-maria",
    workerNombre: "María López (demo)",
    shiftId: "shift-demo-maria",
    siteId: SITE_ENTRADA,
    siteNombre: "Entrada principal",
    eventId: EVENT_ID,
    eventNombre: DEMO_MAP_EVENT.nombre,
    qrId: "qr-demo-entrada",
    estado: "activo",
    entrada: {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      lat: 4.6533,
      lng: -74.0836,
      dentroGeocerca: true,
    },
    ubicacionActual: { lat: 4.6534, lng: -74.0835 },
    alertasGeocerca: [],
    creadoEn: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "att-demo-ana",
    workerId: "w-demo-ana",
    workerNombre: "Ana Torres (demo)",
    shiftId: "shift-demo-ana",
    siteId: SITE_ESCENARIO,
    siteNombre: "Escenario central",
    eventId: EVENT_ID,
    eventNombre: DEMO_MAP_EVENT.nombre,
    qrId: "qr-demo-escenario",
    estado: "fuera_geocerca",
    entrada: {
      timestamp: new Date(Date.now() - 900000).toISOString(),
      lat: 4.656,
      lng: -74.08,
      dentroGeocerca: false,
    },
    ubicacionActual: { lat: 4.6562, lng: -74.0798 },
    alertasGeocerca: [new Date(Date.now() - 300000).toISOString()],
    creadoEn: new Date(Date.now() - 900000).toISOString(),
  },
];

export function hasDemoMapData(sites: Sitio[]): boolean {
  return sites.some((s) => s.id.startsWith("site-demo-"));
}
