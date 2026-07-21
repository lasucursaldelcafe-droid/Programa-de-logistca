import type { UserRole } from "./types";
import { normalizeUserRole } from "./accounts";

/** Audiencia del chat dentro de un evento (canales grupales). */
export type ChatAudience = "evento" | "empleados" | "supervisores";

/** Incluye chat directo 1:1. */
export type ChatAudienceOrDm = ChatAudience | "directo";

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

/**
 * Canal 1:1 estable entre dos Auth UIDs: `dm-{uidMenor}_{uidMayor}`
 */
export function buildDmChannelId(uidA: string, uidB: string): string {
  const a = uidA.trim();
  const b = uidB.trim();
  if (!a || !b) throw new Error("Faltan participantes para el chat directo.");
  if (a === b) throw new Error("No puedes abrir un chat contigo mismo.");
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return `dm-${lo}_${hi}`;
}

export function isDmChannelId(channelId: string): boolean {
  return channelId.trim().startsWith("dm-");
}

export function parseDmChannelId(channelId: string): { uidA: string; uidB: string } | null {
  const trimmed = channelId.trim();
  if (!trimmed.startsWith("dm-")) return null;
  const rest = trimmed.slice("dm-".length);
  const idx = rest.indexOf("_");
  if (idx <= 0 || idx >= rest.length - 1) return null;
  const uidA = rest.slice(0, idx);
  const uidB = rest.slice(idx + 1);
  if (!uidA || !uidB) return null;
  return { uidA, uidB };
}

export function dmOtherUid(channelId: string, selfUid: string): string | null {
  const parsed = parseDmChannelId(channelId);
  if (!parsed) return null;
  if (parsed.uidA === selfUid) return parsed.uidB;
  if (parsed.uidB === selfUid) return parsed.uidA;
  return null;
}

export function isDmParticipant(channelId: string, uid: string): boolean {
  const parsed = parseDmChannelId(channelId);
  if (!parsed) return false;
  return parsed.uidA === uid || parsed.uidB === uid;
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

export function chatAudienceLabel(audience: ChatAudienceOrDm): string {
  switch (audience) {
    case "evento":
      return "Evento general";
    case "empleados":
      return "Solo empleados";
    case "supervisores":
      return "Solo supervisores";
    case "directo":
      return "Chat directo";
    default: {
      const _exhaustive: never = audience;
      return _exhaustive;
    }
  }
}

export function chatAudienceDescription(audience: ChatAudienceOrDm): string {
  switch (audience) {
    case "evento":
      return "Todos los del evento: empleados, supervisores y administración.";
    case "empleados":
      return "Conversación entre empleados de campo (supervisión puede leer y escribir).";
    case "supervisores":
      return "Solo supervisores y dirección / administración.";
    case "directo":
      return "Conversación privada 1:1 con un empleado.";
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
  return ROLES_SUPERVISION.includes(r);
}

export function canSendInChatAudience(role: UserRole | string, audience: ChatAudience): boolean {
  return canAccessChatAudience(role, audience);
}

/** Quién puede iniciar un chat 1:1 con un empleado. */
export function canStartDirectChat(role: UserRole | string): boolean {
  const r = normalizeUserRole(String(role));
  return ROLES_SUPERVISION.includes(r);
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
