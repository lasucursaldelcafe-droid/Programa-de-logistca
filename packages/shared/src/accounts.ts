import type { UserRole } from "./types";

/** Roles que el administrador puede asignar al registrar personal (no incluye administrador). */
export type RolAsignablePorAdmin = Extract<UserRole, "trabajador" | "supervisor_sitio">;

export const ROLES_ASIGNABLES_ADMIN: RolAsignablePorAdmin[] = [
  "trabajador",
  "supervisor_sitio",
];

/** Correo principal de administración en producción. */
export const PLATFORM_ADMIN_EMAIL = "lasucursaldelcafe@gmail.com";

export interface PlatformSeedAccount {
  email: string;
  password: string;
  nombre: string;
  role: "super_admin" | "administrador";
}

/** Cuentas demo desactivadas — producción usa Google Sheets. */
export const PLATFORM_SEED_ACCOUNTS: PlatformSeedAccount[] = [];

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
