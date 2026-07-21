/**
 * Catálogo de roles: nombres claros desde dirección, operaciones, personas, finanzas y sitio.
 * Al inicio solo existen Dirección general (CEO) y Dirección técnica; el resto se crea en cascada.
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
    nombre: "Dirección",
    nombreCompleto: "Dirección general (CEO)",
    resumen:
      "Cuenta raíz del negocio. Define el rumbo y opera empresa y personal (crear, ajustar, reportes), sin marcar entrada como personal en sitio.",
    consola: "master",
    area: "direccion",
    puedeVer: [
      "Equipo administrativo (crear cuentas)",
      "Preparar eventos, sitios, códigos de entrada y reglas",
      "Personal: crear, editar, quitar e invitar",
      "Turnos, supervisión, mapa y novedades",
      "Nómina, clientes, facturación e inventario",
      "Equipo en vivo, chat e informes",
      "Roles, auditoría e integraciones",
    ],
    noVe: [
      "App de personal en sitio (marcar entrada / mis turnos como personal)",
    ],
  },
  master_app: {
    id: "master_app",
    nombre: "Plataforma",
    nombreCompleto: "Dirección técnica (plataforma)",
    resumen: "Cuenta raíz técnica. Deja la herramienta y el equipo inicial listos para operar.",
    consola: "master",
    area: "direccion",
    puedeVer: [
      "Equipo administrativo (crear cuentas)",
      "Equipo en vivo (actividad y ubicación)",
      "Chat y videollamadas (canales del evento)",
      "Roles y puestos personalizados",
      "Informes y auditoría global",
    ],
    noVe: ["App de personal en sitio", "Marcado de entrada con código"],
  },
  super_admin: {
    id: "super_admin",
    nombre: "Plataforma",
    nombreCompleto: "Dirección técnica (plataforma)",
    resumen: "Alias legacy de Dirección técnica.",
    consola: "master",
    area: "direccion",
    puedeVer: ["Igual que Dirección técnica"],
    noVe: ["App de personal en sitio"],
  },
  administrador: {
    id: "administrador",
    nombre: "Operaciones",
    nombreCompleto: "Operaciones del evento",
    resumen: "Dirige la operación del evento: sitios, turnos, personal y cierre.",
    consola: "admin",
    area: "administracion",
    puedeVer: [
      "Crear y preparar eventos",
      "Equipo administrativo (Personas y Finanzas)",
      "Personal en sitio e invitaciones",
      "Supervisión, mapa, códigos de entrada, novedades",
      "Nómina y clientes/inventario",
    ],
    noVe: ["Consola de dirección (roles globales / auditoría)"],
  },
  recursos_humanos: {
    id: "recursos_humanos",
    nombre: "Personas",
    nombreCompleto: "Personas (RH)",
    resumen: "Gestiona altas, accesos e invitaciones del equipo del evento.",
    consola: "admin",
    area: "administracion",
    puedeVer: [
      "Personal en sitio (coordinación y equipo)",
      "Invitaciones y accesos",
      "Turnos y comunicación",
      "Novedades e informes de personal",
    ],
    noVe: [
      "Crear eventos / preparación global",
      "Nómina y facturación",
      "Clientes e inventario",
      "APIs e integraciones",
    ],
  },
  contador: {
    id: "contador",
    nombre: "Finanzas",
    nombreCompleto: "Finanzas",
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
      "Crear eventos o personal en sitio",
      "Supervisión en vivo / códigos de entrada",
      "Crear otras cuentas",
    ],
  },
  supervisor_sitio: {
    id: "supervisor_sitio",
    nombre: "Coordinación",
    nombreCompleto: "Coordinación en sitio",
    resumen: "Coordina al equipo en el lugar durante el evento.",
    consola: "admin",
    area: "campo",
    puedeVer: [
      "Supervisión y mapa en vivo",
      "Turnos del sitio",
      "Códigos de entrada y sitios",
      "Novedades y comunicación",
      "Registrar personal en sitio",
    ],
    noVe: [
      "Preparación de eventos",
      "Nómina y finanzas",
      "Clientes / facturación",
      "Crear cuentas administrativas",
    ],
  },
  trabajador: {
    id: "trabajador",
    nombre: "En sitio",
    nombreCompleto: "Personal en sitio",
    resumen: "Trabaja el evento: turnos, entrada con código y novedades.",
    consola: "worker",
    area: "campo",
    puedeVer: [
      "Mis turnos",
      "Escanear código / marcar entrada",
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
    detalle:
      "Dirección general (CEO) y Dirección técnica (plataforma). Solo ellas existen al arrancar.",
  },
  {
    titulo: "2. Equipo de oficina",
    detalle:
      "Dirección crea: Operaciones del evento, Personas (RH) y Finanzas.",
  },
  {
    titulo: "3. Cascada en el evento",
    detalle:
      "Dirección y Operaciones pueden registrar Coordinación en sitio y Personal en sitio. Personas (RH) también. Quien coordina en sitio puede dar de alta personal.",
  },
  {
    titulo: "4. Cada rol ve solo su área",
    detalle:
      "El menú y los permisos se filtran por rol. Dirección ve la empresa salvo la app de personal en sitio. Finanzas no ve el campo; el personal en sitio no ve la consola de oficina.",
  },
];
