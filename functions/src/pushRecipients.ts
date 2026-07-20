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

    const uid = await findUidByWorkerId(db, entry);
    if (uid) uids.add(uid);
  }

  return [...uids];
}
