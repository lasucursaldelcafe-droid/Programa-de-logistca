import type { Firestore } from "firebase-admin/firestore";

export interface NotificationPayload {
  destinatarios?: string[];
  eventId?: string;
  siteId?: string;
  titulo?: string;
  mensaje?: string;
  urgente?: boolean;
  tipo?: string;
}

async function findUidByWorkerId(db: Firestore, workerId: string): Promise<string | null> {
  const snap = await db.collection("users").where("workerId", "==", workerId).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0]?.id ?? null;
}

async function uidsFromWorkerIds(db: Firestore, workerIds: Iterable<string>): Promise<string[]> {
  const uids: string[] = [];
  for (const workerId of workerIds) {
    const uid = await findUidByWorkerId(db, workerId);
    if (uid) uids.push(uid);
  }
  return uids;
}

async function adminUids(db: Firestore): Promise<string[]> {
  const snap = await db.collection("users").get();
  return snap.docs
    .filter((d) => {
      const role = d.data().role as string | undefined;
      return role !== "trabajador";
    })
    .map((d) => d.id);
}

async function workerIdsForEvent(db: Firestore, eventId: string): Promise<string[]> {
  const snap = await db.collection("shifts").where("eventId", "==", eventId).get();
  return [...new Set(snap.docs.map((d) => d.data().workerId as string).filter(Boolean))];
}

async function workerIdsForSite(db: Firestore, siteId: string): Promise<string[]> {
  const snap = await db.collection("shifts").where("siteId", "==", siteId).get();
  return [...new Set(snap.docs.map((d) => d.data().workerId as string).filter(Boolean))];
}

/** Resuelve destinatarios Firestore → Auth UIDs para FCM. */
export async function resolveRecipientUids(
  db: Firestore,
  notification: NotificationPayload,
): Promise<string[]> {
  const dest = notification.destinatarios ?? [];
  const uids = new Set<string>();

  if (dest.includes("_todos")) {
    const tokens = await db.collection("fcmTokens").get();
    for (const doc of tokens.docs) uids.add(doc.id);
    return [...uids];
  }

  if (dest.includes("_admins")) {
    for (const uid of await adminUids(db)) uids.add(uid);
  }

  for (const entry of dest) {
    if (entry === "_admins" || entry === "_todos") continue;

    if (entry.startsWith("event:")) {
      const eventId = entry.slice("event:".length) || notification.eventId;
      if (eventId) {
        for (const uid of await uidsFromWorkerIds(db, await workerIdsForEvent(db, eventId))) {
          uids.add(uid);
        }
      }
      continue;
    }

    if (entry.startsWith("site:")) {
      const siteId = entry.slice("site:".length) || notification.siteId;
      if (siteId) {
        for (const uid of await uidsFromWorkerIds(db, await workerIdsForSite(db, siteId))) {
          uids.add(uid);
        }
      }
      continue;
    }

    // Auth UID directo (p. ej. chat 1:1)
    if (entry.startsWith("uid:")) {
      const uid = entry.slice("uid:".length).trim();
      if (uid) uids.add(uid);
      continue;
    }

    const asUser = await db.collection("users").doc(entry).get();
    if (asUser.exists) {
      uids.add(entry);
      continue;
    }

    const uid = await findUidByWorkerId(db, entry);
    if (uid) uids.add(uid);
  }

  return [...uids];
}

function comunicacionLinkForRole(role: string | undefined): string {
  // Solo Empleado usa la app de campo. Supervisor/oficina → /comunicacion;
  // dirección → /master/comunicacion.
  if (role === "trabajador") {
    return "/worker/comunicacion";
  }
  if (role === "ceo" || role === "master_app" || role === "super_admin") {
    return "/master/comunicacion";
  }
  return "/comunicacion";
}

function notificationsLinkForRole(role: string | undefined): string {
  if (role === "trabajador") {
    return "/worker/notificaciones";
  }
  if (role === "ceo" || role === "master_app" || role === "super_admin") {
    return "/master/notificaciones";
  }
  return "/notificaciones";
}

/** Tokens FCM de un doc: `token` (legacy) + `tokens[]` (multi-dispositivo). */
export function tokensFromFcmDoc(data: Record<string, unknown> | undefined): string[] {
  if (!data) return [];
  const out = new Set<string>();
  if (typeof data.token === "string" && data.token.trim()) {
    out.add(data.token.trim());
  }
  if (Array.isArray(data.tokens)) {
    for (const t of data.tokens) {
      if (typeof t === "string" && t.trim()) out.add(t.trim());
    }
  }
  return [...out];
}

export async function collectFcmTokensForUids(
  db: Firestore,
  uids: string[],
): Promise<Array<{ uid: string; token: string }>> {
  const recipients: Array<{ uid: string; token: string }> = [];
  for (const uid of uids) {
    const tokenDoc = await db.collection("fcmTokens").doc(uid).get();
    for (const token of tokensFromFcmDoc(tokenDoc.data() as Record<string, unknown> | undefined)) {
      recipients.push({ uid, token });
    }
  }
  return recipients;
}

/** Une base pública (Pages) + path relativo de la app. */
export function absoluteAppLink(appBaseUrl: string, path: string): string {
  const base = appBaseUrl.endsWith("/") ? appBaseUrl.slice(0, -1) : appBaseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function notificationsLinkForUid(db: Firestore, uid: string): Promise<string> {
  const userDoc = await db.collection("users").doc(uid).get();
  const role = userDoc.data()?.role as string | undefined;
  return notificationsLinkForRole(role);
}

type ChatAudience = "evento" | "empleados" | "supervisores";

function parseEventChatChannelId(
  channelId: string,
): { eventId: string; audience: ChatAudience } | null {
  const trimmed = channelId.trim();
  if (!trimmed.startsWith("event-")) return null;
  const rest = trimmed.slice("event-".length);
  if (rest.endsWith("--empleados")) {
    return { eventId: rest.slice(0, -"--empleados".length), audience: "empleados" };
  }
  if (rest.endsWith("--supervisores")) {
    return { eventId: rest.slice(0, -"--supervisores".length), audience: "supervisores" };
  }
  return { eventId: rest, audience: "evento" };
}

async function uidsByRoles(db: Firestore, roles: string[]): Promise<string[]> {
  const allowed = new Set(roles);
  const snap = await db.collection("users").get();
  return snap.docs
    .filter((d) => allowed.has(String(d.data().role ?? "")))
    .map((d) => d.id);
}

async function workerUidsForEventByPlatformRole(
  db: Firestore,
  eventId: string,
  platformRoles: Array<"trabajador" | "supervisor_sitio">,
): Promise<string[]> {
  const workerIds = await workerIdsForEvent(db, eventId);
  if (workerIds.length === 0) return [];
  const allowed = new Set(platformRoles);
  const uids: string[] = [];
  for (const workerId of workerIds) {
    const workerDoc = await db.collection("workers").doc(workerId).get();
    const rol = String(workerDoc.data()?.rolPlataforma ?? "trabajador");
    if (!allowed.has(rol as "trabajador" | "supervisor_sitio")) continue;
    const uid = await findUidByWorkerId(db, workerId);
    if (uid) uids.push(uid);
  }
  return uids;
}

/** Destinatarios push para un mensaje de chat (excluye al remitente). */
export async function resolveChatRecipientUids(
  db: Firestore,
  data: {
    channelId: string;
    eventId?: string | null;
    audience?: string | null;
    senderUid: string;
    participantUids?: string[] | null;
  },
): Promise<string[]> {
  const uids = new Set<string>();
  const { channelId, senderUid } = data;

  if (channelId.startsWith("dm-")) {
    const participants =
      data.participantUids && data.participantUids.length > 0
        ? data.participantUids
        : (() => {
            const rest = channelId.slice("dm-".length);
            const idx = rest.indexOf("_");
            if (idx <= 0) return [] as string[];
            return [rest.slice(0, idx), rest.slice(idx + 1)].filter(Boolean);
          })();
    for (const uid of participants) {
      if (uid && uid !== senderUid) uids.add(uid);
    }
    return [...uids];
  }

  if (channelId === "general") {
    const tokens = await db.collection("fcmTokens").get();
    for (const doc of tokens.docs) {
      if (doc.id !== senderUid) uids.add(doc.id);
    }
    return [...uids];
  }

  const parsed = parseEventChatChannelId(channelId);
  if (parsed || channelId.startsWith("event-")) {
    const eventId = data.eventId ?? parsed?.eventId ?? channelId.slice("event-".length);
    const audience = (data.audience as ChatAudience | undefined) ?? parsed?.audience ?? "evento";

    if (eventId) {
      if (audience === "supervisores") {
        for (const uid of await workerUidsForEventByPlatformRole(db, eventId, [
          "supervisor_sitio",
        ])) {
          if (uid !== senderUid) uids.add(uid);
        }
        for (const uid of await uidsByRoles(db, [
          "ceo",
          "master_app",
          "super_admin",
          "administrador",
          "recursos_humanos",
          "supervisor_sitio",
        ])) {
          if (uid !== senderUid) uids.add(uid);
        }
      } else if (audience === "empleados") {
        for (const uid of await workerUidsForEventByPlatformRole(db, eventId, [
          "trabajador",
          "supervisor_sitio",
        ])) {
          if (uid !== senderUid) uids.add(uid);
        }
        for (const uid of await uidsByRoles(db, [
          "ceo",
          "master_app",
          "super_admin",
          "administrador",
          "recursos_humanos",
        ])) {
          if (uid !== senderUid) uids.add(uid);
        }
      } else {
        for (const uid of await uidsFromWorkerIds(db, await workerIdsForEvent(db, eventId))) {
          if (uid !== senderUid) uids.add(uid);
        }
        for (const uid of await adminUids(db)) {
          if (uid !== senderUid) uids.add(uid);
        }
      }
    }
    return [...uids];
  }

  const tokens = await db.collection("fcmTokens").get();
  for (const doc of tokens.docs) {
    if (doc.id !== senderUid) uids.add(doc.id);
  }
  return [...uids];
}

export async function comunicacionLinkForUid(db: Firestore, uid: string): Promise<string> {
  const userDoc = await db.collection("users").doc(uid).get();
  const role = userDoc.data()?.role as string | undefined;
  return comunicacionLinkForRole(role);
}
