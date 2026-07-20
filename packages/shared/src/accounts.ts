import type { UserRole } from "./types";

/** Roles con acceso a la consola Master (/master). */
export const ROLES_MASTER: UserRole[] = ["ceo", "master_app", "super_admin"];

/** Roles de personal administrativo (consola admin, sin app de campo). */
export const ROLES_PERSONAL_ADMIN: UserRole[] = [
  "administrador",
  "recursos_humanos",
  "contador",
];

/** Roles operativos en consola admin (supervisión en sitio). */
export const ROLES_OPERACION_CAMPO: UserRole[] = ["supervisor_sitio"];

/** Correo principal de administración en producción (Firebase Auth). */
export const PLATFORM_ADMIN_EMAIL = "lasucursaldelcafe@gmail.com";

/** Normaliza roles legacy al cargar sesión o datos externos. */
export function normalizeUserRole(role: string): UserRole {
  if (role === "super_admin") return "master_app";
  const valid: UserRole[] = [
    "ceo",
    "master_app",
    "administrador",
    "recursos_humanos",
    "contador",
    "supervisor_sitio",
    "trabajador",
  ];
  if (valid.includes(role as UserRole)) return role as UserRole;
  return "trabajador";
}

export function esRolMaster(role: UserRole): boolean {
  return ROLES_MASTER.includes(role);
}

export function esRolConsolaAdmin(role: UserRole): boolean {
  const r = normalizeUserRole(role);
  return (
    ROLES_PERSONAL_ADMIN.includes(r) ||
    ROLES_OPERACION_CAMPO.includes(r) ||
    esRolMaster(role)
  );
}

/** Roles que un usuario puede asignar al crear otra cuenta (jerarquía descendente). */
export function rolesAsignablesPor(creatorRole: UserRole): UserRole[] {
  const creator = normalizeUserRole(creatorRole);
  switch (creator) {
    case "ceo":
    case "master_app":
      return [
        "administrador",
        "recursos_humanos",
        "contador",
        "supervisor_sitio",
        "trabajador",
      ];
    case "administrador":
      return ["recursos_humanos", "contador", "supervisor_sitio", "trabajador"];
    case "recursos_humanos":
      return ["supervisor_sitio", "trabajador"];
    case "supervisor_sitio":
      return ["trabajador"];
    default:
      return [];
  }
}

/** Roles de equipo administrativo que se crean sin ficha de trabajador. */
export function rolesCuentaPlataforma(creatorRole: UserRole): UserRole[] {
  return rolesAsignablesPor(creatorRole).filter((r) =>
    ROLES_PERSONAL_ADMIN.includes(r),
  );
}

/** Roles de campo asignables al registrar personal (con ficha de trabajador). */
export function rolesPersonalCampo(creatorRole: UserRole): UserRole[] {
  return rolesAsignablesPor(creatorRole).filter(
    (r) => r === "supervisor_sitio" || r === "trabajador",
  );
}

export function puedeAsignarRoles(role: UserRole): boolean {
  return rolesPersonalCampo(role).length > 0;
}

export function puedeCrearCuentasPlataforma(role: UserRole): boolean {
  return rolesCuentaPlataforma(role).length > 0;
}

export function puedeCrearAdministradores(role: UserRole): boolean {
  return rolesAsignablesPor(role).includes("administrador");
}

export function puedeAsignarRol(asignador: UserRole, objetivo: UserRole): boolean {
  return rolesAsignablesPor(asignador).includes(normalizeUserRole(objetivo));
}

/** @deprecated Usar rolesPersonalCampo */
export type RolAsignablePorAdmin = Extract<UserRole, "trabajador" | "supervisor_sitio">;

/** @deprecated Usar rolesPersonalCampo(user.role) */
export const ROLES_ASIGNABLES_ADMIN: RolAsignablePorAdmin[] = [
  "trabajador",
  "supervisor_sitio",
];

export function esRolAsignablePorAdmin(role: string): role is RolAsignablePorAdmin {
  return ROLES_ASIGNABLES_ADMIN.includes(role as RolAsignablePorAdmin);
}
