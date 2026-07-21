/**
 * Catálogo de roles de plataforma: nombres, qué ven y quién los crea.
 * Al inicio solo existen CEO y Master App; el resto se crea en cascada.
 */
import type { UserRole } from "./types";
import { normalizeUserRole } from "./accounts";

export interface RoleCatalogEntry {
  id: UserRole;
  /** Nombre corto en menús y badges */
  nombre: string;
  /** Nombre completo con contexto */
  nombreCompleto: string;
  /** Una línea: para qué sirve este rol */
  resumen: string;
  /** Consola a la que entra al iniciar sesión */
  consola: "master" | "admin" | "worker";
  /** Área funcional (para agrupar en UI) */
  area: "direccion" | "administracion" | "campo";
  /** Qué puede ver / hacer (texto para guías) */
  puedeVer: string[];
  /** Qué no ve (para dejar claro el límite) */
  noVe: string[];
}

/** Catálogo canónico — fuente de verdad para etiquetas y guías de rol. */
export const ROLE_CATALOG: Record<UserRole, RoleCatalogEntry> = {
  ceo: {
    id: "ceo",
    nombre: "CEO",
    nombreCompleto: "CEO — Dirección general",
    resumen:
      "Cuenta raíz del negocio. Opera todos los parámetros de la empresa y el personal (crear, quitar, ajustar, reportes), sin ser empleado de campo.",
    consola: "master",
    area: "direccion",
    puedeVer: [
      "Equipo administrativo (crear cuentas)",
      "Configurar eventos, sitios, QR y operaciones",
      "Personal: crear, editar, quitar e invitar",
      "Turnos, supervisión, mapa y reportes",
      "Nómina, clientes, facturación e inventario",
      "Trabajadores en vivo, chat e informes",
      "Roles, auditoría e integraciones",
    ],
    noVe: [
      "App de campo del empleado (marcar entrada / mis turnos como trabajador)",
    ],
  },
  master_app: {
    id: "master_app",
    nombre: "Master App",
    nombreCompleto: "Master App — Plataforma",
    resumen: "Cuenta raíz técnica. Configura la plataforma y el equipo inicial.",
    consola: "master",
    area: "direccion",
    puedeVer: [
      "Equipo administrativo (crear cuentas)",
      "Trabajadores en vivo (actividad y GPS)",
      "Chat y videollamadas (todos los canales del evento)",
      "Roles y puestos personalizados",
      "Informes y auditoría global",
    ],
    noVe: ["App de campo del trabajador", "Marcado de entrada QR"],
  },
  super_admin: {
    id: "super_admin",
    nombre: "Master App",
    nombreCompleto: "Master App — Plataforma",
    resumen: "Alias legacy de Master App.",
    consola: "master",
    area: "direccion",
    puedeVer: ["Igual que Master App"],
    noVe: ["App de campo"],
  },
  administrador: {
    id: "administrador",
    nombre: "Administrador",
    nombreCompleto: "Administrador de operaciones",
    resumen: "Dirige la operación del evento: sitios, turnos, personal y cierre.",
    consola: "admin",
    area: "administracion",
    puedeVer: [
      "Crear y configurar eventos",
      "Equipo administrativo (RH y Contabilidad)",
      "Personal de campo e invitaciones",
      "Supervisión, mapa, QR, reportes",
      "Nómina y clientes/inventario",
    ],
    noVe: ["Consola Master (roles globales / auditoría)"],
  },
  recursos_humanos: {
    id: "recursos_humanos",
    nombre: "Recursos Humanos",
    nombreCompleto: "Recursos Humanos",
    resumen: "Gestiona altas, cuentas e invitaciones del personal.",
    consola: "admin",
    area: "administracion",
    puedeVer: [
      "Personal de campo (supervisores y empleados)",
      "Invitaciones y accesos",
      "Turnos y comunicación",
      "Reportes e informes de personal",
    ],
    noVe: [
      "Crear eventos / configuración global",
      "Nómina y facturación",
      "Clientes e inventario",
      "APIs e integraciones",
    ],
  },
  contador: {
    id: "contador",
    nombre: "Contabilidad",
    nombreCompleto: "Contabilidad y finanzas",
    resumen: "Cierra números: nómina, facturación, cartera e inventario.",
    consola: "admin",
    area: "administracion",
    puedeVer: [
      "Nómina",
      "Clientes, facturación e inventario",
      "Informes financieros del evento",
      "Integraciones de lectura",
    ],
    noVe: [
      "Crear eventos o personal de campo",
      "Supervisión en vivo / QR",
      "Crear otras cuentas",
    ],
  },
  supervisor_sitio: {
    id: "supervisor_sitio",
    nombre: "Supervisor",
    nombreCompleto: "Supervisor de campo",
    resumen: "Coordina el equipo en el sitio durante el evento.",
    consola: "admin",
    area: "campo",
    puedeVer: [
      "Supervisión y mapa en vivo",
      "Turnos del sitio",
      "QR y sitios",
      "Reportes y comunicación",
      "Registrar empleados de campo",
    ],
    noVe: [
      "Configuración de eventos",
      "Nómina y finanzas",
      "Clientes / facturación",
      "Crear cuentas administrativas",
    ],
  },
  trabajador: {
    id: "trabajador",
    nombre: "Empleado",
    nombreCompleto: "Empleado de campo",
    resumen: "Trabaja en el evento: turnos, entrada QR y reportes.",
    consola: "worker",
    area: "campo",
    puedeVer: [
      "Mis turnos",
      "Escanear QR / marcar entrada",
      "Reportar novedades",
      "Chat y alertas",
      "Mi nómina (consulta)",
    ],
    noVe: ["Consola administrativa", "Crear personal o eventos"],
  },
};

/** Etiqueta corta para badges y selects. */
export function nombreRol(role: UserRole): string {
  return ROLE_CATALOG[normalizeUserRole(role)].nombreCompleto;
}

/** Resumen de una línea. */
export function resumenRol(role: UserRole): string {
  return ROLE_CATALOG[normalizeUserRole(role)].resumen;
}

/** Jerarquía textual para pantallas de onboarding. */
export const JERARQUIA_CUENTAS: {
  titulo: string;
  detalle: string;
}[] = [
  {
    titulo: "1. Cuentas raíz (únicas al inicio)",
    detalle: "CEO — Dirección general y Master App — Plataforma. Solo ellas existen al arrancar.",
  },
  {
    titulo: "2. Equipo administrativo",
    detalle:
      "CEO / Master App crean: Administrador de operaciones, Recursos Humanos y Contabilidad.",
  },
  {
    titulo: "3. Cascada operativa",
    detalle:
      "CEO y Administrador pueden registrar Supervisores y Empleados. RH también. Supervisor puede dar de alta Empleados.",
  },
  {
    titulo: "4. Cada rol ve solo su área",
    detalle:
      "El menú y los permisos se filtran por rol. El CEO ve toda la empresa salvo la app de empleado. Finanzas no ve campo; el empleado no ve consola admin.",
  },
];
