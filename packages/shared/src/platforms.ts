import type { UserRole } from "./types";

export type AppPlatform = "master" | "admin" | "worker";

export const PLATFORM_LABEL: Record<AppPlatform, string> = {
  master: "Master Console",
  admin: "Admin Console",
  worker: "App Trabajador",
};

export function puedeAccederPlataforma(role: UserRole, platform: AppPlatform): boolean {
  switch (platform) {
    case "master":
      return role === "super_admin";
    case "admin":
      return role === "administrador" || role === "supervisor_sitio";
    case "worker":
      return role === "trabajador";
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}

/** Master: gestión global de la plataforma y administradores */
export function puedeGestionarPlataforma(role: UserRole): boolean {
  return role === "super_admin";
}

/** Admin operativo: eventos, turnos, personal (sin tocar la plataforma entera) */
export function puedeOperarEventos(role: UserRole): boolean {
  return role === "administrador" || role === "supervisor_sitio";
}

export function puedeCrearAdministradores(role: UserRole): boolean {
  return role === "super_admin";
}

export function puedeVerInformesGlobales(role: UserRole): boolean {
  return role === "super_admin";
}

export function puedeVerAuditoriaGlobal(role: UserRole): boolean {
  return role === "super_admin";
}

export function puedeReportarASupervisor(role: UserRole): boolean {
  return role === "trabajador";
}
