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
    titulo: "Bienvenido, CEO",
    mensaje:
      "Lideras la visión del negocio. Desde aquí creas el equipo administrativo y defines quién opera cada área.",
    puntos: [
      "Crea cuentas de Administrador, Recursos Humanos y Contador desde Equipo.",
      "Define roles y puestos para que cada persona vea solo lo que necesita.",
      "Delega la operación diaria sin perder el control estratégico.",
    ],
    cierre: "Tu criterio guía la organización. Siempre esperamos lo mejor de ti.",
  },
  master_app: {
    titulo: "Bienvenido a Master App",
    mensaje:
      "Gestionas la plataforma SPE: cuentas, roles, auditoría e informes globales. Eres el punto de partida técnico del sistema.",
    puntos: [
      "Crea las cuentas iniciales del equipo administrativo.",
      "Importa plantillas de puestos y permisos desde Roles.",
      "Supervisa la salud general de la plataforma.",
    ],
    cierre: "Confiamos en tu criterio técnico y operativo.",
  },
  super_admin: {
    titulo: "Bienvenido a Master App",
    mensaje:
      "Gestionas la plataforma SPE: cuentas, roles, auditoría e informes globales.",
    puntos: [
      "Crea las cuentas iniciales del equipo administrativo.",
      "Importa plantillas de puestos desde Roles.",
    ],
    cierre: "Confiamos en tu criterio.",
  },
  administrador: {
    titulo: "Bienvenido, administrador operativo",
    mensaje:
      "Eres el eje de la operación: configuras eventos, sitios, turnos y equipos. Tu liderazgo define la experiencia en campo.",
    puntos: [
      "Completa la configuración del evento antes de abrir turnos.",
      "Registra personal y asigna supervisores con claridad.",
      "Supervisa entradas, geocerca y reportes desde el panel en vivo.",
    ],
    cierre: "Gracias por liderar con orden y humanidad.",
  },
  recursos_humanos: {
    titulo: "Bienvenido, Recursos Humanos",
    mensaje:
      "Cuidas el talento: altas, cuentas, turnos e invitaciones. Tu trabajo conecta a las personas con la operación.",
    puntos: [
      "Registra trabajadores y supervisores con sus credenciales.",
      "Gestiona invitaciones y accesos del equipo.",
      "Coordina con administración cualquier novedad de personal.",
    ],
    cierre: "Tu trabajo humano marca la diferencia en cada evento.",
  },
  contador: {
    titulo: "Bienvenido, Contador",
    mensaje:
      "Supervisas la parte financiera: nómina, facturación, clientes e inventario. Tu precisión sostiene la operación.",
    puntos: [
      "Revisa y calcula nómina al cierre del evento.",
      "Consulta facturación, cartera e inventario.",
      "Exporta informes para contabilidad y cumplimiento.",
    ],
    cierre: "Gracias por el rigor y la claridad en los números.",
  },
  supervisor_sitio: {
    titulo: "Bienvenido, supervisor de campo",
    mensaje:
      "Eres los ojos y la voz en terreno. Tu presencia garantiza calidad, puntualidad y seguridad en el sitio.",
    puntos: [
      "Verifica que el personal marque entrada con QR.",
      "Atiende alertas de geocerca y reportes con prontitud.",
      "Registra empleados de campo cuando lo necesites.",
    ],
    cierre: "Tu liderazgo en sitio marca la diferencia.",
  },
  trabajador: {
    titulo: "¡Bienvenido al equipo!",
    mensaje:
      "Formas parte de una operación donde cada persona cuenta. Tu puntualidad y compromiso hacen posible un evento impecable.",
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
