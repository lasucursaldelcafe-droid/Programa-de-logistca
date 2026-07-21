import type { UserRole } from "./types";
import { esRolMaster, normalizeUserRole } from "./accounts";

export type AppPlatform = "master" | "admin" | "worker";

export const PLATFORM_LABEL: Record<AppPlatform, string> = {
  master: "Consola Master",
  admin: "Consola Administrativa",
  worker: "App de Campo",
};

export function puedeAccederPlataforma(role: UserRole, platform: AppPlatform): boolean {
  const normalized = normalizeUserRole(role);
  switch (platform) {
    case "master":
      return esRolMaster(role);
    case "admin":
      // CEO / Master App operan la empresa completa (menos app de empleado).
      return (
        esRolMaster(role) ||
        normalized === "administrador" ||
        normalized === "recursos_humanos" ||
        normalized === "contador" ||
        normalized === "supervisor_sitio"
      );
    case "worker":
      // Solo el rol Empleado usa la app de campo.
      return normalized === "trabajador";
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}

/** Panel principal según rol del usuario autenticado. */
export function plataformaParaRol(role: UserRole): AppPlatform {
  if (esRolMaster(role)) return "master";
  if (normalizeUserRole(role) === "trabajador") return "worker";
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

/** Master: gestión global de la plataforma */
export function puedeGestionarPlataforma(role: UserRole): boolean {
  return esRolMaster(role);
}

/** Admin operativo: eventos, turnos, personal (incluye dirección CEO/Master). */
export function puedeOperarEventos(role: UserRole): boolean {
  return puedeAccederPlataforma(role, "admin");
}

export function puedeVerInformesGlobales(role: UserRole): boolean {
  return esRolMaster(role);
}

export function puedeVerAuditoriaGlobal(role: UserRole): boolean {
  return esRolMaster(role);
}

export function puedeReportarASupervisor(role: UserRole): boolean {
  const r = normalizeUserRole(role);
  return r === "trabajador" || r === "supervisor_sitio";
}

// Re-export desde accounts para compatibilidad
export {
  puedeCrearAdministradores,
  puedeCrearCuentasPlataforma,
  rolesAsignablesPor,
  rolesCuentaPlataforma,
  rolesPersonalCampo,
} from "./accounts";
