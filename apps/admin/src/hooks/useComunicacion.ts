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
  buildEventChatChannelId,
  chatChannelId,
  parseEventChatChannelId,
  type ChatAudience,
  type ChatMessage,
  getFirestoreDb,
} from "@spe/shared";
import { isFirebaseBackend } from "../lib/backend";

export { chatChannelId, buildEventChatChannelId, parseEventChatChannelId };
export type { ChatAudience };

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

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return unsub;
  }, [channelId]);

  return messages;
}

export async function sendChatMessage(data: {
  channelId: string;
  channelLabel: string;
  text: string;
  senderUid: string;
  senderNombre: string;
  senderRole: string;
  eventId?: string;
  audience?: ChatAudience;
}): Promise<void> {
  const trimmed = data.text.trim();
  if (!trimmed) return;

  const parsed = parseEventChatChannelId(data.channelId);
  const audience = data.audience ?? parsed?.audience ?? "evento";
  const eventId = data.eventId ?? parsed?.eventId ?? null;

  await addDoc(collection(getFirestoreDb(), "chatMessages"), {
    channelId: data.channelId,
    channelLabel: data.channelLabel,
    text: trimmed,
    senderUid: data.senderUid,
    senderNombre: data.senderNombre,
    senderRole: data.senderRole,
    eventId,
    audience,
    createdAt: new Date().toISOString(),
  });
}

export function buildVideoRoomName(channelId: string): string {
  const safe = channelId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 48);
  return `SPE-Eventos-${safe}`;
}
