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

/** Panel principal según rol del usuario autenticado. */
export function plataformaParaRol(role: UserRole): AppPlatform {
  if (role === "super_admin") return "master";
  if (role === "trabajador") return "worker";
  return "admin";
}

/** Ruta de inicio tras login en la app unificada. */
export function rutaHomePorRol(role: UserRole): string {
  const platform = plataformaParaRol(role);
  switch (platform) {
    case "master":
      return "/master";
    case "worker":
      return "/worker";
    case "admin":
      return "/panel";
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
