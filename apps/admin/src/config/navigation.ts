import type { UserRole } from "@spe/shared";
import {
  puedeConfigurarIntegraciones,
  puedeGestionarConfiguracion,
  puedeGestionarCuentas,
  puedeGestionarPersonal,
  puedeGestionarQr,
  puedeGestionarTurnos,
  puedeVerMapaEnVivo,
  puedeVerNomina,
  puedeVerReportesTrabajadores,
} from "@spe/shared";

export interface NavLinkItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  /** Abre en pestaña nueva (p. ej. descargas públicas) */
  external?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavLinkItem[];
}

type NavFilter = (role: UserRole) => NavSection[];

const can = {
  personal: (r: UserRole) => puedeGestionarPersonal(r),
  cuentas: (r: UserRole) => puedeGestionarCuentas(r),
  qr: (r: UserRole) => puedeGestionarQr(r),
  operacion: (r: UserRole) => puedeGestionarTurnos(r),
  mapa: (r: UserRole) => puedeVerMapaEnVivo(r),
  reportes: (r: UserRole) => puedeVerReportesTrabajadores(r),
  nomina: (r: UserRole) => puedeVerNomina(r),
  config: (r: UserRole) => puedeGestionarConfiguracion(r),
  apis: () => true,
};

function filterSections(sections: NavSection[], role: UserRole, gates: Record<string, (r: UserRole) => boolean>): NavSection[] {
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
  "/personal": can.personal,
  "/cuentas": can.cuentas,
  "/operacion": can.operacion,
  "/turnos": can.operacion,
  "/comunicacion": can.operacion,
  "/reportes": can.reportes,
  "/qr-sitios": can.qr,
  "/nomina": can.nomina,
  "/clientes": can.personal,
  "/facturacion": can.personal,
  "/inventario": can.personal,
  "/integraciones": can.apis,
  "/pendientes": can.config,
};

export function getAdminNavSections(role: UserRole): NavSection[] {
  const sections: NavSection[] = [
    {
      id: "inicio",
      title: "Inicio",
      items: [{ to: "/panel", label: "Resumen", icon: "grid", end: true }],
    },
    {
      id: "preparar",
      title: "Preparar evento",
      items: [
        { to: "/configuracion", label: "1. Crear evento", icon: "calendar" },
        { to: "/personal", label: "2. Personal", icon: "users" },
        { to: "/cuentas", label: "3. Invitaciones", icon: "mail" },
        { to: "/operacion", label: "4. Dashboard del evento", icon: "calendar" },
      ],
    },
    {
      id: "operar",
      title: "Durante el evento",
      items: [
        { to: "/operacion?tab=supervision", label: "Mapa y supervisión", icon: "map" },
        { to: "/turnos", label: "Turnos", icon: "calendar" },
        { to: "/comunicacion", label: "Comunicación", icon: "message" },
        { to: "/reportes", label: "Reportes", icon: "flag" },
        { to: "/qr-sitios", label: "QR y sitios", icon: "qr" },
      ],
    },
    {
      id: "cerrar",
      title: "Cierre",
      items: [{ to: "/nomina", label: "Nómina", icon: "wallet" }],
    },
    {
      id: "negocio",
      title: "Negocio",
      items: [
        { to: "/clientes", label: "Clientes", icon: "building" },
        { to: "/facturacion", label: "Facturación", icon: "receipt" },
        { to: "/inventario", label: "Inventario", icon: "box" },
      ],
    },
    {
      id: "sistema",
      title: "Sistema",
      items: [
        { to: "/pendientes", label: "Config. pendiente", icon: "list" },
        { to: "/integraciones", label: puedeConfigurarIntegraciones(role) ? "APIs" : "Integraciones", icon: "plug" },
        { to: "/descargas", label: "Descargas", icon: "download" },
        { to: "/ayuda", label: "Ayuda", icon: "help" },
      ],
    },
  ];

  return filterSections(sections, role, ADMIN_GATES);
}

export function getMasterNavSections(): NavSection[] {
  return [
    {
      id: "plataforma",
      title: "Plataforma",
      items: [
        { to: "/master", label: "Resumen", icon: "grid", end: true },
        { to: "/master/administradores", label: "Administradores", icon: "shield" },
        { to: "/master/informes", label: "Informes", icon: "chart" },
        { to: "/master/auditoria", label: "Auditoría", icon: "audit" },
        { to: "/master/ayuda", label: "Ayuda", icon: "help" },
      ],
    },
  ];
}

export function getWorkerNavItems(): NavLinkItem[] {
  return [
    { to: "/worker", label: "Inicio", icon: "grid", end: true },
    { to: "/worker/turnos", label: "Turnos", icon: "calendar" },
    { to: "/worker/entrada", label: "Escanear", icon: "qr" },
    { to: "/worker/reportar", label: "Reportar", icon: "flag" },
    { to: "/worker/comunicacion", label: "Chat / Video", icon: "message" },
    { to: "/worker/notificaciones", label: "Alertas", icon: "mail" },
    { to: "/worker/ayuda", label: "Ayuda", icon: "help" },
  ];
}
