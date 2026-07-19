import {
  ROLE_ACCESS_MODE_LABEL,
  type CustomRoleBase,
  type RoleAccessMode,
  type SpePermission,
} from "./permissions";

export { ROLE_ACCESS_MODE_LABEL };

/** Plantilla de puesto predefinida (no persistida hasta importarla). */
export interface RoleTemplate {
  id: string;
  puesto: string;
  categoria: string;
  modoAcceso: RoleAccessMode;
  baseRole: CustomRoleBase;
  descripcion: string;
  permisos: SpePermission[];
}

const COORD_LOGISTICO_EDITOR: SpePermission[] = [
  "dashboard_operativo",
  "gestionar_turnos",
  "gestionar_qr",
  "ver_mapa_en_vivo",
  "ver_supervision",
  "enviar_emergencia",
  "ver_notificaciones",
  "ver_reportes_trabajadores",
  "usar_comunicacion",
  "ver_informes_evento",
];

const COORD_LOGISTICO_LECTURA: SpePermission[] = [
  "dashboard_operativo",
  "ver_mapa_en_vivo",
  "ver_supervision",
  "ver_notificaciones",
  "ver_reportes_trabajadores",
  "usar_comunicacion",
  "ver_informes_evento",
];

const SUPERVISOR_CAMPO_EDITOR: SpePermission[] = [
  "dashboard_operativo",
  "gestionar_personal",
  "gestionar_turnos",
  "gestionar_qr",
  "ver_mapa_en_vivo",
  "ver_supervision",
  "enviar_emergencia",
  "ver_notificaciones",
  "ver_nomina",
  "ver_reportes_trabajadores",
  "usar_comunicacion",
  "ver_informes_evento",
];

const SUPERVISOR_CAMPO_LECTURA: SpePermission[] = [
  "dashboard_operativo",
  "ver_mapa_en_vivo",
  "ver_supervision",
  "ver_notificaciones",
  "ver_nomina",
  "ver_reportes_trabajadores",
  "usar_comunicacion",
  "ver_informes_evento",
];

const TRABAJADOR_CAMPO: SpePermission[] = [
  "marcar_entrada",
  "reportar_supervisor",
  "ver_turnos_propio",
  "ver_nomina",
  "ver_notificaciones",
  "usar_comunicacion",
];

/** Catálogo de puestos de ejemplo para eventos y logística. */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "tpl-coord-log-editor",
    puesto: "Coordinador logístico",
    categoria: "Operación",
    modoAcceso: "editor",
    baseRole: "supervisor_sitio",
    descripcion: "Turnos, QR, mapa GPS, reportes e informes operativos.",
    permisos: COORD_LOGISTICO_EDITOR,
  },
  {
    id: "tpl-coord-log-lectura",
    puesto: "Coordinador logístico",
    categoria: "Operación",
    modoAcceso: "lectura",
    baseRole: "supervisor_sitio",
    descripcion: "Consulta operación en vivo sin modificar turnos ni QR.",
    permisos: COORD_LOGISTICO_LECTURA,
  },
  {
    id: "tpl-supervisor-campo-editor",
    puesto: "Supervisor de campo",
    categoria: "Operación",
    modoAcceso: "editor",
    baseRole: "supervisor_sitio",
    descripcion: "Personal, turnos, GPS y comunicación con el equipo.",
    permisos: SUPERVISOR_CAMPO_EDITOR,
  },
  {
    id: "tpl-supervisor-campo-lectura",
    puesto: "Supervisor de campo",
    categoria: "Operación",
    modoAcceso: "lectura",
    baseRole: "supervisor_sitio",
    descripcion: "Monitoreo y consulta sin gestionar personal ni turnos.",
    permisos: SUPERVISOR_CAMPO_LECTURA,
  },
  {
    id: "tpl-control-gps-lectura",
    puesto: "Control GPS / centinel",
    categoria: "Operación",
    modoAcceso: "lectura",
    baseRole: "supervisor_sitio",
    descripcion: "Mapa en vivo, supervisión y alertas — solo consulta.",
    permisos: [
      "dashboard_operativo",
      "ver_mapa_en_vivo",
      "ver_supervision",
      "ver_notificaciones",
      "ver_reportes_trabajadores",
    ],
  },
  {
    id: "tpl-nomina-editor",
    puesto: "Analista de nómina",
    categoria: "Nómina",
    modoAcceso: "editor",
    baseRole: "administrador",
    descripcion: "Calcula nómina, exporta y revisa informes de costos.",
    permisos: [
      "dashboard_operativo",
      "gestionar_nomina",
      "ver_nomina",
      "ver_informes_evento",
      "ver_notificaciones",
    ],
  },
  {
    id: "tpl-nomina-lectura",
    puesto: "Analista de nómina",
    categoria: "Nómina",
    modoAcceso: "lectura",
    baseRole: "administrador",
    descripcion: "Consulta nómina e informes de costos sin calcular pagos.",
    permisos: [
      "dashboard_operativo",
      "ver_nomina",
      "ver_informes_evento",
      "ver_notificaciones",
    ],
  },
  {
    id: "tpl-atencion-editor",
    puesto: "Atención al cliente e inventario",
    categoria: "Negocio",
    modoAcceso: "editor",
    baseRole: "supervisor_sitio",
    descripcion: "Clientes, facturación e inventario del evento.",
    permisos: [
      "dashboard_operativo",
      "gestionar_clientes",
      "gestionar_facturacion",
      "ver_inventario",
      "ver_notificaciones",
      "usar_comunicacion",
    ],
  },
  {
    id: "tpl-atencion-lectura",
    puesto: "Atención al cliente e inventario",
    categoria: "Negocio",
    modoAcceso: "lectura",
    baseRole: "supervisor_sitio",
    descripcion: "Consulta inventario y estado comercial.",
    permisos: [
      "dashboard_operativo",
      "ver_inventario",
      "ver_notificaciones",
      "usar_comunicacion",
    ],
  },
  {
    id: "tpl-config-editor",
    puesto: "Configuración técnica",
    categoria: "Configuración",
    modoAcceso: "editor",
    baseRole: "administrador",
    descripcion: "Evento, QR, integraciones y APIs.",
    permisos: [
      "dashboard_operativo",
      "gestionar_configuracion",
      "gestionar_qr",
      "configurar_integraciones",
      "ver_integraciones",
      "ver_informes_evento",
    ],
  },
  {
    id: "tpl-config-lectura",
    puesto: "Configuración técnica",
    categoria: "Configuración",
    modoAcceso: "lectura",
    baseRole: "administrador",
    descripcion: "Consulta configuración e integraciones sin modificar.",
    permisos: [
      "dashboard_operativo",
      "ver_integraciones",
      "ver_informes_evento",
    ],
  },
  {
    id: "tpl-comunicaciones-editor",
    puesto: "Comunicaciones y soporte",
    categoria: "Comunicación",
    modoAcceso: "editor",
    baseRole: "supervisor_sitio",
    descripcion: "Chat, videollamadas, emergencias e informes de contacto.",
    permisos: [
      "dashboard_operativo",
      "ver_notificaciones",
      "enviar_emergencia",
      "usar_comunicacion",
      "ver_informes_evento",
      "ver_reportes_trabajadores",
    ],
  },
  {
    id: "tpl-trabajador-campo",
    puesto: "Operario de campo",
    categoria: "Trabajador",
    modoAcceso: "editor",
    baseRole: "trabajador",
    descripcion: "Marca jornada, reporta novedades y consulta turnos.",
    permisos: TRABAJADOR_CAMPO,
  },
  {
    id: "tpl-capitan-equipo",
    puesto: "Capitán de equipo",
    categoria: "Trabajador",
    modoAcceso: "editor",
    baseRole: "trabajador",
    descripcion: "Trabajador con vista de mapa y reportes de su equipo.",
    permisos: [
      ...TRABAJADOR_CAMPO,
      "ver_mapa_en_vivo",
      "ver_reportes_trabajadores",
    ],
  },
  {
    id: "tpl-admin-operativo-editor",
    puesto: "Administrador operativo",
    categoria: "Administración",
    modoAcceso: "editor",
    baseRole: "administrador",
    descripcion: "Acceso completo a la consola admin del evento.",
    permisos: [
      "dashboard_operativo",
      "gestionar_personal",
      "gestionar_turnos",
      "gestionar_cuentas",
      "gestionar_qr",
      "ver_mapa_en_vivo",
      "ver_supervision",
      "enviar_emergencia",
      "ver_notificaciones",
      "gestionar_nomina",
      "ver_nomina",
      "gestionar_configuracion",
      "ver_reportes_trabajadores",
      "configurar_integraciones",
      "ver_integraciones",
      "usar_comunicacion",
      "ver_informes_evento",
      "gestionar_clientes",
      "gestionar_facturacion",
      "ver_inventario",
    ],
  },
  {
    id: "tpl-admin-operativo-lectura",
    puesto: "Administrador operativo",
    categoria: "Administración",
    modoAcceso: "lectura",
    baseRole: "administrador",
    descripcion: "Vista global del evento sin permisos de edición.",
    permisos: [
      "dashboard_operativo",
      "ver_mapa_en_vivo",
      "ver_supervision",
      "ver_notificaciones",
      "ver_nomina",
      "ver_reportes_trabajadores",
      "ver_integraciones",
      "usar_comunicacion",
      "ver_informes_evento",
      "ver_inventario",
    ],
  },
];

export function getRoleTemplateCategories(): string[] {
  return [...new Set(ROLE_TEMPLATES.map((t) => t.categoria))];
}

export function getRoleTemplatesByCategory(categoria?: string): RoleTemplate[] {
  if (!categoria) return ROLE_TEMPLATES;
  return ROLE_TEMPLATES.filter((t) => t.categoria === categoria);
}

export function getRoleTemplateById(id: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((t) => t.id === id);
}

export function roleTemplateDisplayName(template: RoleTemplate): string {
  if (template.modoAcceso === "lectura") {
    return `${template.puesto} (lectura)`;
  }
  return `${template.puesto} (editor)`;
}

export function roleTemplateToFormValues(template: RoleTemplate): {
  nombre: string;
  descripcion: string;
  baseRole: CustomRoleBase;
  permisos: SpePermission[];
  modoAcceso: RoleAccessMode;
  plantillaId: string;
} {
  return {
    nombre: roleTemplateDisplayName(template),
    descripcion: template.descripcion,
    baseRole: template.baseRole,
    permisos: [...template.permisos],
    modoAcceso: template.modoAcceso,
    plantillaId: template.id,
  };
}

export function toReadOnlyPermissions(permisos: SpePermission[]): SpePermission[] {
  return permisos.filter(
    (p) =>
      p.startsWith("ver_") ||
      p === "dashboard_operativo" ||
      p === "usar_comunicacion",
  );
}

export function isEditorPermission(perm: SpePermission): boolean {
  return (
    perm.startsWith("gestionar_") ||
    perm.startsWith("configurar_") ||
    perm === "enviar_emergencia" ||
    perm === "marcar_entrada" ||
    perm === "reportar_supervisor"
  );
}
