import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  buildDmChannelId,
  buildEventChatChannelId,
  chatChannelId,
  dmOtherUid,
  isDmChannelId,
  parseDmChannelId,
  parseEventChatChannelId,
  type ChatAudience,
  type ChatAudienceOrDm,
  type ChatMessage,
  getFirestoreDb,
} from "@spe/shared";
import { isFirebaseBackend } from "../lib/backend";
import { sendNotification } from "./useNotifications";

export {
  chatChannelId,
  buildEventChatChannelId,
  parseEventChatChannelId,
  buildDmChannelId,
  isDmChannelId,
  parseDmChannelId,
  dmOtherUid,
};
export type { ChatAudience, ChatAudienceOrDm };

export function useChatMessages(channelId: string): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!isFirebaseBackend() || !channelId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(getFirestoreDb(), "chatMessages"),
      where("channelId", "==", channelId),
      orderBy("createdAt", "asc"),
      limit(300),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
      },
      (err) => {
        console.error("No se pudieron cargar mensajes de chat:", err);
        setMessages([]);
      },
    );
    return unsub;
  }, [channelId]);

  return messages;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function sendChatMessage(data: {
  channelId: string;
  channelLabel: string;
  text: string;
  senderUid: string;
  senderNombre: string;
  senderRole: string;
  eventId?: string;
  audience?: ChatAudienceOrDm;
  /** Peer Auth UID cuando es DM (para notificación in-app). */
  peerUid?: string;
}): Promise<void> {
  const trimmed = data.text.trim();
  if (!trimmed) return;

  const isDm = isDmChannelId(data.channelId);
  const parsedEvent = parseEventChatChannelId(data.channelId);
  const audience: ChatAudienceOrDm =
    data.audience ?? (isDm ? "directo" : (parsedEvent?.audience ?? "evento"));
  const eventId = isDm ? null : (data.eventId ?? parsedEvent?.eventId ?? null);

  let participantUids: string[] | undefined;
  if (isDm) {
    const parsed = parseDmChannelId(data.channelId);
    if (!parsed) throw new Error("Canal de chat directo inválido.");
    if (parsed.uidA !== data.senderUid && parsed.uidB !== data.senderUid) {
      throw new Error("No eres participante de este chat.");
    }
    participantUids = [parsed.uidA, parsed.uidB];
  }

  const payload = omitUndefined({
    channelId: data.channelId,
    channelLabel: data.channelLabel,
    text: trimmed,
    senderUid: data.senderUid,
    senderNombre: data.senderNombre,
    senderRole: data.senderRole,
    eventId,
    audience,
    participantUids,
    createdAt: new Date().toISOString(),
  });

  await addDoc(collection(getFirestoreDb(), "chatMessages"), payload);

  // Notificación in-app (además del FCM de la Cloud Function) para que salte la campana.
  const peer =
    data.peerUid ??
    (isDm ? dmOtherUid(data.channelId, data.senderUid) : null);
  if (peer) {
    try {
      await sendNotification({
        tipo: "chat_mensaje",
        titulo: isDm
          ? `Chat · ${data.senderNombre}`
          : `${data.senderNombre} · ${data.channelLabel}`,
        mensaje: trimmed.length > 180 ? `${trimmed.slice(0, 177)}…` : trimmed,
        urgente: false,
        destinatarios: [peer],
        eventId: eventId ?? undefined,
        actorUid: data.senderUid,
        actorNombre: data.senderNombre,
      });
    } catch (err) {
      console.error("No se pudo crear alerta de chat:", err);
    }
  } else if (!isDm && audience !== "directo") {
    // Canal de evento: aviso a admins + alcance del canal (campana).
    try {
      const dest =
        audience === "supervisores"
          ? ["_admins"]
          : audience === "empleados" && eventId
            ? ["_admins", `event:${eventId}`]
            : eventId
              ? ["_admins", `event:${eventId}`]
              : ["_admins"];
      await sendNotification({
        tipo: "chat_mensaje",
        titulo: `${data.senderNombre} · ${data.channelLabel}`,
        mensaje: trimmed.length > 180 ? `${trimmed.slice(0, 177)}…` : trimmed,
        urgente: false,
        destinatarios: dest,
        eventId: eventId ?? undefined,
        actorUid: data.senderUid,
        actorNombre: data.senderNombre,
      });
    } catch (err) {
      console.error("No se pudo crear alerta de chat de canal:", err);
    }
  }
}

export function buildVideoRoomName(channelId: string): string {
  const safe = channelId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 48);
  return `SPE-Eventos-${safe}`;
}
