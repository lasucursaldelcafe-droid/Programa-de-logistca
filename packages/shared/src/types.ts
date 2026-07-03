export type UserRole =
  | "super_admin"
  | "administrador"
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
}

export interface Invitation {
  id: string;
  token: string;
  workerId: string;
  workerNombre: string;
  email: string;
  estado: InvitationEstado;
  creadaEn: string;
  expiraEn: string;
  creadaPor: string;
  creadaPorNombre?: string;
  usadaEn?: string;
  uid?: string;
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
  certificaciones: string[];
  creadoEn: string;
}

export interface Evento {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  sitioIds: string[];
}

export interface Sitio {
  id: string;
  eventId: string;
  nombre: string;
  lat: number;
  lng: number;
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
}

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
  super_admin: "Super Admin",
  administrador: "Administrador",
  supervisor_sitio: "Supervisor de sitio",
  trabajador: "Trabajador",
};

export function puedeGestionarPersonal(role: UserRole): boolean {
  return role === "super_admin" || role === "administrador" || role === "supervisor_sitio";
}

export function puedeGestionarTurnos(role: UserRole): boolean {
  return role === "super_admin" || role === "administrador" || role === "supervisor_sitio";
}

export function puedeGestionarCuentas(role: UserRole): boolean {
  return role === "super_admin" || role === "administrador";
}

export function puedeGestionarQr(role: UserRole): boolean {
  return role === "super_admin" || role === "administrador" || role === "supervisor_sitio";
}

export function puedeVerMapaEnVivo(role: UserRole): boolean {
  return role === "super_admin" || role === "administrador" || role === "supervisor_sitio";
}

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
