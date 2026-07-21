import { ROLE_LABEL, type AppUser, type UserRole } from "./types";

export interface WelcomeContent {
  titulo: string;
  saludo: string;
  mensaje: string;
  puntos: string[];
  /** Frase motivadora de buen desarrollo (cambia por sesión). */
  motivacion: string;
  cierre: string;
}

/** Frases transversales: buen desarrollo profesional y humano. */
const MOTIVACIONES_BUEN_DESARROLLO = [
  "El buen desarrollo se construye turno a turno: con respeto, claridad y constancia.",
  "Hoy puedes dejar el evento un poco mejor de como lo encontraste. Eso también es crecer.",
  "Cuidar a las personas y a la operación es la misma meta: un desarrollo sólido.",
  "La excelencia no es un acto aislado: es el hábito de hacer bien lo cotidiano.",
  "Cuando cada rol entiende su aporte, el equipo avanza con confianza.",
  "Motívate a desarrollar talento, procesos y confianza — no solo a “sacar el día”.",
  "Un buen desarrollo se nota en la calma del sitio, no solo en los números.",
  "Tu trabajo de hoy forma la reputación de mañana. Hazlo con orgullo.",
];

export function getSessionMotivation(seed: string): string {
  let hash = 0;
  const key = `${seed}:${new Date().toDateString()}`;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return MOTIVACIONES_BUEN_DESARROLLO[hash % MOTIVACIONES_BUEN_DESARROLLO.length]!;
}

const WELCOME_BY_ROLE: Record<UserRole, Omit<WelcomeContent, "saludo" | "motivacion">> = {
  ceo: {
    titulo: "Bienvenida a tu sesión de dirección",
    mensaje:
      "Desde la dirección general ves la empresa completa: personas, eventos, dinero y operación. Esta sesión es para impulsar el buen desarrollo del negocio y del equipo — sin trabajar como personal en sitio.",
    puntos: [
      "Mirada estratégica: revisa eventos activos, personal y señales de la operación.",
      "Equipo: crea o ajusta roles (Operaciones, Personas, Finanzas) cuando haga falta.",
      "Desarrollo: usa reportes e informes para mejorar procesos, no solo para controlar.",
    ],
    cierre: "Lidera con propósito: cada decisión clara acerca a un mejor desarrollo colectivo.",
  },
  master_app: {
    titulo: "Bienvenida a tu sesión de plataforma",
    mensaje:
      "Como dirección técnica cuidas que la herramienta y las cuentas estén listas para que todos trabajen bien. Hoy también es un día para el buen desarrollo del sistema y del equipo.",
    puntos: [
      "Deja el equipo administrativo listo (Operaciones, Personas, Finanzas).",
      "Revisa roles, auditoría e informes para sostener un crecimiento ordenado.",
      "Acompaña la operación en vivo cuando haga falta — la plataforma sirve a las personas.",
    ],
    cierre: "La mejor plataforma es la que hace más fácil el buen trabajo de todos.",
  },
  super_admin: {
    titulo: "Bienvenida a tu sesión de plataforma",
    mensaje:
      "Gestionas la base técnica: cuentas, roles e informes. Usa esta sesión para fortalecer el buen desarrollo de la organización.",
    puntos: [
      "Mantén claras las cuentas y los roles.",
      "Revisa auditoría e informes globales.",
      "Facilita que cada área avance sin fricción.",
    ],
    cierre: "Tu criterio técnico sostiene el desarrollo del resto del equipo.",
  },
  administrador: {
    titulo: "Bienvenida a tu sesión de operaciones",
    mensaje:
      "Diriges el evento de punta a punta: preparación, equipo en sitio, supervisión y cierre. Esta sesión es para sacar un evento bien hecho y ayudar al desarrollo del personal.",
    puntos: [
      "Prepara el evento (sitios, códigos de entrada, reglas) antes de abrir turnos.",
      "Registra y orienta al personal en sitio y a quien coordina en el lugar.",
      "Supervisa entradas, área del sitio y novedades con calma y rigor.",
    ],
    cierre: "Operar con orden y humanidad es la mejor forma de desarrollar confianza.",
  },
  recursos_humanos: {
    titulo: "Bienvenida a tu sesión de personas",
    mensaje:
      "Tu foco es el equipo: altas, accesos y turnos. Desde Personas impulsas el buen desarrollo de quienes hacen el evento posible.",
    puntos: [
      "Da de alta a quien coordina en sitio y al personal del evento con datos claros.",
      "Cuida invitaciones y accesos: un buen inicio evita fricción después.",
      "Coordina turnos y comunicación para que nadie se sienta perdido.",
    ],
    cierre: "Desarrollar personas es el corazón de cada evento memorable.",
  },
  contador: {
    titulo: "Bienvenida a tu sesión de finanzas",
    mensaje:
      "Cierras el ciclo económico: nómina, clientes, facturación e inventario. Unos números claros también son buen desarrollo organizacional.",
    puntos: [
      "Revisa nómina al cierre con datos limpios de la operación.",
      "Mantén cartera, facturación e inventario al día.",
      "Usa informes para decidir con evidencia, no a ciegas.",
    ],
    cierre: "La claridad financiera protege el desarrollo sostenible del negocio.",
  },
  supervisor_sitio: {
    titulo: "Bienvenida a tu sesión en sitio",
    mensaje:
      "Coordina el lugar en vivo: mapa, turnos, códigos de entrada y novedades. Tu liderazgo diario desarrolla al equipo que está en el evento.",
    puntos: [
      "Asegura que el personal marque entrada con el código del sitio.",
      "Atiende a tiempo si alguien sale del área del sitio o reporta un problema.",
      "Orienta y registra personal en sitio cuando la operación lo pida.",
    ],
    cierre: "Un sitio bien cuidado es la escuela práctica del buen desarrollo.",
  },
  trabajador: {
    titulo: "¡Bienvenida a tu sesión en el evento!",
    mensaje:
      "Tu app es para el día a día en sitio: turnos, marcar entrada, reportar y conversar con el equipo. Cada turno bien hecho construye tu desarrollo profesional.",
    puntos: [
      "Confirma tus turnos y llega a tiempo al sitio indicado.",
      "Marca entrada escaneando el código del sitio.",
      "Si algo ocurre, repórtalo desde la app: tu voz mejora la operación.",
    ],
    cierre: "Estamos contigo: tu crecimiento y el del evento van de la mano.",
  },
};

export function getWelcomeContent(user: Pick<AppUser, "uid" | "nombre" | "role">): WelcomeContent {
  const base = WELCOME_BY_ROLE[user.role];
  const primerNombre = user.nombre.trim().split(/\s+/)[0] ?? user.nombre;
  return {
    ...base,
    saludo: `Hola, ${primerNombre}`,
    motivacion: getSessionMotivation(user.uid || user.nombre),
  };
}

export function getWelcomeRoleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}

/** Una vez por pestaña/sesión de navegador (cada nuevo login o pestaña nueva vuelve a mostrar). */
const SESSION_PREFIX = "spe-bienvenida-sesion:";

export function hasSeenWelcome(uid: string): boolean {
  try {
    return sessionStorage.getItem(`${SESSION_PREFIX}${uid}`) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(uid: string): void {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${uid}`, "1");
    // Limpia el flag antiguo “solo la primera vez en la vida”
    localStorage.removeItem(`spe-bienvenida-vista:${uid}`);
  } catch {
    // almacenamiento no disponible
  }
}
