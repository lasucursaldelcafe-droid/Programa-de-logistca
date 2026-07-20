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
  getDoc,
} from "firebase/firestore";
import {
  getFirestoreDb,
  notificationUnreadFor,
  notificationVisibleTo,
  type AppNotification,
  type AppUser,
  type BreakSchedule,
  type BreakTipo,
  type NotificationTipo,
} from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import { demoStore } from "../demo/store";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function useNotifications(user: AppUser | null): AppNotification[] {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (DEMO_MODE || !user) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "notifications"), orderBy("timestamp", "desc")),
      (snap) =>
        setNotifications(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)),
        ),
    );
    return unsub;
  }, [user]);

  const demoNotifications = useDemoSnapshot(() => demoStore.notifications);

  return useMemo(() => {
    const all = DEMO_MODE ? demoNotifications : notifications;
    if (!user) return [];
    return all.filter((n) => notificationVisibleTo(n, user));
  }, [DEMO_MODE, demoNotifications, notifications, user]);
}

export function useUnreadCount(user: AppUser | null): number {
  const items = useNotifications(user);
  if (!user) return 0;
  return items.filter((n) => notificationUnreadFor(n, user.uid)).length;
}

export async function sendNotification(data: {
  tipo: NotificationTipo;
  titulo: string;
  mensaje: string;
  urgente?: boolean;
  destinatarios: string[];
  shiftId?: string;
  eventId?: string;
  siteId?: string;
  attendanceId?: string;
  actorUid?: string;
  actorNombre?: string;
  accionTurno?: boolean;
}): Promise<void> {
  const payload = {
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    timestamp: new Date().toISOString(),
    urgente: data.urgente ?? false,
    destinatarios: data.destinatarios,
    shiftId: data.shiftId,
    eventId: data.eventId,
    siteId: data.siteId,
    attendanceId: data.attendanceId,
    actorUid: data.actorUid,
    actorNombre: data.actorNombre,
    leidaPor: [] as string[],
    accionTurno: data.accionTurno ?? false,
  };

  if (DEMO_MODE) {
    demoStore.addNotification(payload);
    return;
  }
  await addDoc(collection(getFirestoreDb(), "notifications"), payload);
}

export async function sendAdminNotification(data: {
  titulo: string;
  mensaje: string;
  scope: "todos" | "admins" | "workers" | "event" | "site";
  workerIds?: string[];
  eventId?: string;
  siteId?: string;
  urgente?: boolean;
  actorUid: string;
  actorNombre: string;
}): Promise<void> {
  let destinatarios: string[] = ["_todos"];
  if (data.scope === "admins") destinatarios = ["_admins"];
  if (data.scope === "workers" && data.workerIds?.length) destinatarios = data.workerIds;
  if (data.scope === "event" && data.eventId) destinatarios = [`event:${data.eventId}`];
  if (data.scope === "site" && data.siteId) destinatarios = [`site:${data.siteId}`];

  await sendNotification({
    tipo: "sistema",
    titulo: data.titulo.trim(),
    mensaje: data.mensaje.trim(),
    urgente: data.urgente ?? false,
    destinatarios,
    eventId: data.eventId,
    siteId: data.siteId,
    actorUid: data.actorUid,
    actorNombre: data.actorNombre,
  });
}

export async function markNotificationRead(
  notificationId: string,
  uid: string,
): Promise<void> {
  if (DEMO_MODE) {
    demoStore.markNotificationRead(notificationId, uid);
    return;
  }
  const ref = doc(getFirestoreDb(), "notifications", notificationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const leidaPor = (snap.data().leidaPor as string[] | undefined) ?? [];
  if (leidaPor.includes(uid)) return;
  await updateDoc(ref, { leidaPor: [...leidaPor, uid] });
}

export async function sendEmergencyBroadcast(data: {
  mensaje: string;
  scope: "todos" | "event" | "site" | "activos";
  eventId?: string;
  siteId?: string;
  workerIdsActivos?: string[];
  actorUid: string;
  actorNombre: string;
}): Promise<void> {
  let destinatarios: string[] = ["_todos"];
  if (data.scope === "event" && data.eventId) destinatarios = [`event:${data.eventId}`];
  if (data.scope === "site" && data.siteId) destinatarios = [`site:${data.siteId}`];
  if (data.scope === "activos" && data.workerIdsActivos?.length) {
    destinatarios = data.workerIdsActivos;
  }

  await sendNotification({
    tipo: "emergencia",
    titulo: "Alerta de emergencia",
    mensaje: data.mensaje,
    urgente: true,
    destinatarios,
    eventId: data.eventId,
    siteId: data.siteId,
    actorUid: data.actorUid,
    actorNombre: data.actorNombre,
  });
}

export async function scheduleBreakReminder(data: {
  shiftId: string;
  workerId: string;
  workerNombre: string;
  tipo: BreakTipo;
  inicio: string;
  fin: string;
}): Promise<void> {
  if (DEMO_MODE) {
    demoStore.addBreak({ ...data, notificado: false });
    return;
  }
  await addDoc(collection(getFirestoreDb(), "breaks"), {
    ...data,
    notificado: false,
  });
}

export function useBreaks(): BreakSchedule[] {
  const [breaks, setBreaks] = useState<BreakSchedule[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "breaks"), (snap) =>
      setBreaks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BreakSchedule))),
    );
    return unsub;
  }, []);

  const demoBreaks = useDemoSnapshot(() => demoStore.breaks);
  return DEMO_MODE ? demoBreaks : breaks;
}

export async function saveFcmToken(uid: string, token: string): Promise<void> {
  if (DEMO_MODE) return;
  await setDoc(doc(getFirestoreDb(), "fcmTokens", uid), {
    token,
    actualizadoEn: new Date().toISOString(),
  });
}

// --- Auto-notificaciones ---

export async function notifyShiftAssigned(shift: {
  id: string;
  workerId: string;
  workerNombre?: string;
  eventNombre?: string;
  siteNombre?: string;
  inicio: string;
}): Promise<void> {
  await sendNotification({
    tipo: "turno_asignado",
    titulo: "Nuevo turno asignado",
    mensaje: `¿Deseas tomar el turno en ${shift.siteNombre ?? "sitio"} (${shift.eventNombre ?? "evento"}) el ${new Date(shift.inicio).toLocaleString("es-CO")}?`,
    destinatarios: [shift.workerId],
    shiftId: shift.id,
    accionTurno: true,
  });
}

export async function notifyShiftResponse(data: {
  shiftId: string;
  workerId: string;
  workerNombre: string;
  estado: "confirmado" | "rechazado";
  eventNombre?: string;
  siteNombre?: string;
}): Promise<void> {
  await sendNotification({
    tipo: "turno_respuesta",
    titulo: data.estado === "confirmado" ? "Turno aceptado" : "Turno rechazado",
    mensaje: `${data.workerNombre} ${data.estado === "confirmado" ? "aceptó" : "rechazó"} el turno en ${data.siteNombre ?? "sitio"}.`,
    destinatarios: ["_admins"],
    shiftId: data.shiftId,
    actorUid: data.workerId,
    actorNombre: data.workerNombre,
  });
}

export async function notifyCheckIn(data: {
  workerId: string;
  workerNombre: string;
  siteNombre?: string;
  eventNombre?: string;
  attendanceId: string;
  dentroGeocerca: boolean;
}): Promise<void> {
  await sendNotification({
    tipo: "entrada",
    titulo: "Entrada registrada",
    mensaje: `${data.workerNombre} marcó entrada en ${data.siteNombre ?? "sitio"}${data.dentroGeocerca ? "" : " (revisión manual)"}.`,
    destinatarios: ["_admins", data.workerId],
    attendanceId: data.attendanceId,
  });
}

export async function notifyCheckOut(data: {
  workerId: string;
  workerNombre: string;
  siteNombre?: string;
  attendanceId: string;
}): Promise<void> {
  await sendNotification({
    tipo: "salida",
    titulo: "Salida registrada",
    mensaje: `${data.workerNombre} marcó salida en ${data.siteNombre ?? "sitio"}.`,
    destinatarios: ["_admins", data.workerId],
    attendanceId: data.attendanceId,
  });
}

export async function notifyGeofenceAlert(data: {
  workerId: string;
  workerNombre: string;
  siteNombre?: string;
  attendanceId: string;
}): Promise<void> {
  await sendNotification({
    tipo: "geocerca_alerta",
    titulo: "Fuera de geocerca",
    mensaje: `${data.workerNombre} salió del radio asignado en ${data.siteNombre ?? "sitio"}.`,
    urgente: true,
    destinatarios: ["_admins", data.workerId],
    attendanceId: data.attendanceId,
  });
}

export async function processDueBreakReminders(
  breaks: BreakSchedule[],
  now = new Date(),
): Promise<void> {
  for (const b of breaks) {
    if (b.notificado) continue;
    const inicio = new Date(b.inicio);
    if (inicio > now) continue;

    await sendNotification({
      tipo: "break_recordatorio",
      titulo: `Hora de ${b.tipo}`,
      mensaje: `Es momento de tu ${b.tipo} programado (${new Date(b.inicio).toLocaleTimeString("es-CO")} - ${new Date(b.fin).toLocaleTimeString("es-CO")}).`,
      destinatarios: [b.workerId],
      shiftId: b.shiftId,
    });

    if (DEMO_MODE) {
      demoStore.markBreakNotified(b.id);
    } else {
      await updateDoc(doc(getFirestoreDb(), "breaks", b.id), { notificado: true });
    }
  }
}
