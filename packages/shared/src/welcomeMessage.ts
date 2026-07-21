import { ROLE_LABEL, type AppUser, type UserRole } from "./types";

export interface WelcomeContent {
  titulo: string;
  saludo: string;
  mensaje: string;
  puntos: string[];
  cierre: string;
}

const WELCOME_BY_ROLE: Record<UserRole, Omit<WelcomeContent, "saludo">> = {
  ceo: {
    titulo: "Bienvenido, CEO — Dirección general",
    mensaje:
      "Eres una de las dos cuentas raíz. Desde aquí creas el equipo administrativo; cada persona verá solo lo de su rol.",
    puntos: [
      "Ve a Equipo administrativo y crea Administrador, Recursos Humanos y Contabilidad.",
      "Define roles y puestos para acotar lo que ve cada persona.",
      "Delega la operación diaria al Administrador de operaciones.",
    ],
    cierre: "Tu criterio guía la organización.",
  },
  master_app: {
    titulo: "Bienvenido, Master App — Plataforma",
    mensaje:
      "Eres la otra cuenta raíz. Configuras la plataforma, roles e informes globales, y das de alta el primer equipo.",
    puntos: [
      "Crea las cuentas iniciales en Equipo administrativo.",
      "Importa plantillas de puestos desde Roles y puestos.",
      "Supervisa auditoría e informes globales.",
    ],
    cierre: "Confiamos en tu criterio técnico y operativo.",
  },
  super_admin: {
    titulo: "Bienvenido, Master App — Plataforma",
    mensaje:
      "Gestionas la plataforma: cuentas, roles, auditoría e informes globales.",
    puntos: [
      "Crea las cuentas iniciales del equipo administrativo.",
      "Importa plantillas de puestos desde Roles.",
    ],
    cierre: "Confiamos en tu criterio.",
  },
  administrador: {
    titulo: "Bienvenido, Administrador de operaciones",
    mensaje:
      "Diriges el evento: configuración, personal, supervisión y cierre. Puedes crear cuentas de RH y Contabilidad.",
    puntos: [
      "Completa la configuración del evento antes de abrir turnos.",
      "Registra personal de campo y asigna supervisores.",
      "Supervisa entradas, geocerca y reportes en vivo.",
    ],
    cierre: "Gracias por liderar con orden y humanidad.",
  },
  recursos_humanos: {
    titulo: "Bienvenido, Recursos Humanos",
    mensaje:
      "Gestionas altas, invitaciones y turnos del personal. No verás nómina ni configuración de eventos.",
    puntos: [
      "Registra supervisores y empleados de campo con sus credenciales.",
      "Gestiona invitaciones y accesos del equipo.",
      "Coordina turnos y comunicación con la operación.",
    ],
    cierre: "Tu trabajo humano marca la diferencia en cada evento.",
  },
  contador: {
    titulo: "Bienvenido, Contabilidad y finanzas",
    mensaje:
      "Tu menú es financiero: nómina, clientes, facturación e inventario. No creas personal ni eventos.",
    puntos: [
      "Revisa y calcula nómina al cierre del evento.",
      "Consulta facturación, cartera e inventario.",
      "Usa los informes para contabilidad y cumplimiento.",
    ],
    cierre: "Gracias por el rigor y la claridad en los números.",
  },
  supervisor_sitio: {
    titulo: "Bienvenido, Supervisor de campo",
    mensaje:
      "Coordina el sitio en vivo: mapa, turnos, QR y reportes. Puedes dar de alta empleados de campo.",
    puntos: [
      "Verifica que el personal marque entrada con QR.",
      "Atiende alertas de geocerca y reportes con prontitud.",
      "Registra empleados de campo cuando lo necesites.",
    ],
    cierre: "Tu liderazgo en sitio marca la diferencia.",
  },
  trabajador: {
    titulo: "¡Bienvenido, Empleado de campo!",
    mensaje:
      "Tu app es de campo: turnos, escanear QR, reportar y chat (general o empleados). No tienes acceso a la consola administrativa.",
    puntos: [
      "Confirma tus turnos y llega a tiempo al sitio indicado.",
      "Marca entrada escaneando el QR.",
      "Reporta novedades desde la app si algo ocurre.",
    ],
    cierre: "Estamos orgullosos de tenerte en el equipo.",
  },
};

export function getWelcomeContent(user: Pick<AppUser, "nombre" | "role">): WelcomeContent {
  const base = WELCOME_BY_ROLE[user.role];
  const primerNombre = user.nombre.trim().split(/\s+/)[0] ?? user.nombre;
  return {
    ...base,
    saludo: `Hola, ${primerNombre}`,
  };
}

export function getWelcomeRoleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}

const STORAGE_PREFIX = "spe-bienvenida-vista:";

export function hasSeenWelcome(uid: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${uid}`) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(uid: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${uid}`, "1");
  } catch {
    // localStorage no disponible
  }
}
