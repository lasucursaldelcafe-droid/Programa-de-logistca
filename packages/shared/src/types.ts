export type UserRole =
  | "ceo"
  | "master_app"
  /** @deprecated Alias legacy — se normaliza a master_app al cargar sesión */
  | "super_admin"
  | "administrador"
  | "recursos_humanos"
  | "contador"
  | "supervisor_sitio"
  | "trabajador";

export type WorkerEstado =
  | "en_sitio"
  | "descanso"
  | "inactivo"
  | "sin_asignar";

export type PerfilTrabajo =
  | "logistica"
  | "recreacion"
  | "supervisor"
  | "montaje"
  | "chef"
  | "seguridad"
  | "anfitrion"
  | string;

export type ShiftEstado =
  | "pendiente"
  | "confirmado"
  | "rechazado"
  | "completado";

export type InvitationEstado = "pendiente" | "usada" | "revocada";

export type QrModo = "unico" | "por_jornada" | "rotativo";

export type AttendanceEstado =
  | "activo"
  | "fuera_geocerca"
  | "revision_manual"
  | "cerrado";

export interface GeoRegistro {
  timestamp: string;
  lat: number;
  lng: number;
  dentroGeocerca: boolean;
}

export interface QrCode {
  id: string;
  eventId: string;
  eventNombre?: string;
  siteId: string;
  siteNombre?: string;
  token: string;
  secret?: string;
  modo: QrModo;
  intervaloRotacionSegundos?: number;
  ventanaInicio: string;
  ventanaFin: string;
  radioGeocerca: number;
  descripcionDatos: string;
  activo: boolean;
  creadoEn: string;
  creadoPor?: string;
}

export interface Attendance {
  id: string;
  workerId: string;
  workerNombre?: string;
  shiftId: string;
  siteId: string;
  siteNombre?: string;
  eventId: string;
  eventNombre?: string;
  qrId: string;
  estado: AttendanceEstado;
  entrada: GeoRegistro;
  salida?: GeoRegistro;
  ubicacionActual?: GeoCoord;
  alertasGeocerca: string[];
  creadoEn: string;
}

export interface GeoCoord {
  lat: number;
  lng: number;
}

export interface Consent {
  id: string;
  workerId: string;
  qrId: string;
  eventId: string;
  timestamp: string;
  aceptado: boolean;
  versionDescripcionDatos: string;
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  workerId?: string;
  nombre: string;
  telefono?: string;
  perfilCompleto?: boolean;
  /** Cuenta activa; el administrador puede inhabilitar acceso. */
  habilitado?: boolean;
  /** Rol personalizado creado por super admin (permisos granulares). */
  customRoleId?: string;
}

export interface Invitation {
  id: string;
  token: string;
  workerId: string;
  workerNombre: string;
  email: string;
  /** Código de un solo uso enviado por correo; obligatorio para activar. */
  codigoAcceso: string;
  estado: InvitationEstado;
  creadaEn: string;
  expiraEn: string;
  creadaPor: string;
  creadaPorNombre?: string;
  /** Rol de acceso asignado por el administrador al invitar. */
  role: "trabajador" | "supervisor_sitio";
  /** Rol personalizado opcional (permisos definidos por super admin). */
  customRoleId?: string;
  usadaEn?: string;
  uid?: string;
  /** ISO timestamp cuando Cloud Functions envió el correo de invitación. */
  emailEnviadoEn?: string;
  /** Error al enviar correo automático (SMTP no configurado, etc.). */
  emailError?: string;
}

export interface Worker {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  foto?: string;
  perfiles: PerfilTrabajo[];
  experienciaAnios: number;
  eventosTrabajados: number;
  rating: number;
  estado: WorkerEstado;
  cuentaCreada: boolean;
  /** Rol en la plataforma; lo asigna el administrador al registrar. */
  rolPlataforma: "trabajador" | "supervisor_sitio";
  /** Rol personalizado (permisos granulares) asignado al crear cuenta. */
  customRoleId?: string;
  /** Si false, no puede iniciar sesión (admin puede inhabilitar). */
  habilitado?: boolean;
  certificaciones: string[];
  creadoEn: string;
}

export interface Evento {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  sitioIds: string[];
  /** Temática y lineamientos laborales del evento (visible para trabajadores). */
  temaLaboral?: string;
  /** Reglas de supervisión: funciones, horarios, conducta en sitio. */
  reglasOperativas?: string;
  /** Tiempo mínimo de estadía en sitio (minutos) antes de marcar salida válida. */
  tiempoMinimoEstadiaMinutos?: number;
  /** Activa monitoreo GPS y alertas de geocerca para este evento. */
  supervisionActiva?: boolean;
}

export interface Sitio {
  id: string;
  eventId: string;
  nombre: string;
  /** Dirección legible del punto de trabajo (geocodificada o ingresada manualmente). */
  direccion?: string;
  lat: number;
  lng: number;
  /** Radio en metros del área de trabajo (geocerca GPS). */
  radioGeocerca: number;
}

export interface Turno {
  id: string;
  workerId: string;
  workerNombre?: string;
  siteId: string;
  siteNombre?: string;
  eventId: string;
  eventNombre?: string;
  inicio: string;
  fin: string;
  estado: ShiftEstado;
  /** ISO timestamp cuando se envió correo automático de turno asignado. */
  emailTurnoEnviadoEn?: string;
}

export type NotificationTipo =
  | "turno_asignado"
  | "turno_respuesta"
  | "entrada"
  | "salida"
  | "llegada_sitio"
  | "geocerca_alerta"
  | "reentrada_geocerca"
  | "reporte_trabajador"
  | "videollamada_iniciada"
  | "emergencia"
  | "break_recordatorio"
  | "alta_qr"
  | "sistema";

export type BreakTipo = "almuerzo" | "break" | "receso";

export type ReporteTipo =
  | "retraso"
  | "incidente"
  | "no_puedo_entrar"
  | "equipo"
  | "otro";

export type ReporteEstado = "abierto" | "en_revision" | "resuelto";

export interface Reporte {
  id: string;
  workerId: string;
  workerNombre: string;
  shiftId?: string;
  siteId?: string;
  siteNombre?: string;
  eventId?: string;
  tipo: ReporteTipo;
  mensaje: string;
  estado: ReporteEstado;
  creadoEn: string;
  resueltoEn?: string;
  resueltoPor?: string;
  resueltoPorNombre?: string;
}

export interface AppNotification {
  id: string;
  tipo: NotificationTipo;
  titulo: string;
  mensaje: string;
  timestamp: string;
  urgente: boolean;
  destinatarios: string[];
  shiftId?: string;
  eventId?: string;
  siteId?: string;
  attendanceId?: string;
  actorUid?: string;
  actorNombre?: string;
  leidaPor: string[];
  accionTurno?: boolean;
  /** Rellenado por Cloud Function al enviar FCM */
  pushEnviadoEn?: string;
  pushTokensEnviados?: number;
  pushError?: string;
}

export interface BreakSchedule {
  id: string;
  shiftId: string;
  workerId: string;
  workerNombre?: string;
  tipo: BreakTipo;
  inicio: string;
  fin: string;
  notificado: boolean;
}

/** Mensaje del chat interno del equipo (Firestore). */
export interface ChatMessage {
  id: string;
  channelId: string;
  channelLabel: string;
  text: string;
  senderUid: string;
  senderNombre: string;
  senderRole: UserRole | string;
  eventId?: string | null;
  createdAt: string;
}

export const REPORTE_TIPO_LABEL: Record<ReporteTipo, string> = {
  retraso: "Retraso / llegada tarde",
  incidente: "Incidente en sitio",
  no_puedo_entrar: "No puedo marcar entrada",
  equipo: "Problema con equipo / QR",
  otro: "Otro",
};

export const REPORTE_ESTADO_LABEL: Record<ReporteEstado, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  resuelto: "Resuelto",
};

export const PERFILES_LABEL: Record<string, string> = {
  logistica: "Logística",
  recreacion: "Recreación",
  supervisor: "Supervisor",
  montaje: "Montaje",
  chef: "Chef",
  seguridad: "Seguridad",
  anfitrion: "Anfitrión/a",
};

export const ESTADO_LABEL: Record<WorkerEstado, string> = {
  en_sitio: "En sitio",
  descanso: "En descanso",
  inactivo: "Inactivo",
  sin_asignar: "Sin asignar",
};

export const SHIFT_LABEL: Record<ShiftEstado, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
  completado: "Completado",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  ceo: "CEO — Dirección general",
  master_app: "Master App — Plataforma",
  super_admin: "Master App — Plataforma",
  administrador: "Administrador de operaciones",
  recursos_humanos: "Recursos Humanos",
  contador: "Contabilidad y finanzas",
  supervisor_sitio: "Supervisor de campo",
  trabajador: "Empleado de campo",
};

import {
  puedeGestionarPersonal,
  puedeGestionarTurnos,
  puedeConfigurarIntegraciones,
  puedeGestionarCuentas,
  puedeGestionarQr,
  puedeVerMapaEnVivo,
  puedeEnviarEmergencia,
  puedeGestionarNomina,
  puedeVerNomina,
  puedeGestionarConfiguracion,
  puedeVerReportesTrabajadores,
  puedeUsarComunicacion,
  puedeVerInformesEvento,
  puedeGestionarRolesCustom,
  puedeGestionarClientes,
  puedeGestionarFacturacion,
  puedeVerInventario,
  puedeVerIntegraciones,
} from "./permissions";

export {
  puedeGestionarPersonal,
  puedeGestionarTurnos,
  puedeConfigurarIntegraciones,
  puedeGestionarCuentas,
  puedeGestionarQr,
  puedeVerMapaEnVivo,
  puedeEnviarEmergencia,
  puedeGestionarNomina,
  puedeVerNomina,
  puedeGestionarConfiguracion,
  puedeVerReportesTrabajadores,
  puedeUsarComunicacion,
  puedeVerInformesEvento,
  puedeGestionarRolesCustom,
  puedeGestionarClientes,
  puedeGestionarFacturacion,
  puedeVerInventario,
  puedeVerIntegraciones,
};

/** Admin/supervisor puede enviar notificaciones manuales y push. */
export function puedeEnviarNotificacion(role: UserRole): boolean {
  return puedeEnviarEmergencia(role);
}

export const NOTIFICATION_TIPO_LABEL: Record<NotificationTipo, string> = {
  turno_asignado: "Turno asignado",
  turno_respuesta: "Respuesta de turno",
  entrada: "Entrada",
  salida: "Salida",
  llegada_sitio: "Llegada al sitio",
  geocerca_alerta: "Alerta geocerca",
  reentrada_geocerca: "Re-entrada al sitio",
  reporte_trabajador: "Reporte de trabajador",
  videollamada_iniciada: "Videollamada",
  emergencia: "Emergencia",
  break_recordatorio: "Recordatorio break",
  alta_qr: "Alta por QR",
  sistema: "Sistema",
};

export const BREAK_TIPO_LABEL: Record<BreakTipo, string> = {
  almuerzo: "Almuerzo",
  break: "Break",
  receso: "Receso",
};

export const INVITATION_LABEL: Record<InvitationEstado, string> = {
  pendiente: "Pendiente",
  usada: "Usada",
  revocada: "Revocada",
};

export const QR_MODO_LABEL: Record<QrModo, string> = {
  unico: "Un solo uso",
  por_jornada: "Por jornada",
  rotativo: "Rotativo",
};

export const ATTENDANCE_LABEL: Record<AttendanceEstado, string> = {
  activo: "En jornada",
  fuera_geocerca: "Fuera de geocerca",
  revision_manual: "Revisión manual",
  cerrado: "Cerrado",
};

export type PayrollEstado = "pendiente" | "pagado";

export type RefrigerioTipo = "desayuno" | "almuerzo" | "cena" | "snack";

export interface RefrigerioAsignado {
  tipo: RefrigerioTipo;
  costo: number;
}

export interface PayrollRate {
  id: string;
  perfil: PerfilTrabajo;
  tarifaPorHora: number;
  costoRefrigerioAlmuerzo?: number;
  costoRefrigerioCena?: number;
  costoRefrigerioSnack?: number;
}

export interface PayrollEntry {
  id: string;
  workerId: string;
  workerNombre: string;
  eventId: string;
  eventNombre?: string;
  siteId: string;
  siteNombre?: string;
  attendanceId: string;
  perfilAplicado: PerfilTrabajo;
  periodoInicio: string;
  periodoFin: string;
  horasTrabajadas: number;
  tarifaAplicada: number;
  subtotalHoras: number;
  refrigerios: RefrigerioAsignado[];
  totalRefrigerios: number;
  total: number;
  estado: PayrollEstado;
  calculadoEn: string;
  calculadoPor?: string;
  calculadoPorNombre?: string;
  pagadoEn?: string;
}

export type PayrollAuditAccion = "calculado" | "marcado_pagado" | "exportado";

export interface PayrollAuditEntry {
  id: string;
  payrollId: string;
  accion: PayrollAuditAccion;
  actorUid: string;
  actorNombre: string;
  timestamp: string;
  detalle?: string;
}

export const PAYROLL_ESTADO_LABEL: Record<PayrollEstado, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
};

export const REFRIGERIO_TIPO_LABEL: Record<RefrigerioTipo, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  snack: "Snack",
};

export type SetupPaso =
  | "evento"
  | "sitios"
  | "tarifas"
  | "qr"
  | "operaciones"
  | "resumen";

export const SETUP_PASOS_ORDEN: SetupPaso[] = [
  "evento",
  "sitios",
  "tarifas",
  "qr",
  "operaciones",
  "resumen",
];

export interface SetupConfig {
  id: string;
  completado: boolean;
  pasoActual: SetupPaso;
  pasosCompletados: SetupPaso[];
  eventoId?: string;
  actualizadoEn: string;
  actualizadoPor: string;
  actualizadoPorNombre?: string;
}

export type ChatConversationTipo = "evento" | "sitio" | "directo";

export interface ChatConversation {
  id: string;
  eventId: string;
  eventNombre?: string;
  siteId?: string;
  siteNombre?: string;
  tipo: ChatConversationTipo;
  titulo: string;
  participantIds: string[];
  lastMessageAt: string;
  lastMessagePreview?: string;
  creadoEn: string;
  creadoPor: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  senderNombre: string;
  texto: string;
  creadoEn: string;
  leidoPor: string[];
}

export interface VideoRoom {
  id: string;
  conversationId: string;
  eventId: string;
  eventNombre?: string;
  roomName: string;
  creadoPor: string;
  creadoPorNombre: string;
  creadoEn: string;
  activo: boolean;
}

export function buildJitsiRoomName(eventId: string, conversationId: string): string {
  const slug = `${eventId}-${conversationId}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48);
  return `SPE-${slug}`;
}
