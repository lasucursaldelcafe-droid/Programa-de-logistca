/**
 * Glosario / tutorial in-app: explica qué hace cada cosa.
 * Vive separado de las pantallas de herramientas.
 */

export type GlossaryCategoryId =
  | "consolas"
  | "roles"
  | "direccion"
  | "operacion"
  | "empleado"
  | "flujo";

export interface GlossaryEntry {
  id: string;
  category: GlossaryCategoryId;
  title: string;
  summary: string;
  details: string[];
  /** Ruta opcional a la herramienta (solo enlace; el glosario no es la herramienta). */
  toolPath?: string;
  keywords?: string[];
}

export const GLOSSARY_CATEGORIES: {
  id: GlossaryCategoryId;
  title: string;
  description: string;
}[] = [
  {
    id: "consolas",
    title: "Las 3 consolas",
    description: "Dónde entra cada tipo de usuario.",
  },
  {
    id: "roles",
    title: "Roles",
    description: "Quién es quién y qué puede hacer.",
  },
  {
    id: "direccion",
    title: "Dirección (Master)",
    description: "Pantallas de la consola de dirección.",
  },
  {
    id: "operacion",
    title: "Operación del evento",
    description: "Herramientas del día a día del evento.",
  },
  {
    id: "empleado",
    title: "App de empleado",
    description: "Qué ve el personal de campo.",
  },
  {
    id: "flujo",
    title: "Flujo típico",
    description: "Orden recomendado de un evento de punta a punta.",
  },
];

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: "consola-master",
    category: "consolas",
    title: "Master / Dirección",
    summary: "Consola de CEO y Master App para dirección, roles, equipo en vivo e informes globales.",
    details: [
      "Entras por /master con rol CEO o Master App.",
      "Desde aquí también operas la empresa sin saltar a otra consola.",
      "No es la app de campo: el CEO no marca entrada como empleado.",
    ],
    toolPath: "/master",
    keywords: ["ceo", "dirección", "master"],
  },
  {
    id: "consola-admin",
    category: "consolas",
    title: "Admin Console",
    summary: "Consola operativa: eventos, personal, turnos, mapa, nómina y negocio.",
    details: [
      "La usan Administrador, RH, Contabilidad y Supervisor.",
      "El CEO también puede usarla, pero en la consola unificada vive bajo /master/*.",
    ],
    toolPath: "/panel",
    keywords: ["admin", "panel", "operaciones"],
  },
  {
    id: "consola-worker",
    category: "consolas",
    title: "App Trabajador",
    summary: "App de campo solo para el rol Empleado: turnos, entrada QR/GPS, reportar y chat.",
    details: [
      "Ruta /worker.",
      "Un administrador o el CEO no entran aquí como empleados.",
    ],
    toolPath: "/worker",
    keywords: ["empleado", "campo", "worker"],
  },
  {
    id: "rol-ceo",
    category: "roles",
    title: "CEO",
    summary: "Dirección general: toda la empresa excepto actuar como empleado de campo.",
    details: [
      "Puede crear, editar y eliminar personal, eventos, roles y perfiles.",
      "Ve trabajadores en vivo, chat, informes y auditoría.",
      "No marca su propia entrada ni usa «mis turnos» de empleado.",
    ],
    keywords: ["dirección", "dueño"],
  },
  {
    id: "rol-admin",
    category: "roles",
    title: "Administrador",
    summary: "Opera el evento de punta a punta y puede crear cuentas de RH y Contabilidad.",
    details: [
      "Configura eventos, personal, turnos, QR, mapa, reportes y nómina según permisos.",
      "No gestiona la consola Master (roles globales / auditoría).",
    ],
  },
  {
    id: "rol-rh",
    category: "roles",
    title: "Recursos Humanos",
    summary: "Personal, invitaciones, turnos, comunicación y reportes de campo.",
    details: ["No crea eventos, no cierra nómina ni factura, no configura APIs."],
  },
  {
    id: "rol-contador",
    category: "roles",
    title: "Contabilidad",
    summary: "Nómina, clientes, facturación, inventario e informes económicos.",
    details: ["No gestiona personal de campo ni sitios QR."],
  },
  {
    id: "rol-supervisor",
    category: "roles",
    title: "Supervisor de sitio",
    summary: "Mapa, turnos, QR y reportes; puede dar de alta empleados de campo.",
    details: ["No configura eventos ni crea cuentas de oficina."],
  },
  {
    id: "rol-empleado",
    category: "roles",
    title: "Empleado",
    summary: "Solo app de campo: turnos propios, entrada y reportes.",
    details: ["No entra a Admin ni Master."],
  },
  {
    id: "mod-resumen-dir",
    category: "direccion",
    title: "Resumen dirección",
    summary: "Vista global de la plataforma: atajos a operación y métricas de dirección.",
    details: ["Punto de partida del CEO al iniciar sesión."],
    toolPath: "/master",
    keywords: ["inicio", "home"],
  },
  {
    id: "mod-equipo-vivo",
    category: "direccion",
    title: "Equipo en vivo",
    summary: "Qué hace cada persona de campo ahora: jornada, GPS y turnos.",
    details: [
      "Puedes llamar al celular o abrir el chat de la app.",
      "Sirve para supervisión remota sin mezclarse con la ficha de nómina.",
    ],
    toolPath: "/master/trabajadores",
    keywords: ["gps", "actividad", "trabadores"],
  },
  {
    id: "mod-perfiles-roles",
    category: "direccion",
    title: "Perfiles y roles",
    summary: "Crear, cambiar rol o eliminar cuentas de oficina y de campo (excepto raíces).",
    details: [
      "Aquí no se edita la ficha laboral completa: eso es Equipo del evento.",
      "Las cuentas CEO / Master App no se eliminan desde aquí.",
    ],
    toolPath: "/master/administradores",
    keywords: ["cuentas", "eliminar perfil"],
  },
  {
    id: "mod-plantillas",
    category: "direccion",
    title: "Plantillas de puestos",
    summary: "Roles personalizados (permisos) que luego se asignan al personal.",
    details: [
      "Puedes importar plantillas de ejemplo, editarlas o eliminarlas.",
      "Al eliminar un rol custom, quienes lo tenían vuelven a permisos del rol base.",
    ],
    toolPath: "/master/roles",
    keywords: ["custom roles", "puestos"],
  },
  {
    id: "mod-auditoria",
    category: "direccion",
    title: "Auditoría",
    summary: "Registro de movimientos sensibles (por ejemplo cambios de nómina o borrados).",
    details: ["Solo dirección. No es el chat ni los reportes de campo."],
    toolPath: "/master/auditoria",
  },
  {
    id: "mod-config-evento",
    category: "operacion",
    title: "Crear / preparar evento",
    summary: "Alta del evento: sitios GPS, tarifas, QR, temática y reglas.",
    details: [
      "Paso 1 del flujo operativo.",
      "Desde aquí también se puede eliminar un evento si no hay jornadas abiertas.",
    ],
    toolPath: "/configuracion",
    keywords: ["configuración", "evento"],
  },
  {
    id: "mod-personal",
    category: "operacion",
    title: "Equipo del evento",
    summary: "Fichas de personal: crear, editar, habilitar, eliminar e importar CSV.",
    details: [
      "Es la herramienta de RH/operación, no el glosario.",
      "Puedes activar la cuenta (correo + cédula) desde cada ficha.",
    ],
    toolPath: "/personal",
    keywords: ["trabajadores", "empleados"],
  },
  {
    id: "mod-invitaciones",
    category: "operacion",
    title: "Invitaciones",
    summary: "Envío de códigos para que el personal active su acceso.",
    details: ["Complementa Equipo del evento; no sustituye la ficha."],
    toolPath: "/cuentas",
    keywords: ["cuentas", "activar"],
  },
  {
    id: "mod-dashboard-evento",
    category: "operacion",
    title: "Dashboard del evento",
    summary: "Centro del evento en curso: turnos, equipo, supervisión y estado.",
    details: ["Úsalo durante el evento, no para leer tutoriales largos."],
    toolPath: "/operacion",
    keywords: ["operación"],
  },
  {
    id: "mod-turnos",
    category: "operacion",
    title: "Turnos",
    summary: "Asigna persona + sitio + horario. El empleado ve el turno en su app.",
    details: ["Sin turno no hay lugar GPS válido para marcar entrada ese día."],
    toolPath: "/turnos",
  },
  {
    id: "mod-qr",
    category: "operacion",
    title: "Códigos de entrada y sitios",
    summary: "QR por sitio y geocerca (radio GPS).",
    details: ["El empleado escanea o usa «Ya estoy aquí» dentro del radio."],
    toolPath: "/qr-sitios",
    keywords: ["geocerca", "sitio"],
  },
  {
    id: "mod-supervision",
    category: "operacion",
    title: "Supervisión y mapa",
    summary: "GPS en vivo y alertas de geocerca mientras corre el evento.",
    details: ["Herramienta de monitoreo; las explicaciones largas están en este glosario."],
    toolPath: "/supervision",
    keywords: ["mapa"],
  },
  {
    id: "mod-reportes",
    category: "operacion",
    title: "Novedades de campo",
    summary: "Incidencias que envían los empleados; revisar y resolver.",
    details: ["No confundir con Informes (exportaciones) ni con Notificaciones push."],
    toolPath: "/reportes",
    keywords: ["incidencias"],
  },
  {
    id: "mod-comunicacion",
    category: "operacion",
    title: "Chat y videollamadas",
    summary: "Canales del evento, empleados, supervisores y mensajes directos.",
    details: ["El CEO puede unirse a las conversaciones desde Dirección."],
    toolPath: "/comunicacion",
    keywords: ["chat", "video"],
  },
  {
    id: "mod-nomina",
    category: "operacion",
    title: "Nómina",
    summary: "Calcula y exporta pagos según jornadas y tarifas del perfil.",
    details: ["Depende de jornadas cerradas y tarifas configuradas en el evento."],
    toolPath: "/nomina",
  },
  {
    id: "mod-negocio",
    category: "operacion",
    title: "Clientes e inventario",
    summary: "Clientes, facturación e inventario del negocio del evento.",
    details: ["Módulo comercial; independiente del GPS de campo."],
    toolPath: "/negocio",
  },
  {
    id: "mod-integraciones",
    category: "operacion",
    title: "APIs e integraciones",
    summary: "Conectar servicios externos (correo, hojas, mapas, etc.).",
    details: [
      "La configuración técnica vive aquí.",
      "Las explicaciones de «qué es cada integración» también se describen en este glosario / docs.",
    ],
    toolPath: "/integraciones",
    keywords: ["apis", "firebase", "gmail"],
  },
  {
    id: "mod-notificaciones",
    category: "operacion",
    title: "Notificaciones",
    summary: "Alertas in-app y push a celular/PC.",
    details: ["No es el chat; son avisos del sistema o de turnos."],
    toolPath: "/notificaciones",
    keywords: ["push", "alertas"],
  },
  {
    id: "emp-inicio",
    category: "empleado",
    title: "Inicio (empleado)",
    summary: "Resumen del turno y acciones rápidas del día.",
    details: ["Solo rol Empleado en /worker."],
    toolPath: "/worker",
  },
  {
    id: "emp-turnos",
    category: "empleado",
    title: "Mis turnos",
    summary: "Ver y aceptar turnos asignados por administración.",
    details: ["Sin aceptar, el flujo de entrada puede quedar incompleto."],
    toolPath: "/worker/turnos",
  },
  {
    id: "emp-entrada",
    category: "empleado",
    title: "Escanear QR / Ya estoy aquí",
    summary: "Activa la jornada validando GPS o QR del sitio del turno.",
    details: ["El GPS es obligatorio: debes estar dentro del radio del sitio."],
    toolPath: "/worker/entrada",
    keywords: ["marcar entrada", "jornada"],
  },
  {
    id: "emp-reportar",
    category: "empleado",
    title: "Reportar",
    summary: "Envía una novedad al supervisor o administración.",
    details: ["Aparece en Novedades de campo para quien opera el evento."],
    toolPath: "/worker/reportar",
  },
  {
    id: "flujo-evento",
    category: "flujo",
    title: "Orden recomendado de un evento",
    summary: "De la creación del evento al cierre de nómina.",
    details: [
      "1. Crear / preparar el evento (sitios, tarifas, QR).",
      "2. Registrar personal e invitaciones.",
      "3. Crear turnos (persona + sitio + horario).",
      "4. El empleado acepta y marca llegada.",
      "5. Supervisar mapa, reportes y chat.",
      "6. Cerrar con nómina e informes.",
      "7. Eliminar el evento solo si ya no hay jornadas abiertas.",
    ],
    keywords: ["pasos", "tutorial", "cómo empezar"],
  },
  {
    id: "busqueda-menu",
    category: "flujo",
    title: "Buscar opciones en el menú",
    summary: "Usa la barra «Buscar opciones» del menú lateral o Ctrl+K.",
    details: [
      "Filtra solo las pantallas a las que tu rol tiene acceso.",
      "El glosario (esta página) explica el significado; la búsqueda del menú te lleva a la herramienta.",
    ],
    keywords: ["buscar", "ctrl k", "menú"],
  },
];

export function filterGlossaryEntries(query: string, category?: GlossaryCategoryId | ""): GlossaryEntry[] {
  const q = query
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  return GLOSSARY_ENTRIES.filter((entry) => {
    if (category && entry.category !== category) return false;
    if (!q) return true;
    const hay = [entry.title, entry.summary, ...(entry.details ?? []), ...(entry.keywords ?? [])]
      .join(" ")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
    return hay.includes(q);
  });
}
