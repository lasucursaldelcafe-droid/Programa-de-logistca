import type { UserRole } from "./types";

/** Roles que el administrador puede asignar al registrar personal (no incluye administrador). */
export type RolAsignablePorAdmin = Extract<UserRole, "trabajador" | "supervisor_sitio">;

export const ROLES_ASIGNABLES_ADMIN: RolAsignablePorAdmin[] = [
  "trabajador",
  "supervisor_sitio",
];

/** Cuenta única de administración de la empresa — credencial fija de plataforma. */
export const PLATFORM_ADMIN_EMAIL = "admin@eventos.test";

export interface PlatformSeedAccount {
  email: string;
  password: string;
  nombre: string;
  role: "super_admin" | "administrador";
}

/**
 * Cuentas precargadas en seed/demo. Solo Master (plataforma) y un Administrador único.
 * Supervisores y trabajadores se crean desde Admin → Personal + Cuentas.
 */
export const PLATFORM_SEED_ACCOUNTS: PlatformSeedAccount[] = [
  {
    email: "master@eventos.test",
    password: "Master123!",
    nombre: "Master Plataforma",
    role: "super_admin",
  },
  {
    email: PLATFORM_ADMIN_EMAIL,
    password: "Admin123!",
    nombre: "Administrador",
    role: "administrador",
  },
];

export function esCuentaPlataforma(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return PLATFORM_SEED_ACCOUNTS.some((a) => a.email.toLowerCase() === normalized);
}

/** Solo el administrador asigna roles al registrar e invitar personal. */
export function puedeAsignarRoles(role: UserRole): boolean {
  return role === "administrador";
}

export function esRolAsignablePorAdmin(role: string): role is RolAsignablePorAdmin {
  return ROLES_ASIGNABLES_ADMIN.includes(role as RolAsignablePorAdmin);
}
