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
import { getFirestoreDb, type ChatMessage } from "@spe/shared";
import { isFirebaseBackend } from "../lib/backend";

export function chatChannelId(eventId: string | null): string {
  return eventId ? `event-${eventId}` : "general";
}

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
}): Promise<void> {
  const trimmed = data.text.trim();
  if (!trimmed) return;

  await addDoc(collection(getFirestoreDb(), "chatMessages"), {
    channelId: data.channelId,
    channelLabel: data.channelLabel,
    text: trimmed,
    senderUid: data.senderUid,
    senderNombre: data.senderNombre,
    senderRole: data.senderRole,
    eventId: data.eventId ?? null,
    createdAt: new Date().toISOString(),
  });
}

export function buildVideoRoomName(channelId: string): string {
  const safe = channelId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 48);
  return `SPE-Eventos-${safe}`;
}
