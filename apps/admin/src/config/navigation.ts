import type { UserRole } from "@spe/shared";
import {
  puedeConfigurarIntegraciones,
  puedeGestionarConfiguracion,
  puedeGestionarCuentas,
  puedeGestionarPersonal,
  puedeGestionarQr,
  puedeVerMapaEnVivo,
  puedeVerNomina,
  puedeVerReportesTrabajadores,
} from "@spe/shared";

export interface NavLinkItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
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
        const gate = gates[item.to];
        return gate ? gate(role) : true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

const ADMIN_GATES: Record<string, (r: UserRole) => boolean> = {
  "/personal": can.personal,
  "/cuentas": can.cuentas,
  "/clientes": can.personal,
  "/facturacion": can.personal,
  "/inventario": can.personal,
  "/qr-sitios": can.qr,
  "/mapa": can.mapa,
  "/informes": can.reportes,
  "/reportes": can.reportes,
  "/nomina": can.nomina,
  "/configuracion": can.config,
  "/integraciones": can.apis,
};

export function getAdminNavSections(role: UserRole): NavSection[] {
  const sections: NavSection[] = [
    {
      id: "inicio",
      title: "Inicio",
      items: [{ to: "/panel", label: "Resumen", icon: "grid", end: true }],
    },
    {
      id: "operacion",
      title: "Operación",
      items: [
        { to: "/turnos", label: "Turnos", icon: "calendar" },
        { to: "/mapa", label: "Mapa en vivo", icon: "map" },
        { to: "/qr-sitios", label: "QR y sitios", icon: "qr" },
        { to: "/supervision", label: "Supervisión", icon: "eye" },
        { to: "/comunicacion", label: "Comunicación", icon: "mail" },
        { to: "/informes", label: "Informes", icon: "chart" },
        { to: "/reportes", label: "Reportes", icon: "flag" },
      ],
    },
    {
      id: "equipo",
      title: "Equipo",
      items: [
        { to: "/personal", label: "Personal", icon: "users" },
        { to: "/cuentas", label: "Cuentas", icon: "mail" },
        { to: "/nomina", label: "Nómina", icon: "wallet" },
      ],
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
        { to: "/configuracion", label: "Configuración", icon: "settings" },
        {
          to: "/integraciones",
          label: puedeConfigurarIntegraciones(role) ? "APIs" : "Integraciones",
          icon: "plug",
        },
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
    { to: "/worker/comunicacion", label: "Chat", icon: "mail" },
    { to: "/worker/notificaciones", label: "Alertas", icon: "mail" },
    { to: "/worker/ayuda", label: "Ayuda", icon: "help" },
  ];
}
