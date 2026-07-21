import type { UserRole } from "@spe/shared";
import {
  normalizeUserRole,
  puedeConfigurarIntegraciones,
  puedeCrearCuentasPlataforma,
  puedeGestionarClientes,
  puedeGestionarConfiguracion,
  puedeGestionarCuentas,
  puedeGestionarFacturacion,
  puedeGestionarPersonal,
  puedeGestionarQr,
  puedeGestionarTurnos,
  puedeVerInventario,
  puedeVerIntegraciones,
  puedeVerMapaEnVivo,
  puedeVerInformesEvento,
  puedeVerNomina,
  puedeVerReportesTrabajadores,
} from "@spe/shared";

export interface NavLinkItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  external?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavLinkItem[];
}

const can = {
  personal: (r: UserRole) => puedeGestionarPersonal(r),
  cuentas: (r: UserRole) => puedeGestionarCuentas(r),
  equipoAdmin: (r: UserRole) => puedeCrearCuentasPlataforma(r),
  qr: (r: UserRole) => puedeGestionarQr(r),
  operacion: (r: UserRole) => puedeGestionarTurnos(r),
  mapa: (r: UserRole) => puedeVerMapaEnVivo(r),
  reportes: (r: UserRole) => puedeVerReportesTrabajadores(r),
  informes: (r: UserRole) => puedeVerInformesEvento(r) || puedeVerReportesTrabajadores(r),
  nomina: (r: UserRole) => puedeVerNomina(r),
  config: (r: UserRole) => puedeGestionarConfiguracion(r),
  clientes: (r: UserRole) => puedeGestionarClientes(r),
  facturacion: (r: UserRole) => puedeGestionarFacturacion(r),
  inventario: (r: UserRole) => puedeVerInventario(r),
  negocio: (r: UserRole) =>
    puedeGestionarClientes(r) || puedeGestionarFacturacion(r) || puedeVerInventario(r),
  integraciones: (r: UserRole) =>
    puedeConfigurarIntegraciones(r) || puedeVerIntegraciones(r),
};

function filterSections(
  sections: NavSection[],
  role: UserRole,
  gates: Record<string, (r: UserRole) => boolean>,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const path = item.to.split("?")[0] ?? item.to;
        const gate = gates[path];
        return gate ? gate(role) : true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

const ADMIN_GATES: Record<string, (r: UserRole) => boolean> = {
  "/configuracion": can.config,
  "/equipo-admin": can.equipoAdmin,
  "/personal": can.personal,
  "/cuentas": can.cuentas,
  "/operacion": can.operacion,
  "/turnos": can.operacion,
  "/comunicacion": can.operacion,
  "/reportes": can.reportes,
  "/informes": can.informes,
  "/qr-sitios": can.qr,
  "/nomina": can.nomina,
  "/negocio": can.negocio,
  "/clientes": can.clientes,
  "/facturacion": can.facturacion,
  "/inventario": can.inventario,
  "/mapa": can.mapa,
  "/supervision": can.mapa,
  "/integraciones": can.integraciones,
  "/pendientes": can.config,
};

const SISTEMA_COMUN = (role: UserRole): NavSection => ({
  id: "sistema",
  title: "Sistema",
  items: [
    { to: "/notificaciones", label: "Notificaciones", icon: "mail" },
    { to: "/pendientes", label: "Config. pendiente", icon: "list" },
    {
      to: "/integraciones",
      label: puedeConfigurarIntegraciones(role) ? "APIs" : "Integraciones",
      icon: "plug",
    },
    { to: "/descargas", label: "Descargas", icon: "download" },
    { to: "/ayuda", label: "Ayuda", icon: "help" },
  ],
});

/** Menú del Administrador de operaciones — flujo completo del evento. */
function navAdministrador(role: UserRole): NavSection[] {
  return [
    {
      id: "inicio",
      title: "Inicio",
      items: [{ to: "/panel", label: "Resumen operativo", icon: "grid", end: true }],
    },
    {
      id: "preparar",
      title: "Preparar evento",
      items: [
        { to: "/configuracion", label: "1. Crear evento", icon: "calendar" },
        { to: "/equipo-admin", label: "2. Equipo de oficina", icon: "shield" },
        { to: "/personal", label: "3. Equipo del evento", icon: "users" },
        { to: "/cuentas", label: "4. Invitaciones", icon: "mail" },
        { to: "/operacion", label: "5. Dashboard del evento", icon: "calendar" },
      ],
    },
    {
      id: "operar",
      title: "Durante el evento",
      items: [
        { to: "/operacion?tab=supervision", label: "Supervisión y mapa", icon: "map" },
        { to: "/turnos", label: "Turnos", icon: "calendar" },
        { to: "/comunicacion", label: "Comunicación", icon: "message" },
        { to: "/informes", label: "Informes", icon: "chart" },
        { to: "/reportes", label: "Reportes", icon: "flag" },
        { to: "/qr-sitios", label: "QR y sitios", icon: "qr" },
      ],
    },
    {
      id: "cerrar",
      title: "Cierre y negocio",
      items: [
        { to: "/nomina", label: "Nómina", icon: "wallet" },
        { to: "/negocio", label: "Clientes e inventario", icon: "building" },
      ],
    },
    SISTEMA_COMUN(role),
  ];
}

/** Menú de Recursos Humanos — personas, turnos e invitaciones. */
function navRecursosHumanos(role: UserRole): NavSection[] {
  return [
    {
      id: "inicio",
      title: "Inicio",
      items: [{ to: "/panel", label: "Resumen de personal", icon: "grid", end: true }],
    },
    {
      id: "personas",
      title: "Gestión de personal",
      items: [
        { to: "/personal", label: "Equipo del evento", icon: "users" },
        { to: "/cuentas", label: "Invitaciones", icon: "mail" },
        { to: "/turnos", label: "Turnos", icon: "calendar" },
        { to: "/comunicacion", label: "Comunicación", icon: "message" },
      ],
    },
    {
      id: "seguimiento",
      title: "Seguimiento",
      items: [
        { to: "/informes", label: "Informes", icon: "chart" },
        { to: "/reportes", label: "Reportes", icon: "flag" },
      ],
    },
    SISTEMA_COMUN(role),
  ];
}

/** Menú de Contabilidad — números, nómina y cartera. */
function navContabilidad(role: UserRole): NavSection[] {
  return [
    {
      id: "inicio",
      title: "Inicio",
      items: [{ to: "/panel", label: "Resumen financiero", icon: "grid", end: true }],
    },
    {
      id: "finanzas",
      title: "Finanzas",
      items: [
        { to: "/nomina", label: "Nómina", icon: "wallet" },
        { to: "/negocio", label: "Clientes e inventario", icon: "building" },
        { to: "/informes", label: "Informes", icon: "chart" },
      ],
    },
    SISTEMA_COMUN(role),
  ];
}

/** Menú del Supervisor de campo — sitio en vivo. */
function navSupervisor(role: UserRole): NavSection[] {
  return [
    {
      id: "inicio",
      title: "Inicio",
      items: [{ to: "/panel", label: "Resumen en sitio", icon: "grid", end: true }],
    },
    {
      id: "campo",
      title: "Operación en sitio",
      items: [
        { to: "/operacion?tab=supervision", label: "Supervisión y mapa", icon: "map" },
        { to: "/turnos", label: "Turnos", icon: "calendar" },
        { to: "/qr-sitios", label: "QR y sitios", icon: "qr" },
        { to: "/comunicacion", label: "Comunicación", icon: "message" },
        { to: "/personal", label: "Equipo del evento", icon: "users" },
      ],
    },
    {
      id: "seguimiento",
      title: "Seguimiento",
      items: [
        { to: "/informes", label: "Informes", icon: "chart" },
        { to: "/reportes", label: "Reportes", icon: "flag" },
      ],
    },
    SISTEMA_COMUN(role),
  ];
}

/**
 * Navegación de consola admin filtrada por rol.
 * Cada rol ve secciones y etiquetas propias (no el mismo menú con ítems ocultos).
 */
export function getAdminNavSections(role: UserRole): NavSection[] {
  const r = normalizeUserRole(role);
  let sections: NavSection[];
  switch (r) {
    case "recursos_humanos":
      sections = navRecursosHumanos(role);
      break;
    case "contador":
      sections = navContabilidad(role);
      break;
    case "supervisor_sitio":
      sections = navSupervisor(role);
      break;
    case "administrador":
    case "ceo":
    case "master_app":
    case "super_admin":
    case "trabajador":
    default:
      sections = navAdministrador(role);
      break;
  }
  return filterSections(sections, role, ADMIN_GATES);
}

export function getMasterNavSections(): NavSection[] {
  return [
    {
      id: "plataforma",
      title: "Dirección",
      items: [
        { to: "/master", label: "Resumen dirección", icon: "grid", end: true },
        { to: "/master/trabajadores", label: "Equipo en vivo", icon: "users" },
        { to: "/master/comunicacion", label: "Chat y videollamadas", icon: "message" },
        { to: "/master/administradores", label: "Perfiles y roles", icon: "shield" },
        { to: "/master/roles", label: "Plantillas de puestos", icon: "users" },
        { to: "/master/informes", label: "Informes globales", icon: "chart" },
        { to: "/master/auditoria", label: "Auditoría", icon: "audit" },
      ],
    },
    {
      id: "empresa",
      title: "Operación de la empresa",
      items: [
        { to: "/master/panel", label: "Panel operativo", icon: "grid" },
        { to: "/master/configuracion", label: "Crear / preparar evento", icon: "settings" },
        { to: "/master/personal", label: "Equipo del evento", icon: "users" },
        { to: "/master/cuentas", label: "Invitaciones", icon: "mail" },
        { to: "/master/operacion", label: "Dashboard del evento", icon: "calendar" },
        { to: "/master/supervision", label: "Supervisión y mapa", icon: "map" },
        { to: "/master/turnos", label: "Turnos", icon: "calendar" },
        { to: "/master/qr-sitios", label: "Códigos de entrada y sitios", icon: "qr" },
        { to: "/master/reportes", label: "Novedades de campo", icon: "flag" },
        { to: "/master/informes-evento", label: "Informes por evento", icon: "chart" },
        { to: "/master/nomina", label: "Nómina", icon: "wallet" },
        { to: "/master/negocio", label: "Clientes e inventario", icon: "building" },
      ],
    },
    {
      id: "sistema",
      title: "Sistema",
      items: [
        { to: "/master/notificaciones", label: "Notificaciones", icon: "bell" },
        { to: "/master/pendientes", label: "Pendientes", icon: "list" },
        { to: "/master/integraciones", label: "APIs e integraciones", icon: "plug" },
        { to: "/master/descargas", label: "Descargas", icon: "download" },
        { to: "/master/ayuda", label: "Ayuda", icon: "help" },
      ],
    },
  ];
}

export function getWorkerNavItems(): NavLinkItem[] {
  return [
    ...getWorkerBottomNavItems(),
    { to: "/worker/notificaciones", label: "Alertas", icon: "mail" },
    { to: "/worker/ayuda", label: "Ayuda", icon: "help" },
  ];
}

export function getWorkerBottomNavItems(): NavLinkItem[] {
  return [
    { to: "/worker", label: "Inicio", icon: "grid", end: true },
    { to: "/worker/turnos", label: "Mis turnos", icon: "calendar" },
    { to: "/worker/entrada", label: "Escanear QR", icon: "qr" },
    { to: "/worker/reportar", label: "Reportar", icon: "flag" },
    { to: "/worker/comunicacion", label: "Chat", icon: "message" },
  ];
}
