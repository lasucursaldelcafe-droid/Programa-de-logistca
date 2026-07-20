import type { Evento } from "@spe/shared";

/** IDs de eventos de prueba conocidos (mapa demo, tutorial, etc.). */
export const KNOWN_DEMO_EVENT_IDS = new Set(["ev-demo-mapa", "ev-tutorial"]);

const DEMO_EVENT_NAME = /\bdemo\b/i;

export function isDemoEvent(event: Evento): boolean {
  if (KNOWN_DEMO_EVENT_IDS.has(event.id)) return true;
  if (event.id.startsWith("ev-demo-")) return true;
  return DEMO_EVENT_NAME.test(event.nombre);
}

export function isDemoEntityId(id: string): boolean {
  return (
    id.startsWith("site-demo-") ||
    id.startsWith("shift-demo-") ||
    id.startsWith("att-demo-") ||
    id.startsWith("qr-demo-") ||
    id.startsWith("w-demo-")
  );
}
