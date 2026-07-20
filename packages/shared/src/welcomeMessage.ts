import { ROLE_LABEL, type AppUser, type UserRole } from "./types";

export interface WelcomeContent {
  titulo: string;
  saludo: string;
  mensaje: string;
  puntos: string[];
  cierre: string;
}

const WELCOME_BY_ROLE: Record<UserRole, Omit<WelcomeContent, "saludo">> = {
  super_admin: {
    titulo: "Bienvenido a SPE Master",
    mensaje:
      "Lideras la plataforma que conecta equipos, eventos y operación en tiempo real. Tu visión mantiene el estándar de excelencia en cada despliegue.",
    puntos: [
      "Supervisa la salud general de la plataforma y los administradores.",
      "Promueve buenas prácticas de seguridad, datos y cumplimiento.",
      "Recuerda: cada evento exitoso comienza con una base sólida.",
    ],
    cierre: "Confiamos en tu criterio. Siempre esperamos lo mejor de ti.",
  },
  administrador: {
    titulo: "Bienvenido, administrador",
    mensaje:
      "Eres el eje de la operación: configuras eventos, sitios, turnos y equipos. Tu liderazgo define la experiencia de cada persona en campo.",
    puntos: [
      "Completa la configuración del evento antes de abrir turnos.",
      "Invita al personal y asigna turnos con claridad de sitio y horario.",
      "Supervisa entradas, geocerca y reportes desde el panel en vivo.",
      "Comunica la temática laboral y las reglas del evento a tu equipo.",
    ],
    cierre: "Gracias por liderar con orden y humanidad. Siempre esperamos lo mejor de ti.",
  },
  supervisor_sitio: {
    titulo: "Bienvenido, supervisor de sitio",
    mensaje:
      "Eres los ojos y la voz en terreno. Tu presencia garantiza que cada función se cumpla con calidad, puntualidad y seguridad.",
    puntos: [
      "Verifica que el personal marque entrada con QR en el sitio asignado.",
      "Atiende alertas de geocerca y reportes con prontitud.",
      "Refuerza la temática laboral y el comportamiento profesional en el área.",
      "Coordina con el administrador cualquier novedad operativa.",
    ],
    cierre: "Tu liderazgo en sitio marca la diferencia. Siempre esperamos lo mejor de ti.",
  },
  trabajador: {
    titulo: "¡Bienvenido al equipo!",
    mensaje:
      "Formas parte de una operación donde cada persona cuenta. Tu puntualidad, actitud y compromiso hacen posible un evento impecable.",
    puntos: [
      "Confirma tus turnos y llega a tiempo al sitio indicado.",
      "Marca entrada escaneando el QR y permanece dentro del área asignada.",
      "Si te mueves, tienes un retraso o un incidente, repórtalo desde la app.",
      "Sigue la temática laboral y las indicaciones de tu supervisor.",
    ],
    cierre: "Estamos orgullosos de tenerte. Siempre esperamos lo mejor de ti.",
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
    // localStorage no disponible (modo privado, etc.)
  }
}
