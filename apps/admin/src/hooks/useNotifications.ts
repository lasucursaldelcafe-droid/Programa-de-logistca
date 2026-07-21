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
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { demoStore } from "../demo/store";
import { sheetsGetById, sheetsUpsertRecord } from "../data/sheetsOps";
import { useSheetsPoll } from "./useSheetsPoll";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

function parseNotification(raw: Record<string, unknown>): AppNotification {
  let destinatarios: string[] = [];
  let leidaPor: string[] = [];

  if (Array.isArray(raw.destinatarios)) {
    destinatarios = raw.destinatarios as string[];
  } else if (typeof raw.destinatarios === "string" && raw.destinatarios.trim()) {
    try {
      destinatarios = JSON.parse(raw.destinatarios) as string[];
    } catch {
      destinatarios = raw.destinatarios.split(",").filter(Boolean);
    }
  }

  if (Array.isArray(raw.leidaPor)) {
    leidaPor = raw.leidaPor as string[];
  } else if (typeof raw.leidaPor === "string" && raw.leidaPor.trim()) {
    try {
      leidaPor = JSON.parse(raw.leidaPor) as string[];
    } catch {
      leidaPor = raw.leidaPor.split(",").filter(Boolean);
    }
  }

  return {
    id: String(raw.id ?? ""),
    tipo: raw.tipo as NotificationTipo,
    titulo: String(raw.titulo ?? ""),
    mensaje: String(raw.mensaje ?? ""),
    timestamp: String(raw.timestamp ?? ""),
    urgente: raw.urgente === true || raw.urgente === "true",
    destinatarios,
    shiftId: raw.shiftId ? String(raw.shiftId) : undefined,
    eventId: raw.eventId ? String(raw.eventId) : undefined,
    siteId: raw.siteId ? String(raw.siteId) : undefined,
    attendanceId: raw.attendanceId ? String(raw.attendanceId) : undefined,
    actorUid: raw.actorUid ? String(raw.actorUid) : undefined,
    actorNombre: raw.actorNombre ? String(raw.actorNombre) : undefined,
    leidaPor,
    accionTurno: raw.accionTurno === true || raw.accionTurno === "true",
  };
}

function serializeNotification(
  id: string,
  data: Omit<AppNotification, "id">,
): Record<string, unknown> {
  return {
    id,
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    timestamp: data.timestamp,
    urgente: data.urgente,
    destinatarios: JSON.stringify(data.destinatarios),
    shiftId: data.shiftId ?? "",
    eventId: data.eventId ?? "",
    siteId: data.siteId ?? "",
    attendanceId: data.attendanceId ?? "",
    actorUid: data.actorUid ?? "",
    actorNombre: data.actorNombre ?? "",
    leidaPor: JSON.stringify(data.leidaPor),
    accionTurno: data.accionTurno ?? false,
  };
}

export function useNotifications(user: AppUser | null): AppNotification[] {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const sheetsNotifications = useSheetsPoll<Record<string, unknown>>("notifications");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend() || !user) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "notifications"), orderBy("timestamp", "desc")),
      (snap) =>
        setNotifications(
          snap.docs.map((d) =>
            parseNotification({ id: d.id, ...(d.data() as Record<string, unknown>) }),
          ),
        ),
      (err) => {
        console.error("No se pudieron cargar notificaciones:", err);
        setNotifications([]);
      },
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!isSheetsBackend()) return;
    const parsed = sheetsNotifications
      .map((row) => parseNotification(row))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    setNotifications(parsed);
  }, [sheetsNotifications]);

  const demoNotifications = useDemoSnapshot(() => demoStore.notifications);

  return useMemo(() => {
    const all = isDemoMode() ? demoNotifications : notifications;
    if (!user) return [];
    return all.filter((n) => notificationVisibleTo(n, user));
  }, [demoNotifications, notifications, user]);
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
  // Firestore rechaza undefined en campos opcionales.
  const payload: Record<string, unknown> = {
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    timestamp: new Date().toISOString(),
    urgente: data.urgente ?? false,
    destinatarios: data.destinatarios,
    leidaPor: [] as string[],
    accionTurno: data.accionTurno ?? false,
  };
  if (data.shiftId) payload.shiftId = data.shiftId;
  if (data.eventId) payload.eventId = data.eventId;
  if (data.siteId) payload.siteId = data.siteId;
  if (data.attendanceId) payload.attendanceId = data.attendanceId;
  if (data.actorUid) payload.actorUid = data.actorUid;
  if (data.actorNombre) payload.actorNombre = data.actorNombre;

  if (isDemoMode()) {
    demoStore.addNotification(payload as Omit<AppNotification, "id">);
    return;
  }

  if (isSheetsBackend()) {
    const id = `notif-${Date.now().toString(36)}`;
    await sheetsUpsertRecord(
      "notifications",
      serializeNotification(id, payload as Omit<AppNotification, "id">),
      "id",
    );
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
  if (isDemoMode()) {
    demoStore.markNotificationRead(notificationId, uid);
    return;
  }

  if (isSheetsBackend()) {
    const row = await sheetsGetById<Record<string, unknown>>("notifications", notificationId);
    if (!row) return;
    const notif = parseNotification(row);
    if (notif.leidaPor.includes(uid)) return;
    await sheetsUpsertRecord(
      "notifications",
      serializeNotification(notificationId, {
        ...notif,
        leidaPor: [...notif.leidaPor, uid],
      }),
      "id",
    );
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
  if (isDemoMode()) {
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
    if (isDemoMode()) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "breaks"), (snap) =>
      setBreaks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BreakSchedule))),
    );
    return unsub;
  }, []);

  const demoBreaks = useDemoSnapshot(() => demoStore.breaks);
  return isDemoMode() ? demoBreaks : breaks;
}

export async function saveFcmToken(uid: string, token: string): Promise<void> {
  if (isDemoMode() || isSheetsBackend()) return;
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
    mensaje: `${data.workerNombre} marcó entrada en ${data.siteNombre ?? "sitio"}${data.dentroGeocerca ? "" : " (revisión manual — fuera de geocerca)"}.`,
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

export async function notifyLlegadaSitio(data: {
  workerId: string;
  workerNombre: string;
  siteNombre?: string;
  eventNombre?: string;
  attendanceId: string;
}): Promise<void> {
  await sendNotification({
    tipo: "llegada_sitio",
    titulo: "Llegada al área asignada",
    mensaje: `${data.workerNombre} ingresó al radio del sitio ${data.siteNombre ?? "asignado"} (${data.eventNombre ?? "evento"}).`,
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
    mensaje: `${data.workerNombre} se movió fuera del radio asignado en ${data.siteNombre ?? "sitio"}.`,
    urgente: true,
    destinatarios: ["_admins", data.workerId],
    attendanceId: data.attendanceId,
  });
}

export async function notifyReentradaGeocerca(data: {
  workerId: string;
  workerNombre: string;
  siteNombre?: string;
  attendanceId: string;
}): Promise<void> {
  await sendNotification({
    tipo: "reentrada_geocerca",
    titulo: "Re-entrada al sitio",
    mensaje: `${data.workerNombre} volvió al área asignada en ${data.siteNombre ?? "sitio"}.`,
    destinatarios: ["_admins", data.workerId],
    attendanceId: data.attendanceId,
  });
}

export async function notifyReporteTrabajador(data: {
  workerId: string;
  workerNombre: string;
  siteNombre?: string;
  tipo: string;
  mensaje: string;
  reporteId: string;
}): Promise<void> {
  await sendNotification({
    tipo: "reporte_trabajador",
    titulo: `Reporte: ${data.tipo}`,
    mensaje: `${data.workerNombre}${data.siteNombre ? ` (${data.siteNombre})` : ""}: ${data.mensaje}`,
    urgente: true,
    destinatarios: ["_admins"],
    actorUid: data.workerId,
    actorNombre: data.workerNombre,
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

    if (isDemoMode()) {
      demoStore.markBreakNotified(b.id);
    } else {
      await updateDoc(doc(getFirestoreDb(), "breaks", b.id), { notificado: true });
    }
  }
}
