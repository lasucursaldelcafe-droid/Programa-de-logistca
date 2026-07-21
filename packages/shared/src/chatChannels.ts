import type { UserRole } from "./types";
import { normalizeUserRole } from "./accounts";

/** Audiencia del chat dentro de un evento. */
export type ChatAudience = "evento" | "empleados" | "supervisores";

export interface ChatChannelOption {
  audience: ChatAudience;
  /** ID Firestore / query */
  channelId: string;
  label: string;
  description: string;
}

const SUFFIX: Record<Exclude<ChatAudience, "evento">, string> = {
  empleados: "--empleados",
  supervisores: "--supervisores",
};

/** Roles que pueden usar comunicación de evento. */
const ROLES_CHAT: UserRole[] = [
  "ceo",
  "master_app",
  "super_admin",
  "administrador",
  "recursos_humanos",
  "supervisor_sitio",
  "trabajador",
];

const ROLES_SUPERVISION: UserRole[] = [
  "ceo",
  "master_app",
  "super_admin",
  "administrador",
  "recursos_humanos",
  "supervisor_sitio",
];

/**
 * Canal general del evento (compat): `event-{id}`
 * Empleados: `event-{id}--empleados`
 * Supervisores: `event-{id}--supervisores`
 */
export function buildEventChatChannelId(eventId: string, audience: ChatAudience): string {
  const id = eventId.trim();
  if (!id) return "general";
  if (audience === "evento") return `event-${id}`;
  return `event-${id}${SUFFIX[audience]}`;
}

/** @deprecated Prefer buildEventChatChannelId(eventId, "evento") */
export function chatChannelId(eventId: string | null): string {
  return eventId ? buildEventChatChannelId(eventId, "evento") : "general";
}

export function parseEventChatChannelId(
  channelId: string,
): { eventId: string; audience: ChatAudience } | null {
  const trimmed = channelId.trim();
  if (!trimmed || trimmed === "general") return null;
  if (!trimmed.startsWith("event-")) return null;

  const rest = trimmed.slice("event-".length);
  if (rest.endsWith(SUFFIX.empleados)) {
    return {
      eventId: rest.slice(0, -SUFFIX.empleados.length),
      audience: "empleados",
    };
  }
  if (rest.endsWith(SUFFIX.supervisores)) {
    return {
      eventId: rest.slice(0, -SUFFIX.supervisores.length),
      audience: "supervisores",
    };
  }
  return { eventId: rest, audience: "evento" };
}

export function chatAudienceLabel(audience: ChatAudience): string {
  switch (audience) {
    case "evento":
      return "Evento general";
    case "empleados":
      return "Solo empleados";
    case "supervisores":
      return "Solo supervisores";
    default: {
      const _exhaustive: never = audience;
      return _exhaustive;
    }
  }
}

export function chatAudienceDescription(audience: ChatAudience): string {
  switch (audience) {
    case "evento":
      return "Todos los del evento: empleados, supervisores y administración.";
    case "empleados":
      return "Conversación entre empleados de campo (supervisión puede leer y escribir).";
    case "supervisores":
      return "Solo supervisores y dirección / administración.";
    default: {
      const _exhaustive: never = audience;
      return _exhaustive;
    }
  }
}

export function canAccessChatAudience(role: UserRole | string, audience: ChatAudience): boolean {
  const r = normalizeUserRole(String(role));
  if (!ROLES_CHAT.includes(r)) return false;
  if (audience === "evento" || audience === "empleados") return true;
  // supervisores: sin empleados de campo
  return ROLES_SUPERVISION.includes(r);
}

export function canSendInChatAudience(role: UserRole | string, audience: ChatAudience): boolean {
  return canAccessChatAudience(role, audience);
}

/** Canales visibles para un rol en un evento concreto. */
export function listEventChatChannels(
  eventId: string,
  eventNombre: string,
  role: UserRole | string,
): ChatChannelOption[] {
  const audiences: ChatAudience[] = ["evento", "empleados", "supervisores"];
  return audiences
    .filter((a) => canAccessChatAudience(role, a))
    .map((audience) => ({
      audience,
      channelId: buildEventChatChannelId(eventId, audience),
      label:
        audience === "evento"
          ? `${eventNombre} · General`
          : `${eventNombre} · ${chatAudienceLabel(audience)}`,
      description: chatAudienceDescription(audience),
    }));
}

export const CHAT_AUDIENCE_LABEL: Record<ChatAudience, string> = {
  evento: chatAudienceLabel("evento"),
  empleados: chatAudienceLabel("empleados"),
  supervisores: chatAudienceLabel("supervisores"),
};
