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

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  workerId?: string;
  nombre: string;
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

/** Solo administradores pueden subir y editar credenciales de APIs. */
export function puedeConfigurarIntegraciones(role: UserRole): boolean {
  return role === "super_admin" || role === "administrador";
}
