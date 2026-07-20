/** Flujo operativo del admin: preparar → operar → cerrar. */

export type EventFlowPhase = "preparar" | "operar" | "cerrar";

export interface EventFlowStep {
  id: string;
  order: number;
  phase: EventFlowPhase;
  label: string;
  description: string;
  path: string;
}

export const EVENT_FLOW_PHASE_LABEL: Record<EventFlowPhase, string> = {
  preparar: "Preparar evento",
  operar: "Durante el evento",
  cerrar: "Cierre",
};

/** Orden recomendado para configurar y operar un evento. */
export const EVENT_OPERATION_FLOW: EventFlowStep[] = [
  {
    id: "asistente",
    order: 1,
    phase: "preparar",
    label: "Crear evento",
    description: "Nombre, fechas, sitios, tarifas y códigos QR",
    path: "/configuracion",
  },
  {
    id: "personal",
    order: 2,
    phase: "preparar",
    label: "Registrar personal",
    description: "Altas de trabajadores y supervisores",
    path: "/personal",
  },
  {
    id: "cuentas",
    order: 3,
    phase: "preparar",
    label: "Invitar cuentas",
    description: "Correo y código para que activen su acceso",
    path: "/cuentas",
  },
  {
    id: "operacion",
    order: 4,
    phase: "preparar",
    label: "Asignar al evento",
    description: "Turnos por sitio y equipo del evento",
    path: "/operacion",
  },
  {
    id: "mapa",
    order: 5,
    phase: "operar",
    label: "Mapa en vivo",
    description: "Ubicación GPS del personal en tiempo real",
    path: "/mapa",
  },
  {
    id: "supervision",
    order: 6,
    phase: "operar",
    label: "Supervisión",
    description: "Alertas de geocerca y revisiones",
    path: "/supervision",
  },
  {
    id: "turnos",
    order: 7,
    phase: "operar",
    label: "Turnos",
    description: "Confirmaciones y cambios de última hora",
    path: "/turnos",
  },
  {
    id: "comunicacion",
    order: 8,
    phase: "operar",
    label: "Comunicación",
    description: "Chat y videollamada con el equipo",
    path: "/comunicacion",
  },
  {
    id: "reportes",
    order: 9,
    phase: "operar",
    label: "Reportes",
    description: "Incidencias y novedades del personal",
    path: "/reportes",
  },
  {
    id: "qr",
    order: 10,
    phase: "operar",
    label: "QR y sitios",
    description: "Imprimir o revisar códigos de entrada",
    path: "/qr-sitios",
  },
  {
    id: "nomina",
    order: 11,
    phase: "cerrar",
    label: "Nómina",
    description: "Horas, tarifas y pagos del evento",
    path: "/nomina",
  },
];

export function eventFlowStepsByPhase(phase: EventFlowPhase): EventFlowStep[] {
  return EVENT_OPERATION_FLOW.filter((step) => step.phase === phase);
}
