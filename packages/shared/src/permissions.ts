import type { UserRole } from "./types";

/** Nivel de acceso: solo consulta o puede modificar. */
export type RoleAccessMode = "lectura" | "editor";

export const ROLE_ACCESS_MODE_LABEL: Record<RoleAccessMode, string> = {
  lectura: "Solo lectura",
  editor: "Editor",
};

/** Funciones / capacidades asignables a roles personalizados. */
export type SpePermission =
  | "dashboard_operativo"
  | "gestionar_personal"
  | "gestionar_turnos"
  | "gestionar_cuentas"
  | "gestionar_qr"
  | "ver_mapa_en_vivo"
  | "ver_supervision"
  | "enviar_emergencia"
  | "ver_notificaciones"
  | "gestionar_nomina"
  | "ver_nomina"
  | "gestionar_configuracion"
  | "ver_reportes_trabajadores"
  | "configurar_integraciones"
  | "ver_integraciones"
  | "usar_comunicacion"
  | "ver_informes_evento"
  | "gestionar_clientes"
  | "gestionar_facturacion"
  | "ver_inventario"
  | "marcar_entrada"
  | "reportar_supervisor"
  | "ver_turnos_propio";

export type CustomRoleBase = Extract<UserRole, "administrador" | "supervisor_sitio" | "trabajador">;

export interface CustomRole {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Plataforma base: admin o trabajador. */
  baseRole: CustomRoleBase;
  permisos: SpePermission[];
  activo: boolean;
  /** lectura = solo consulta; editor = puede modificar según permisos. */
  modoAcceso?: RoleAccessMode;
  /** ID de plantilla de origen, si se creó desde catálogo. */
  plantillaId?: string;
  creadoEn: string;
  creadoPor: string;
  creadoPorNombre?: string;
}

export interface PermissionMeta {
  label: string;
  group: string;
  descripcion?: string;
}

export const PERMISSION_CATALOG: Record<SpePermission, PermissionMeta> = {
  dashboard_operativo: {
    label: "Ver panel operativo",
    group: "General",
    descripcion: "KPIs, resumen y métricas del evento",
  },
  gestionar_personal: {
    label: "Gestionar personal",
    group: "Personal",
    descripcion: "Registrar, editar y dar de baja trabajadores",
  },
  gestionar_turnos: {
    label: "Gestionar turnos",
    group: "Operación",
    descripcion: "Crear turnos y confirmar asignaciones",
  },
  gestionar_cuentas: {
    label: "Gestionar cuentas e invitaciones",
    group: "Personal",
  },
  gestionar_qr: {
    label: "Gestionar QR y sitios",
    group: "Operación",
  },
  ver_mapa_en_vivo: {
    label: "Ver mapa en vivo",
    group: "Operación",
  },
  ver_supervision: {
    label: "Ver supervisión GPS",
    group: "Operación",
  },
  enviar_emergencia: {
    label: "Enviar alertas de emergencia",
    group: "Operación",
  },
  ver_notificaciones: {
    label: "Ver notificaciones",
    group: "General",
  },
  gestionar_nomina: {
    label: "Calcular y exportar nómina",
    group: "Nómina",
  },
  ver_nomina: {
    label: "Ver nómina",
    group: "Nómina",
  },
  gestionar_configuracion: {
    label: "Configurar evento y operaciones",
    group: "Configuración",
  },
  ver_reportes_trabajadores: {
    label: "Ver reportes de trabajadores",
    group: "Operación",
  },
  configurar_integraciones: {
    label: "Configurar APIs e integraciones",
    group: "Integraciones",
  },
  ver_integraciones: {
    label: "Ver integraciones",
    group: "Integraciones",
  },
  usar_comunicacion: {
    label: "Chat y videollamadas",
    group: "Comunicación",
  },
  ver_informes_evento: {
    label: "Informes por evento",
    group: "Informes",
  },
  gestionar_clientes: {
    label: "Gestionar clientes",
    group: "Negocio",
  },
  gestionar_facturacion: {
    label: "Gestionar facturación",
    group: "Negocio",
  },
  ver_inventario: {
    label: "Ver inventario",
    group: "Negocio",
  },
  marcar_entrada: {
    label: "Marcar entrada / jornada",
    group: "Trabajador",
  },
  reportar_supervisor: {
    label: "Reportar novedades",
    group: "Trabajador",
  },
  ver_turnos_propio: {
    label: "Ver mis turnos",
    group: "Trabajador",
  },
};

export const ALL_SPE_PERMISSIONS = Object.keys(PERMISSION_CATALOG) as SpePermission[];

const ADMIN_FULL: SpePermission[] = [
  "dashboard_operativo",
  "gestionar_personal",
  "gestionar_turnos",
  "gestionar_cuentas",
  "gestionar_qr",
  "ver_mapa_en_vivo",
  "ver_supervision",
  "enviar_emergencia",
  "ver_notificaciones",
  "gestionar_nomina",
  "ver_nomina",
  "gestionar_configuracion",
  "ver_reportes_trabajadores",
  "configurar_integraciones",
  "ver_integraciones",
  "usar_comunicacion",
  "ver_informes_evento",
  "gestionar_clientes",
  "gestionar_facturacion",
  "ver_inventario",
];

const SUPERVISOR_DEFAULT: SpePermission[] = [
  "dashboard_operativo",
  "gestionar_personal",
  "gestionar_turnos",
  "gestionar_qr",
  "ver_mapa_en_vivo",
  "ver_supervision",
  "enviar_emergencia",
  "ver_notificaciones",
  "ver_nomina",
  "ver_reportes_trabajadores",
  "ver_integraciones",
  "usar_comunicacion",
  "ver_informes_evento",
  "gestionar_clientes",
  "gestionar_facturacion",
  "ver_inventario",
];

const TRABAJADOR_DEFAULT: SpePermission[] = [
  "marcar_entrada",
  "reportar_supervisor",
  "ver_turnos_propio",
  "ver_nomina",
  "ver_notificaciones",
  "usar_comunicacion",
];

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserRole, SpePermission[]> = {
  super_admin: [...ALL_SPE_PERMISSIONS],
  administrador: ADMIN_FULL,
  supervisor_sitio: SUPERVISOR_DEFAULT,
  trabajador: TRABAJADOR_DEFAULT,
};

/** Permisos válidos según la plataforma base del rol personalizado. */
export function permisosDisponiblesParaBase(baseRole: CustomRoleBase): SpePermission[] {
  if (baseRole === "trabajador") {
    return TRABAJADOR_DEFAULT.concat([
      "ver_mapa_en_vivo",
      "ver_reportes_trabajadores",
      "ver_informes_evento",
    ]);
  }
  if (baseRole === "supervisor_sitio") {
    return SUPERVISOR_DEFAULT;
  }
  return ADMIN_FULL;
}

export function resolvePermissions(
  role: UserRole,
  customRole?: CustomRole | null,
): SpePermission[] {
  if (role === "super_admin") return DEFAULT_PERMISSIONS_BY_ROLE.super_admin;
  if (customRole?.activo && customRole.permisos.length > 0) {
    return [...customRole.permisos];
  }
  return DEFAULT_PERMISSIONS_BY_ROLE[role] ?? [];
}

export function parseCustomRolePermisos(raw: unknown): SpePermission[] {
  if (Array.isArray(raw)) {
    return raw.filter((p): p is SpePermission =>
      ALL_SPE_PERMISSIONS.includes(p as SpePermission),
    );
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      return parseCustomRolePermisos(parsed);
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter((p): p is SpePermission =>
          ALL_SPE_PERMISSIONS.includes(p as SpePermission),
        );
    }
  }
  return [];
}

export function serializeCustomRolePermisos(permisos: SpePermission[]): string {
  return JSON.stringify(permisos);
}

let sessionPermissionsGetter: (() => SpePermission[] | null) | null = null;

export function registerSessionPermissions(
  getter: (() => SpePermission[] | null) | null,
): void {
  sessionPermissionsGetter = getter;
}

function effectivePermissions(role: UserRole): SpePermission[] {
  const session = sessionPermissionsGetter?.();
  if (session) return session;
  return DEFAULT_PERMISSIONS_BY_ROLE[role] ?? [];
}

export function hasPermission(role: UserRole, permission: SpePermission): boolean {
  return effectivePermissions(role).includes(permission);
}

export function puedeGestionarPersonal(role: UserRole): boolean {
  return hasPermission(role, "gestionar_personal");
}

export function puedeGestionarTurnos(role: UserRole): boolean {
  return hasPermission(role, "gestionar_turnos");
}

export function puedeConfigurarIntegraciones(role: UserRole): boolean {
  return hasPermission(role, "configurar_integraciones");
}

export function puedeGestionarCuentas(role: UserRole): boolean {
  return hasPermission(role, "gestionar_cuentas");
}

export function puedeGestionarQr(role: UserRole): boolean {
  return hasPermission(role, "gestionar_qr");
}

export function puedeVerMapaEnVivo(role: UserRole): boolean {
  return hasPermission(role, "ver_mapa_en_vivo");
}

export function puedeEnviarEmergencia(role: UserRole): boolean {
  return hasPermission(role, "enviar_emergencia");
}

export function puedeGestionarNomina(role: UserRole): boolean {
  return hasPermission(role, "gestionar_nomina");
}

export function puedeVerNomina(role: UserRole): boolean {
  return hasPermission(role, "ver_nomina");
}

export function puedeGestionarConfiguracion(role: UserRole): boolean {
  return hasPermission(role, "gestionar_configuracion");
}

export function puedeVerReportesTrabajadores(role: UserRole): boolean {
  return hasPermission(role, "ver_reportes_trabajadores");
}

export function puedeUsarComunicacion(role: UserRole): boolean {
  return hasPermission(role, "usar_comunicacion");
}

export function puedeVerInformesEvento(role: UserRole): boolean {
  return hasPermission(role, "ver_informes_evento");
}

export function puedeGestionarRolesCustom(role: UserRole): boolean {
  return role === "super_admin";
}

export function getPermissionGroups(): string[] {
  const groups = new Set<string>();
  for (const meta of Object.values(PERMISSION_CATALOG)) {
    groups.add(meta.group);
  }
  return [...groups];
}

export function permissionsByGroup(): Record<string, SpePermission[]> {
  const map: Record<string, SpePermission[]> = {};
  for (const [key, meta] of Object.entries(PERMISSION_CATALOG)) {
    const perm = key as SpePermission;
    if (!map[meta.group]) map[meta.group] = [];
    map[meta.group].push(perm);
  }
  return map;
}

export function getCustomRoleDisplayName(
  role: UserRole,
  customRole?: CustomRole | null,
): string {
  if (customRole?.activo) return customRole.nombre;
  return role;
}
