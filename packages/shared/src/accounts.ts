import type { UserRole } from "./types";

/** Roles que el administrador puede asignar al registrar personal (no incluye administrador). */
export type RolAsignablePorAdmin = Extract<UserRole, "trabajador" | "supervisor_sitio">;

export const ROLES_ASIGNABLES_ADMIN: RolAsignablePorAdmin[] = [
  "trabajador",
  "supervisor_sitio",
];

/** Correo principal de administración en producción (Firebase Auth). */
export const PLATFORM_ADMIN_EMAIL = "lasucursaldelcafe@gmail.com";

/** Solo el administrador asigna roles al registrar e invitar personal. */
export function puedeAsignarRoles(role: UserRole): boolean {
  return role === "administrador";
}

export function esRolAsignablePorAdmin(role: string): role is RolAsignablePorAdmin {
  return ROLES_ASIGNABLES_ADMIN.includes(role as RolAsignablePorAdmin);
}
