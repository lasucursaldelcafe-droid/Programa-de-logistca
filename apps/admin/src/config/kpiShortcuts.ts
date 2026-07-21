import type { UserRole } from "@spe/shared";
import { esRolMaster } from "@spe/shared";

/** Claves de KPI del resumen operativo. */
export type KpiShortcutKey =
  | "workersTotal"
  | "workersEnSitio"
  | "turnosPendientes"
  | "jornadasActivas"
  | "alertasGeocerca"
  | "nominaPendiente"
  | "turnosConfirmados"
  | "jornadasCerradas"
  | "nominaPagada"
  | "cuentasSinActivar"
  | "eventos"
  | "reportesAbiertos"
  | "equipoAdmin"
  | "personalCampo";

export interface QuickActionDef {
  id: string;
  label: string;
  description?: string;
  /** Ruta relativa (con query opcional). */
  to: string;
  primary?: boolean;
}

export interface KpiShortcutDef {
  key: KpiShortcutKey;
  title: string;
  hint: string;
  /** Acciones rápidas según consola (admin vs master). */
  actions: (ctx: { role: UserRole; eventId?: string }) => QuickActionDef[];
}

function baseForRole(role: UserRole): string {
  return esRolMaster(role) ? "/master" : "";
}

function withEvent(path: string, eventId?: string): string {
  if (!eventId) return path;
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}evento=${encodeURIComponent(eventId)}`;
}

export const KPI_SHORTCUTS: Record<KpiShortcutKey, KpiShortcutDef> = {
  workersTotal: {
    key: "workersTotal",
    title: "Personal registrado",
    hint: "Ver el equipo, dar de alta a alguien o revisar cuentas de acceso.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "personal",
          label: "Abrir personal",
          description: "Lista completa del equipo del evento",
          to: withEvent(`${b}/personal`, eventId),
          primary: true,
        },
        {
          id: "nuevo",
          label: "Alta rápida",
          description: "Registrar una persona nueva",
          to: withEvent(`${b}/personal?nuevo=1`, eventId),
        },
        {
          id: "cuentas",
          label: "Cuentas e invitaciones",
          to: `${b}/cuentas`,
        },
      ];
    },
  },
  workersEnSitio: {
    key: "workersEnSitio",
    title: "Personal en sitio",
    hint: "Quién tiene jornada activa ahora. Abre el mapa o la supervisión.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "supervision",
          label: "Mapa y supervisión",
          description: "Ubicación GPS en vivo",
          to: withEvent(
            esRolMaster(role) ? `${b}/trabajadores` : `${b}/operacion?tab=supervision`,
            eventId,
          ),
          primary: true,
        },
        {
          id: "turnos",
          label: "Ver turnos del día",
          to: withEvent(`${b}/turnos?estado=confirmado`, eventId),
        },
      ];
    },
  },
  turnosPendientes: {
    key: "turnosPendientes",
    title: "Turnos pendientes",
    hint: "Turnos aún sin aceptar. Asigna uno nuevo o filtra los pendientes.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "lista",
          label: "Ver pendientes",
          description: "Lista filtrada por estado pendiente",
          to: withEvent(`${b}/turnos?estado=pendiente`, eventId),
          primary: true,
        },
        {
          id: "nuevo",
          label: "Asignar turno",
          description: "Formulario rápido de asignación",
          to: withEvent(`${b}/turnos?nuevo=1`, eventId),
        },
      ];
    },
  },
  jornadasActivas: {
    key: "jornadasActivas",
    title: "Jornadas GPS activas",
    hint: "Personal con llegada marcada y GPS en curso.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "mapa",
          label: "Abrir mapa en vivo",
          to: withEvent(
            esRolMaster(role) ? `${b}/trabajadores` : `${b}/operacion?tab=supervision`,
            eventId,
          ),
          primary: true,
        },
        {
          id: "supervision",
          label: "Panel de supervisión",
          to: withEvent(
            esRolMaster(role) ? `${b}/supervision` : `${b}/operacion?tab=supervision`,
            eventId,
          ),
        },
      ];
    },
  },
  alertasGeocerca: {
    key: "alertasGeocerca",
    title: "Alertas de geocerca",
    hint: "Salidas del área del sitio. Revisa el mapa y los reportes.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "mapa",
          label: "Ver en el mapa",
          to: withEvent(
            esRolMaster(role) ? `${b}/trabajadores` : `${b}/operacion?tab=supervision`,
            eventId,
          ),
          primary: true,
        },
        {
          id: "reportes",
          label: "Reportes de campo",
          to: `${b}/reportes`,
        },
      ];
    },
  },
  nominaPendiente: {
    key: "nominaPendiente",
    title: "Nómina pendiente",
    hint: "Pagos por liquidar. Filtra pendientes o calcula desde jornadas cerradas.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "pendiente",
          label: "Ver pendientes de pago",
          to: withEvent(`${b}/nomina?estado=pendiente`, eventId),
          primary: true,
        },
        {
          id: "nomina",
          label: "Ir a nómina",
          to: withEvent(`${b}/nomina`, eventId),
        },
      ];
    },
  },
  turnosConfirmados: {
    key: "turnosConfirmados",
    title: "Turnos confirmados",
    hint: "Personal que ya aceptó el trabajo.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "lista",
          label: "Ver confirmados",
          to: withEvent(`${b}/turnos?estado=confirmado`, eventId),
          primary: true,
        },
        {
          id: "nuevo",
          label: "Asignar otro turno",
          to: withEvent(`${b}/turnos?nuevo=1`, eventId),
        },
      ];
    },
  },
  jornadasCerradas: {
    key: "jornadasCerradas",
    title: "Jornadas cerradas",
    hint: "Salidas registradas. Útil para liquidar nómina.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "nomina",
          label: "Calcular nómina",
          to: withEvent(`${b}/nomina?estado=pendiente`, eventId),
          primary: true,
        },
        {
          id: "supervision",
          label: "Historial en supervisión",
          to: withEvent(
            esRolMaster(role) ? `${b}/supervision` : `${b}/operacion?tab=supervision`,
            eventId,
          ),
        },
      ];
    },
  },
  nominaPagada: {
    key: "nominaPagada",
    title: "Nómina pagada",
    hint: "Pagos ya marcados como pagados.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "pagado",
          label: "Ver pagos",
          to: withEvent(`${b}/nomina?estado=pagado`, eventId),
          primary: true,
        },
        {
          id: "nomina",
          label: "Ir a nómina",
          to: `${b}/nomina`,
        },
      ];
    },
  },
  cuentasSinActivar: {
    key: "cuentasSinActivar",
    title: "Sin cuenta activa",
    hint: "Personal sin acceso o con invitación pendiente.",
    actions: ({ role, eventId }) => {
      const b = baseForRole(role);
      return [
        {
          id: "cuentas",
          label: "Gestionar invitaciones",
          to: `${b}/cuentas`,
          primary: true,
        },
        {
          id: "personal",
          label: "Activar desde personal",
          to: withEvent(`${b}/personal?filtro=sin_cuenta`, eventId),
        },
      ];
    },
  },
  eventos: {
    key: "eventos",
    title: "Eventos",
    hint: "Crear o ajustar eventos, sitios y reglas.",
    actions: ({ role }) => {
      const b = baseForRole(role);
      return [
        {
          id: "config",
          label: "Configurar evento",
          to: `${b}/configuracion`,
          primary: true,
        },
        {
          id: "operacion",
          label: "Operación del evento",
          to: esRolMaster(role) ? `${b}/operacion` : `${b}/operacion`,
        },
      ];
    },
  },
  reportesAbiertos: {
    key: "reportesAbiertos",
    title: "Reportes abiertos",
    hint: "Novedades de campo pendientes de resolver.",
    actions: ({ role }) => {
      const b = baseForRole(role);
      return [
        {
          id: "reportes",
          label: "Abrir reportes",
          to: `${b}/reportes`,
          primary: true,
        },
        {
          id: "chat",
          label: "Escribir al equipo",
          to: `${b}/comunicacion`,
        },
      ];
    },
  },
  equipoAdmin: {
    key: "equipoAdmin",
    title: "Equipo administrativo",
    hint: "Cuentas de oficina: administrador, RR. HH., contabilidad.",
    actions: () => [
      {
        id: "admin",
        label: "Crear / editar cuentas",
        to: "/master/administradores",
        primary: true,
      },
      {
        id: "roles",
        label: "Roles y puestos",
        to: "/master/roles",
      },
    ],
  },
  personalCampo: {
    key: "personalCampo",
    title: "Personal de campo",
    hint: "Empleados y supervisores en sitio.",
    actions: () => [
      {
        id: "personal",
        label: "Gestionar personal",
        to: "/master/personal?nuevo=1",
        primary: true,
      },
      {
        id: "vivo",
        label: "Ver en vivo",
        to: "/master/trabajadores",
      },
    ],
  },
};
