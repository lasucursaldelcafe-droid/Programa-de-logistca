import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  where,
  getDocs,
} from "firebase/firestore";
import {
  buildJitsiRoomName,
  getFirestoreDb,
  type AppUser,
  type ChatConversation,
  type ChatMessage,
  type VideoRoom,
} from "@spe/shared";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { demoStore } from "../demo/store";
import { sheetsGetById, sheetsListAll, sheetsUpsertRecord } from "../data/sheetsOps";
import { useSheetsPoll } from "./useSheetsPoll";
import { sendNotification } from "./useNotifications";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return raw.split(",").filter(Boolean);
    }
  }
  return [];
}

function serializeConversation(c: ChatConversation): Record<string, unknown> {
  return {
    ...c,
    participantIds: JSON.stringify(c.participantIds),
  };
}

function parseConversation(raw: Record<string, unknown>): ChatConversation {
  return {
    id: String(raw.id ?? ""),
    eventId: String(raw.eventId ?? ""),
    eventNombre: raw.eventNombre ? String(raw.eventNombre) : undefined,
    siteId: raw.siteId ? String(raw.siteId) : undefined,
    siteNombre: raw.siteNombre ? String(raw.siteNombre) : undefined,
    tipo: raw.tipo as ChatConversation["tipo"],
    titulo: String(raw.titulo ?? ""),
    participantIds: parseJsonArray(raw.participantIds),
    lastMessageAt: String(raw.lastMessageAt ?? ""),
    lastMessagePreview: raw.lastMessagePreview ? String(raw.lastMessagePreview) : undefined,
    creadoEn: String(raw.creadoEn ?? ""),
    creadoPor: String(raw.creadoPor ?? ""),
  };
}

function parseMessage(raw: Record<string, unknown>): ChatMessage {
  return {
    id: String(raw.id ?? ""),
    conversationId: String(raw.conversationId ?? ""),
    senderUid: String(raw.senderUid ?? ""),
    senderNombre: String(raw.senderNombre ?? ""),
    texto: String(raw.texto ?? ""),
    creadoEn: String(raw.creadoEn ?? ""),
    leidoPor: parseJsonArray(raw.leidoPor),
  };
}

function userInConversation(conv: ChatConversation, user: AppUser): boolean {
  if (conv.participantIds.includes("_todos")) return true;
  if (user.workerId && conv.participantIds.includes(user.workerId)) return true;
  if (conv.participantIds.includes(user.uid)) return true;
  if (user.role !== "trabajador" && conv.tipo === "evento") return true;
  if (user.role === "supervisor_sitio" || user.role === "administrador") {
    if (conv.tipo === "evento" || conv.tipo === "sitio") return true;
  }
  return false;
}

export function useConversations(user: AppUser | null, eventId?: string): ChatConversation[] {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const sheetsConversations = useSheetsPoll<Record<string, unknown>>("conversations");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend() || !user) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "conversations"), orderBy("lastMessageAt", "desc")),
      (snap) =>
        setConversations(
          snap.docs.map((d) => parseConversation({ id: d.id, ...d.data() })),
        ),
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!isSheetsBackend()) return;
    setConversations(sheetsConversations.map(parseConversation));
  }, [sheetsConversations]);

  const demoConversations = useDemoSnapshot(() => demoStore.conversations);

  return useMemo(() => {
    const all = isDemoMode() ? demoConversations : conversations;
    if (!user) return [];
    return all
      .filter((c) => !eventId || c.eventId === eventId)
      .filter((c) => userInConversation(c, user))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [demoConversations, conversations, user, eventId]);
}

export function useMessages(conversationId: string | null): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const sheetsMessages = useSheetsPoll<Record<string, unknown>>("messages", 5000);

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend() || !conversationId) return;
    const unsub = onSnapshot(
      query(
        collection(getFirestoreDb(), "messages"),
        where("conversationId", "==", conversationId),
      ),
      (snap) =>
        setMessages(
          snap.docs
            .map((d) => parseMessage({ id: d.id, ...d.data() }))
            .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)),
        ),
    );
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    if (!isSheetsBackend() || !conversationId) return;
    setMessages(
      sheetsMessages
        .map(parseMessage)
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)),
    );
  }, [sheetsMessages, conversationId]);

  const demoMessages = useDemoSnapshot(() =>
    conversationId ? demoStore.getMessages(conversationId) : [],
  );

  if (isDemoMode()) return demoMessages;
  return messages;
}

export async function sendChatMessage(data: {
  conversationId: string;
  sender: AppUser;
  texto: string;
}): Promise<void> {
  const texto = data.texto.trim();
  if (!texto) return;

  const message: Omit<ChatMessage, "id"> = {
    conversationId: data.conversationId,
    senderUid: data.sender.uid,
    senderNombre: data.sender.nombre,
    texto,
    creadoEn: new Date().toISOString(),
    leidoPor: [data.sender.uid],
  };

  if (isDemoMode()) {
    demoStore.addMessage(message);
    return;
  }

  if (isSheetsBackend()) {
    const id = `msg-${Date.now().toString(36)}`;
    await sheetsUpsertRecord(
      "messages",
      { ...message, id, leidoPor: JSON.stringify(message.leidoPor) },
      "id",
    );
    const conv = await sheetsGetById<Record<string, unknown>>("conversations", data.conversationId);
    if (conv) {
      const parsed = parseConversation(conv);
      await sheetsUpsertRecord(
        "conversations",
        serializeConversation({
          ...parsed,
          lastMessageAt: message.creadoEn,
          lastMessagePreview: texto.slice(0, 80),
        }),
        "id",
      );
    }
    return;
  }

  await addDoc(collection(getFirestoreDb(), "messages"), message);
  await updateDoc(doc(getFirestoreDb(), "conversations", data.conversationId), {
    lastMessageAt: message.creadoEn,
    lastMessagePreview: texto.slice(0, 80),
  });
}

export async function ensureEventConversation(data: {
  eventId: string;
  eventNombre: string;
  actor: AppUser;
}): Promise<string> {
  const existing = isDemoMode()
    ? demoStore.conversations.find((c) => c.eventId === data.eventId && c.tipo === "evento")
    : null;

  if (existing) return existing.id;

  if (!isDemoMode() && !isSheetsBackend()) {
    const q = query(
      collection(getFirestoreDb(), "conversations"),
      where("eventId", "==", data.eventId),
      where("tipo", "==", "evento"),
    );
    const snaps = await getDocsCompat(q);
    if (snaps.length > 0) return snaps[0]!.id;
  }

  if (isSheetsBackend()) {
    const all = await sheetsListAll<Record<string, unknown>>("conversations");
    const found = all.find((c) => c.eventId === data.eventId && c.tipo === "evento");
    if (found) return String(found.id);
  }

  const id = `conv-event-${data.eventId}`;
  const conv: ChatConversation = {
    id,
    eventId: data.eventId,
    eventNombre: data.eventNombre,
    tipo: "evento",
    titulo: `Canal general — ${data.eventNombre}`,
    participantIds: ["_todos"],
    lastMessageAt: new Date().toISOString(),
    creadoEn: new Date().toISOString(),
    creadoPor: data.actor.uid,
  };

  if (isDemoMode()) {
    demoStore.addConversation(conv);
    return id;
  }

  if (isSheetsBackend()) {
    await sheetsUpsertRecord("conversations", serializeConversation(conv), "id");
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "conversations", id), {
    ...conv,
    participantIds: conv.participantIds,
  });
  return id;
}

async function getDocsCompat(
  q: ReturnType<typeof query>,
): Promise<Array<{ id: string }>> {
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id }));
}

export async function startVideoCall(data: {
  conversation: ChatConversation;
  actor: AppUser;
}): Promise<VideoRoom> {
  const roomName = buildJitsiRoomName(data.conversation.eventId, data.conversation.id);
  const room: VideoRoom = {
    id: `video-${Date.now().toString(36)}`,
    conversationId: data.conversation.id,
    eventId: data.conversation.eventId,
    eventNombre: data.conversation.eventNombre,
    roomName,
    creadoPor: data.actor.uid,
    creadoPorNombre: data.actor.nombre,
    creadoEn: new Date().toISOString(),
    activo: true,
  };

  if (isDemoMode()) {
    demoStore.addVideoRoom(room);
  } else if (isSheetsBackend()) {
    await sheetsUpsertRecord("videoRooms", { ...room } as Record<string, unknown>, "id");
  } else {
    await setDoc(doc(getFirestoreDb(), "videoRooms", room.id), room);
  }

  await sendNotification({
    tipo: "videollamada_iniciada",
    titulo: "Videollamada iniciada",
    mensaje: `${data.actor.nombre} inició una videollamada en ${data.conversation.titulo}.`,
    urgente: true,
    destinatarios: ["_admins", ...(data.conversation.participantIds.includes("_todos") ? [] : data.conversation.participantIds)],
    eventId: data.conversation.eventId,
  });

  return room;
}

export function getJitsiEmbedUrl(roomName: string): string {
  return `https://meet.jit.si/${encodeURIComponent(roomName)}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false`;
}
