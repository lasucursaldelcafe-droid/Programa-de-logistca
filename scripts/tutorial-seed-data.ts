/**
 * Estado demo enriquecido para capturas del tutorial SPE.
 * Se inyecta en localStorage antes de cargar la app (modo demo).
 */
import { DEFAULT_PAYROLL_RATES } from "@spe/shared";
import type { DemoPersistedState } from "../apps/admin/src/demo/persist";

const now = Date.now();
const iso = (offsetMs = 0) => new Date(now + offsetMs).toISOString();

const EVENT_ID = "ev-tutorial";
const SITE_ENTRADA = "site-entrada";
const SITE_ESCENARIO = "site-escenario";
const SITE_BACKSTAGE = "site-backstage";

const WORKER_MARIA = "w-maria";
const WORKER_CARLOS = "w-carlos";
const WORKER_ANA = "w-ana";
const WORKER_SUP = "w-supervisor";

const QR_ENTRADA = "qr-entrada";
const SHIFT_MARIA = "shift-maria";
const ATT_MARIA = "att-maria";

export const TUTORIAL_INVITATION_TOKEN = "inv-tutorial-demo";
export const TUTORIAL_INVITATION_CODE = "482916";

export function buildTutorialSeedState(): DemoPersistedState {
  const evento = {
    id: EVENT_ID,
    nombre: "Festival Logística SPE 2026",
    fechaInicio: iso(-86400000),
    fechaFin: iso(86400000 * 2),
    sitioIds: [SITE_ENTRADA, SITE_ESCENARIO, SITE_BACKSTAGE],
  };

  const sites = [
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
    {
      id: SITE_BACKSTAGE,
      eventId: EVENT_ID,
      nombre: "Backstage / logística",
      lat: 4.6525,
      lng: -74.0845,
      radioGeocerca: 60,
    },
  ];

  const workers = [
    {
      id: WORKER_MARIA,
      nombre: "María López",
      documento: "1020304050",
      telefono: "3001234567",
      email: "maria.trabajadora@eventos.test",
      perfiles: ["logistica" as const],
      experienciaAnios: 2,
      eventosTrabajados: 8,
      rating: 4.7,
      estado: "en_sitio" as const,
      cuentaCreada: true,
      rolPlataforma: "trabajador" as const,
      habilitado: true,
      certificaciones: ["Manipulación de alimentos"],
      creadoEn: iso(-604800000),
    },
    {
      id: WORKER_CARLOS,
      nombre: "Carlos Ruiz",
      documento: "1030405060",
      telefono: "3019876543",
      email: "carlos.ruiz@eventos.test",
      perfiles: ["montaje" as const, "logistica" as const],
      experienciaAnios: 1,
      eventosTrabajados: 3,
      rating: 4.2,
      estado: "sin_asignar" as const,
      cuentaCreada: false,
      rolPlataforma: "trabajador" as const,
      habilitado: true,
      certificaciones: [],
      creadoEn: iso(-259200000),
    },
    {
      id: WORKER_ANA,
      nombre: "Ana Torres",
      documento: "1040506070",
      telefono: "3025551212",
      email: "ana.torres@eventos.test",
      perfiles: ["recreacion" as const],
      experienciaAnios: 3,
      eventosTrabajados: 12,
      rating: 4.9,
      estado: "descanso" as const,
      cuentaCreada: true,
      rolPlataforma: "trabajador" as const,
      habilitado: true,
      certificaciones: ["Primeros auxilios"],
      creadoEn: iso(-432000000),
    },
    {
      id: WORKER_SUP,
      nombre: "Pedro Gómez",
      documento: "1050607080",
      telefono: "3104448899",
      email: "supervisor.sitio@eventos.test",
      perfiles: ["supervisor" as const],
      experienciaAnios: 5,
      eventosTrabajados: 24,
      rating: 4.8,
      estado: "en_sitio" as const,
      cuentaCreada: true,
      rolPlataforma: "supervisor_sitio" as const,
      habilitado: true,
      certificaciones: ["Liderazgo operativo"],
      creadoEn: iso(-864000000),
    },
  ];

  const shifts = [
    {
      id: SHIFT_MARIA,
      workerId: WORKER_MARIA,
      workerNombre: "María López",
      siteId: SITE_ENTRADA,
      siteNombre: "Entrada principal",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      inicio: iso(-3600000),
      fin: iso(8 * 3600000),
      estado: "confirmado" as const,
    },
    {
      id: "shift-carlos",
      workerId: WORKER_CARLOS,
      workerNombre: "Carlos Ruiz",
      siteId: SITE_BACKSTAGE,
      siteNombre: "Backstage / logística",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      inicio: iso(3600000),
      fin: iso(10 * 3600000),
      estado: "pendiente" as const,
    },
    {
      id: "shift-ana",
      workerId: WORKER_ANA,
      workerNombre: "Ana Torres",
      siteId: SITE_ESCENARIO,
      siteNombre: "Escenario central",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      inicio: iso(-7200000),
      fin: iso(6 * 3600000),
      estado: "confirmado" as const,
    },
  ];

  const qrCodes = [
    {
      id: QR_ENTRADA,
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      siteId: SITE_ENTRADA,
      siteNombre: "Entrada principal",
      token: "tok-entrada-demo",
      modo: "por_jornada" as const,
      ventanaInicio: evento.fechaInicio,
      ventanaFin: evento.fechaFin,
      radioGeocerca: 80,
      descripcionDatos:
        "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar presencia en el sitio asignado.",
      activo: true,
      creadoEn: iso(-86400000),
      creadoPor: "demo-admin",
    },
    {
      id: "qr-escenario",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      siteId: SITE_ESCENARIO,
      siteNombre: "Escenario central",
      token: "tok-escenario-demo",
      modo: "por_jornada" as const,
      ventanaInicio: evento.fechaInicio,
      ventanaFin: evento.fechaFin,
      radioGeocerca: 100,
      descripcionDatos:
        "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar presencia en el sitio asignado.",
      activo: true,
      creadoEn: iso(-86400000),
      creadoPor: "demo-admin",
    },
  ];

  const attendances = [
    {
      id: ATT_MARIA,
      workerId: WORKER_MARIA,
      workerNombre: "María López",
      shiftId: SHIFT_MARIA,
      siteId: SITE_ENTRADA,
      siteNombre: "Entrada principal",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      qrId: QR_ENTRADA,
      estado: "cerrado" as const,
      entrada: {
        timestamp: iso(-8 * 3600000),
        lat: 4.6533,
        lng: -74.0836,
        dentroGeocerca: true,
      },
      salida: {
        timestamp: iso(-3600000),
        lat: 4.6533,
        lng: -74.0836,
        dentroGeocerca: true,
      },
      ubicacionActual: { lat: 4.6534, lng: -74.0835 },
      alertasGeocerca: [],
      creadoEn: iso(-8 * 3600000),
    },
    {
      id: "att-ana",
      workerId: WORKER_ANA,
      workerNombre: "Ana Torres",
      shiftId: "shift-ana",
      siteId: SITE_ESCENARIO,
      siteNombre: "Escenario central",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      qrId: "qr-escenario",
      estado: "fuera_geocerca" as const,
      entrada: {
        timestamp: iso(-900000),
        lat: 4.656,
        lng: -74.08,
        dentroGeocerca: false,
      },
      ubicacionActual: { lat: 4.6562, lng: -74.0798 },
      alertasGeocerca: [iso(-300000)],
      creadoEn: iso(-900000),
    },
  ];

  const reportes = [
    {
      id: "rep-1",
      workerId: WORKER_ANA,
      workerNombre: "Ana Torres",
      shiftId: "shift-ana",
      siteId: SITE_ESCENARIO,
      siteNombre: "Escenario central",
      eventId: EVENT_ID,
      tipo: "retraso" as const,
      mensaje: "Tráfico en la vía principal — llegaré 15 minutos tarde al sitio.",
      estado: "abierto" as const,
      creadoEn: iso(-600000),
    },
    {
      id: "rep-2",
      workerId: WORKER_MARIA,
      workerNombre: "María López",
      siteId: SITE_ENTRADA,
      siteNombre: "Entrada principal",
      eventId: EVENT_ID,
      tipo: "equipo" as const,
      mensaje: "El lector QR de la entrada no reconoce bien el código impreso.",
      estado: "en_revision" as const,
      creadoEn: iso(-1200000),
    },
  ];

  const payrollRates = DEFAULT_PAYROLL_RATES.map((r) => ({
    ...r,
    id: `rate-${r.perfil}`,
  }));

  const payrollEntries = [
    {
      id: "pay-1",
      workerId: WORKER_ANA,
      workerNombre: "Ana Torres",
      eventId: EVENT_ID,
      eventNombre: evento.nombre,
      siteId: SITE_ESCENARIO,
      siteNombre: "Escenario central",
      attendanceId: "att-cerrada-1",
      perfilAplicado: "recreacion" as const,
      periodoInicio: iso(-86400000 * 2),
      periodoFin: iso(-86400000),
      horasTrabajadas: 8,
      tarifaAplicada: 16000,
      subtotalHoras: 128000,
      refrigerios: [{ tipo: "almuerzo" as const, costo: 11000 }],
      totalRefrigerios: 11000,
      total: 139000,
      estado: "pendiente" as const,
      calculadoEn: iso(-43200000),
      calculadoPor: "demo-admin",
      calculadoPorNombre: "Administrador",
    },
  ];

  const invitations = [
    {
      id: "inv-1",
      token: TUTORIAL_INVITATION_TOKEN,
      workerId: WORKER_CARLOS,
      workerNombre: "Carlos Ruiz",
      email: "carlos.ruiz@eventos.test",
      codigoAcceso: TUTORIAL_INVITATION_CODE,
      estado: "pendiente" as const,
      creadaEn: iso(-3600000),
      creadaPor: "demo-admin",
      creadaPorNombre: "Administrador",
      role: "trabajador" as const,
    },
  ];

  const notifications = [
    {
      id: "notif-1",
      tipo: "entrada" as const,
      titulo: "Entrada registrada",
      mensaje: "María López marcó entrada en Entrada principal.",
      timestamp: iso(-1800000),
      urgente: false,
      destinatarios: ["demo-admin"],
      eventId: EVENT_ID,
      siteId: SITE_ENTRADA,
      attendanceId: ATT_MARIA,
      leidaPor: [],
    },
    {
      id: "notif-2",
      tipo: "geocerca_alerta" as const,
      titulo: "Alerta de geocerca",
      mensaje: "Ana Torres está fuera del radio del sitio Escenario central.",
      timestamp: iso(-300000),
      urgente: true,
      destinatarios: ["demo-admin"],
      eventId: EVENT_ID,
      siteId: SITE_ESCENARIO,
      leidaPor: [],
    },
    {
      id: "notif-3",
      tipo: "turno_asignado" as const,
      titulo: "Turno pendiente",
      mensaje: "Carlos Ruiz tiene un turno por confirmar en Backstage.",
      timestamp: iso(-120000),
      urgente: false,
      destinatarios: ["demo-admin"],
      shiftId: "shift-carlos",
      accionTurno: true,
      leidaPor: [],
    },
  ];

  const clientes = [
    {
      id: "cli-1",
      nombre: "Eventos Andinos S.A.S.",
      nit: "900123456-1",
      email: "contacto@eventosandinos.co",
      telefono: "6015550100",
      ciudad: "Bogotá",
      carteraPendiente: 2450000,
      creadoEn: iso(-2592000000),
    },
    {
      id: "cli-2",
      nombre: "Producciones Live",
      nit: "800987654-3",
      email: "facturacion@live.co",
      telefono: "6045550200",
      ciudad: "Medellín",
      carteraPendiente: 0,
      creadoEn: iso(-1296000000),
    },
  ];

  const productos = [
    {
      id: "prod-1",
      codigo: "EQ-001",
      nombre: "Chaleco reflectivo",
      categoria: "EPP",
      precio: 45000,
      stock: 120,
      unidad: "und",
    },
    {
      id: "prod-2",
      codigo: "EQ-014",
      nombre: "Radio handheld",
      categoria: "Comunicaciones",
      precio: 320000,
      stock: 8,
      unidad: "und",
    },
  ];

  const facturas = [
    {
      id: "fac-1",
      numero: "FV-2026-0042",
      clienteId: "cli-1",
      clienteNombre: "Eventos Andinos S.A.S.",
      total: 4850000,
      estado: "emitida" as const,
      emitidaEn: iso(-604800000),
      venceEn: iso(604800000),
    },
    {
      id: "fac-2",
      numero: "FV-2026-0038",
      clienteId: "cli-2",
      clienteNombre: "Producciones Live",
      total: 1200000,
      estado: "pagada" as const,
      emitidaEn: iso(-1209600000),
      venceEn: iso(-604800000),
    },
  ];

  const posiciones = attendances
    .filter((a) => a.ubicacionActual)
    .map((a) => ({
      id: `pos-${a.id}`,
      workerId: a.workerId,
      workerNombre: a.workerNombre ?? "",
      siteId: a.siteId,
      lat: a.ubicacionActual!.lat,
      lng: a.ubicacionActual!.lng,
      actualizadoEn: iso(),
    }));

  const platformAccounts = [
    {
      email: "master@eventos.test",
      password: "Master123!",
      user: {
        uid: "demo-master",
        email: "master@eventos.test",
        nombre: "Master Plataforma",
        role: "super_admin" as const,
        perfilCompleto: true,
      },
    },
    {
      email: "admin@eventos.test",
      password: "Admin123!",
      user: {
        uid: "demo-admin",
        email: "admin@eventos.test",
        nombre: "Administrador",
        role: "administrador" as const,
        perfilCompleto: true,
      },
    },
  ];

  const workerAccounts = [
    {
      email: "maria.trabajadora@eventos.test",
      password: "Trabajador123!",
      user: {
        uid: "demo-worker-maria",
        email: "maria.trabajadora@eventos.test",
        nombre: "María López",
        role: "trabajador" as const,
        workerId: WORKER_MARIA,
        perfilCompleto: true,
        habilitado: true,
      },
    },
    {
      email: "carlos.ruiz@eventos.test",
      password: "Trabajador123!",
      user: {
        uid: "demo-worker-carlos-pending",
        email: "carlos.ruiz@eventos.test",
        nombre: "Carlos Ruiz",
        role: "trabajador" as const,
        workerId: WORKER_CARLOS,
        perfilCompleto: false,
        habilitado: true,
      },
    },
    {
      email: "supervisor.sitio@eventos.test",
      password: "Supervisor123!",
      user: {
        uid: "demo-supervisor",
        email: "supervisor.sitio@eventos.test",
        nombre: "Pedro Gómez",
        role: "supervisor_sitio" as const,
        workerId: WORKER_SUP,
        perfilCompleto: true,
        habilitado: true,
      },
    },
  ];

  return {
    workers,
    shifts,
    events: [evento],
    sites,
    invitations,
    qrCodes,
    attendances,
    notifications,
    breaks: [],
    payrollRates,
    payrollEntries,
    payrollAudit: [
      {
        id: "audit-1",
        payrollId: "pay-1",
        accion: "calculado" as const,
        actorUid: "demo-admin",
        actorNombre: "Administrador",
        timestamp: iso(-43200000),
        detalle: "Cálculo automático jornada cerrada",
      },
    ],
    setupConfig: {
      id: "default",
      completado: true,
      pasoActual: "resumen" as const,
      pasosCompletados: ["evento", "sitios", "tarifas", "qr", "resumen"],
      eventoId: EVENT_ID,
      actualizadoEn: iso(),
      actualizadoPor: "demo-admin",
      actualizadoPorNombre: "Administrador",
    },
    reportes,
    clientes,
    productos,
    facturas,
    posiciones,
    credencialesIntegraciones: {
      siigo: { id: "siigo", apiKey: "demo-key-tutorial" },
      whatsapp: { id: "whatsapp" },
      facebook: { id: "facebook" },
      instagram: { id: "instagram" },
      webhook: { id: "webhook" },
      web_form: { id: "web_form" },
    },
    accounts: [...platformAccounts, ...workerAccounts],
    changeLog: [],
  };
}

export const TUTORIAL_QR_PAYLOAD = `spe:qr:${QR_ENTRADA}:tok-entrada-demo`;

export const TUTORIAL_WORKER_EMAIL = "maria.trabajadora@eventos.test";
export const TUTORIAL_WORKER_PASSWORD = "Trabajador123!";
