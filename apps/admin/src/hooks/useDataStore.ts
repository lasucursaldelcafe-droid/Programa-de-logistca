import { useEffect, useState, useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getFirestoreDb,
  getRotatingToken,
  isInsideGeofence,
  isWithinTimeWindow,
  parseQrPayload,
  type Attendance,
  type AttendanceEstado,
  type Evento,
  type Invitation,
  type PerfilTrabajo,
  type QrCode,
  type QrModo,
  type ShiftEstado,
  type Sitio,
  type Turno,
  type Worker,
  type WorkerEstado,
  type Reporte,
  type ReporteEstado,
  type ReporteTipo,
  type AppUser,
} from "@spe/shared";
import type { GeoPosition } from "../lib/geolocation";
import { DEMO_MODE } from "../lib/mode";
import { demoStore } from "../demo/store";
import {
  notifyCheckIn,
  notifyCheckOut,
  notifyGeofenceAlert,
  notifyShiftAssigned,
  notifyShiftResponse,
} from "./useNotifications";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function useWorkers(): Worker[] {
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "workers"), orderBy("nombre")),
      (snap) => setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker))),
    );
    return unsub;
  }, []);

  const demoWorkers = useDemoSnapshot(() => demoStore.workers);
  return DEMO_MODE ? demoWorkers : workers;
}

export function useShifts(): Turno[] {
  const [shifts, setShifts] = useState<Turno[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "shifts"), orderBy("inicio")),
      (snap) => setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Turno))),
    );
    return unsub;
  }, []);

  const demoShifts = useDemoSnapshot(() => demoStore.shifts);
  return DEMO_MODE ? demoShifts : shifts;
}

export function useEvents(): Evento[] {
  const [events, setEvents] = useState<Evento[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "events"), (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Evento))),
    );
    return unsub;
  }, []);

  const demoEvents = useDemoSnapshot(() => demoStore.events);
  return DEMO_MODE ? demoEvents : events;
}

export function useSites(): Sitio[] {
  const [sites, setSites] = useState<Sitio[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "sites"), (snap) =>
      setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sitio))),
    );
    return unsub;
  }, []);

  const demoSites = useDemoSnapshot(() => demoStore.sites);
  return DEMO_MODE ? demoSites : sites;
}

export async function createWorker(data: {
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  perfiles: PerfilTrabajo[];
}): Promise<void> {
  if (DEMO_MODE) {
    demoStore.addWorker({
      ...data,
      experienciaAnios: 0,
      eventosTrabajados: 0,
      rating: 0,
      estado: "sin_asignar",
      cuentaCreada: false,
      certificaciones: [],
      creadoEn: new Date().toISOString(),
    });
    return;
  }
  await addDoc(collection(getFirestoreDb(), "workers"), {
    ...data,
    experienciaAnios: 0,
    eventosTrabajados: 0,
    rating: 0,
    estado: "sin_asignar" satisfies WorkerEstado,
    cuentaCreada: false,
    certificaciones: [],
    creadoEn: new Date().toISOString(),
  });
}

export async function updateWorkerEstado(id: string, estado: WorkerEstado): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateWorker(id, { estado });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "workers", id), { estado });
}

export async function createShift(data: Omit<Turno, "id">): Promise<string> {
  if (DEMO_MODE) {
    const id = demoStore.addShift(data);
    await notifyShiftAssigned({ id, ...data });
    return id;
  }
  const ref = await addDoc(collection(getFirestoreDb(), "shifts"), data);
  await notifyShiftAssigned({ id: ref.id, ...data });
  return ref.id;
}

export async function updateShiftEstado(id: string, estado: ShiftEstado): Promise<void> {
  let shift: Turno | null = null;
  if (DEMO_MODE) {
    shift = demoStore.shifts.find((s) => s.id === id) ?? null;
    demoStore.updateShift(id, { estado });
  } else {
    const snap = await getDoc(doc(getFirestoreDb(), "shifts", id));
    if (snap.exists()) shift = { id: snap.id, ...snap.data() } as Turno;
    await updateDoc(doc(getFirestoreDb(), "shifts", id), { estado });
  }

  if (shift && (estado === "confirmado" || estado === "rechazado")) {
    await notifyShiftResponse({
      shiftId: id,
      workerId: shift.workerId,
      workerNombre: shift.workerNombre ?? shift.workerId,
      estado,
      eventNombre: shift.eventNombre,
      siteNombre: shift.siteNombre,
    });
  }
}

export function useInvitations(): Invitation[] {
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "invitations"), orderBy("creadaEn", "desc")),
      (snap) =>
        setInvitations(
          snap.docs.map(
            (d) =>
              ({
                id: d.id,
                token: d.id,
                ...d.data(),
              }) as Invitation,
          ),
        ),
    );
    return unsub;
  }, []);

  const demoInvitations = useDemoSnapshot(() => demoStore.invitations);
  return DEMO_MODE ? demoInvitations : invitations;
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  if (DEMO_MODE) {
    return demoStore.getInvitation(token);
  }
  const snap = await getDoc(doc(getFirestoreDb(), "invitations", token));
  if (!snap.exists()) return null;
  return { id: snap.id, token: snap.id, ...snap.data() } as Invitation;
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

export async function createInvitation(data: {
  workerId: string;
  workerNombre: string;
  email: string;
  creadaPor: string;
  creadaPorNombre: string;
}): Promise<string> {
  const token = generateToken();
  const now = new Date();
  const expira = new Date(now);
  expira.setDate(expira.getDate() + 7);

  const invitation: Omit<Invitation, "id"> = {
    token,
    workerId: data.workerId,
    workerNombre: data.workerNombre,
    email: data.email,
    estado: "pendiente",
    creadaEn: now.toISOString(),
    expiraEn: expira.toISOString(),
    creadaPor: data.creadaPor,
    creadaPorNombre: data.creadaPorNombre,
  };

  if (DEMO_MODE) {
    demoStore.addInvitation({ ...invitation, id: token });
    return token;
  }

  await setDoc(doc(getFirestoreDb(), "invitations", token), invitation);
  return token;
}

export async function revokeInvitation(token: string): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateInvitation(token, { estado: "revocada" });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "invitations", token), { estado: "revocada" });
}

export async function activateAccountWithInvitation(
  token: string,
  password: string,
): Promise<void> {
  if (DEMO_MODE) {
    demoStore.activateAccount(token, password);
    return;
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.estado !== "pendiente") throw new Error("Esta invitación ya no está disponible");
  if (new Date(invitation.expiraEn) < new Date()) throw new Error("La invitación ha expirado");

  const cred = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    invitation.email,
    password,
  );

  await setDoc(doc(getFirestoreDb(), "users", cred.user.uid), {
    email: invitation.email,
    nombre: invitation.workerNombre,
    role: "trabajador",
    workerId: invitation.workerId,
    perfilCompleto: false,
  });

  await updateDoc(doc(getFirestoreDb(), "workers", invitation.workerId), {
    cuentaCreada: true,
  });

  await updateDoc(doc(getFirestoreDb(), "invitations", token), {
    estado: "usada",
    usadaEn: new Date().toISOString(),
    uid: cred.user.uid,
  });
}

export async function completeUserProfile(data: {
  uid: string;
  nombre: string;
  telefono: string;
}): Promise<void> {
  if (DEMO_MODE) {
    demoStore.completeProfile(data.uid, data);
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "users", data.uid), {
    nombre: data.nombre,
    telefono: data.telefono,
    perfilCompleto: true,
  });
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (DEMO_MODE) {
    const account = demoStore.findAccountByEmail(email);
    if (!account) throw new Error("No hay cuenta registrada con ese correo");
    return;
  }
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function getWorkerById(workerId: string): Promise<Worker | null> {
  if (DEMO_MODE) {
    return demoStore.workers.find((w) => w.id === workerId) ?? null;
  }
  const snap = await getDoc(doc(getFirestoreDb(), "workers", workerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Worker;
}

export async function getSiteById(siteId: string): Promise<Sitio | null> {
  if (DEMO_MODE) return demoStore.sites.find((s) => s.id === siteId) ?? null;
  const snap = await getDoc(doc(getFirestoreDb(), "sites", siteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Sitio;
}

export function useQrCodes(): QrCode[] {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "qrCodes"), orderBy("creadoEn", "desc")),
      (snap) => setQrCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as QrCode))),
    );
    return unsub;
  }, []);

  const demoQr = useDemoSnapshot(() => demoStore.qrCodes);
  return DEMO_MODE ? demoQr : qrCodes;
}

export function useAttendances(): Attendance[] {
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "attendance"), orderBy("creadoEn", "desc")),
      (snap) =>
        setAttendances(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attendance))),
    );
    return unsub;
  }, []);

  const demoAtt = useDemoSnapshot(() => demoStore.attendances);
  return DEMO_MODE ? demoAtt : attendances;
}

export async function getQrCodeById(qrId: string): Promise<QrCode | null> {
  if (DEMO_MODE) return demoStore.qrCodes.find((q) => q.id === qrId) ?? null;
  const snap = await getDoc(doc(getFirestoreDb(), "qrCodes", qrId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as QrCode;
}

function resolveToken(qr: QrCode, token: string): boolean {
  if (!qr.activo) return false;
  if (qr.modo === "rotativo" && qr.secret && qr.intervaloRotacionSegundos) {
    const expected = getRotatingToken(qr.id, qr.secret, qr.intervaloRotacionSegundos);
    return token === expected;
  }
  return token === qr.token;
}

export async function createQrCode(data: {
  eventId: string;
  eventNombre: string;
  siteId: string;
  siteNombre: string;
  modo: QrModo;
  ventanaInicio: string;
  ventanaFin: string;
  radioGeocerca: number;
  descripcionDatos: string;
  intervaloRotacionSegundos?: number;
  creadoPor: string;
}): Promise<string> {
  const id = `qr-${data.siteId}-${Date.now().toString(36)}`;
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const secret = data.modo === "rotativo" ? crypto.randomUUID().slice(0, 8) : undefined;

  const qr: Omit<QrCode, "id"> = {
    eventId: data.eventId,
    eventNombre: data.eventNombre,
    siteId: data.siteId,
    siteNombre: data.siteNombre,
    token,
    secret,
    modo: data.modo,
    intervaloRotacionSegundos: data.intervaloRotacionSegundos,
    ventanaInicio: data.ventanaInicio,
    ventanaFin: data.ventanaFin,
    radioGeocerca: data.radioGeocerca,
    descripcionDatos: data.descripcionDatos,
    activo: true,
    creadoEn: new Date().toISOString(),
    creadoPor: data.creadoPor,
  };

  if (DEMO_MODE) {
    demoStore.addQrCode({ ...qr, id });
    return id;
  }
  await setDoc(doc(getFirestoreDb(), "qrCodes", id), qr);
  return id;
}

export async function deactivateQrCode(qrId: string): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateQrCode(qrId, { activo: false });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "qrCodes", qrId), { activo: false });
}

export function findShiftForCheckin(
  shifts: Turno[],
  workerId: string,
  siteId: string,
): Turno | null {
  const now = new Date();
  return (
    shifts.find(
      (s) =>
        s.workerId === workerId &&
        s.siteId === siteId &&
        s.estado === "confirmado" &&
        new Date(s.inicio) <= now &&
        new Date(s.fin) >= now,
    ) ?? null
  );
}

export async function checkInWithQr(data: {
  rawQr: string;
  workerId: string;
  workerNombre: string;
  shifts: Turno[];
  position: GeoPosition;
}): Promise<string> {
  const parsed = parseQrPayload(data.rawQr);
  if (!parsed) throw new Error("Código QR inválido");

  const qr = await getQrCodeById(parsed.qrId);
  if (!qr) throw new Error("Código QR no encontrado");
  if (!resolveToken(qr, parsed.token)) throw new Error("Token QR inválido o expirado");
  if (!isWithinTimeWindow(qr.ventanaInicio, qr.ventanaFin)) {
    throw new Error("El código QR no está vigente en este horario");
  }

  const shift = findShiftForCheckin(data.shifts, data.workerId, qr.siteId);
  if (!shift) throw new Error("No tienes un turno confirmado en este sitio ahora");

  const site = await getSiteById(qr.siteId);
  if (!site) throw new Error("Sitio no encontrado");

  const dentro = isInsideGeofence(
    data.position,
    { lat: site.lat, lng: site.lng },
    qr.radioGeocerca,
  );

  const estado: AttendanceEstado = dentro ? "activo" : "revision_manual";
  const entrada = {
    timestamp: new Date().toISOString(),
    lat: data.position.lat,
    lng: data.position.lng,
    dentroGeocerca: dentro,
  };

  if (DEMO_MODE) {
    const attendanceId = demoStore.checkIn({
      workerId: data.workerId,
      workerNombre: data.workerNombre,
      shift,
      qr,
      estado,
      entrada,
      position: data.position,
    });
    await notifyCheckIn({
      workerId: data.workerId,
      workerNombre: data.workerNombre,
      siteNombre: qr.siteNombre,
      eventNombre: qr.eventNombre,
      attendanceId,
      dentroGeocerca: dentro,
    });
    return attendanceId;
  }

  const ref = await addDoc(collection(getFirestoreDb(), "attendance"), {
    workerId: data.workerId,
    workerNombre: data.workerNombre,
    shiftId: shift.id,
    siteId: qr.siteId,
    siteNombre: qr.siteNombre,
    eventId: qr.eventId,
    eventNombre: qr.eventNombre,
    qrId: qr.id,
    estado,
    entrada,
    ubicacionActual: data.position,
    alertasGeocerca: [],
    creadoEn: new Date().toISOString(),
  });

  await addDoc(collection(getFirestoreDb(), "consents"), {
    workerId: data.workerId,
    qrId: qr.id,
    eventId: qr.eventId,
    timestamp: new Date().toISOString(),
    aceptado: true,
    versionDescripcionDatos: qr.descripcionDatos,
  });

  await updateDoc(doc(getFirestoreDb(), "workers", data.workerId), { estado: "en_sitio" });
  await notifyCheckIn({
    workerId: data.workerId,
    workerNombre: data.workerNombre,
    siteNombre: qr.siteNombre,
    eventNombre: qr.eventNombre,
    attendanceId: ref.id,
    dentroGeocerca: dentro,
  });
  return ref.id;
}

export async function checkOut(attendanceId: string, position: GeoPosition): Promise<void> {
  if (DEMO_MODE) {
    const att = demoStore.attendances.find((a) => a.id === attendanceId);
    demoStore.checkOut(attendanceId, position);
    if (att) {
      await notifyCheckOut({
        workerId: att.workerId,
        workerNombre: att.workerNombre ?? att.workerId,
        siteNombre: att.siteNombre,
        attendanceId,
      });
    }
    return;
  }

  const snap = await getDoc(doc(getFirestoreDb(), "attendance", attendanceId));
  if (!snap.exists()) throw new Error("Jornada no encontrada");
  const attendance = { id: snap.id, ...snap.data() } as Attendance;
  const siteSnap = await getDoc(doc(getFirestoreDb(), "sites", attendance.siteId));
  const site = siteSnap.data() as Sitio;

  const dentro = site
    ? isInsideGeofence(position, { lat: site.lat, lng: site.lng }, site.radioGeocerca)
    : true;

  await updateDoc(doc(getFirestoreDb(), "attendance", attendanceId), {
    estado: "cerrado",
    salida: {
      timestamp: new Date().toISOString(),
      lat: position.lat,
      lng: position.lng,
      dentroGeocerca: dentro,
    },
  });

  await updateDoc(doc(getFirestoreDb(), "workers", attendance.workerId), {
    estado: "sin_asignar",
  });

  await notifyCheckOut({
    workerId: attendance.workerId,
    workerNombre: attendance.workerNombre ?? attendance.workerId,
    siteNombre: attendance.siteNombre,
    attendanceId,
  });
}

export async function updateAttendanceLocation(
  attendanceId: string,
  position: GeoPosition,
  dentroGeocerca: boolean,
): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateAttendanceLocation(attendanceId, position, dentroGeocerca);
    return;
  }

  const patch: Record<string, unknown> = {
    ubicacionActual: { lat: position.lat, lng: position.lng },
    estado: dentroGeocerca ? "activo" : "fuera_geocerca",
  };
  await updateDoc(doc(getFirestoreDb(), "attendance", attendanceId), patch);
}

export async function recordGeofenceAlert(attendanceId: string): Promise<void> {
  if (DEMO_MODE) {
    const att = demoStore.attendances.find((a) => a.id === attendanceId);
    const hadAlerts = (att?.alertasGeocerca.length ?? 0) > 0;
    demoStore.recordGeofenceAlert(attendanceId);
    if (att && !hadAlerts) {
      await notifyGeofenceAlert({
        workerId: att.workerId,
        workerNombre: att.workerNombre ?? att.workerId,
        siteNombre: att.siteNombre,
        attendanceId,
      });
    }
    return;
  }

  const snap = await getDoc(doc(getFirestoreDb(), "attendance", attendanceId));
  if (!snap.exists()) return;
  const data = snap.data();
  const attendance = { id: snap.id, ...data } as Attendance;
  const alertas = (data.alertasGeocerca as string[] | undefined) ?? [];
  const now = new Date().toISOString();
  if (alertas.length > 0 && alertas[alertas.length - 1] === now) return;

  const isFirstAlert = alertas.length === 0;

  await updateDoc(doc(getFirestoreDb(), "attendance", attendanceId), {
    estado: "fuera_geocerca",
    alertasGeocerca: [...alertas, now],
  });

  if (isFirstAlert) {
    await notifyGeofenceAlert({
      workerId: attendance.workerId,
      workerNombre: attendance.workerNombre ?? attendance.workerId,
      siteNombre: attendance.siteNombre,
      attendanceId,
    });
  }
}

export function getActiveAttendance(
  attendances: Attendance[],
  workerId: string,
): Attendance | null {
  return (
    attendances.find(
      (a) =>
        a.workerId === workerId &&
        a.estado !== "cerrado",
    ) ?? null
  );
}

export async function createEvent(data: {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}): Promise<string> {
  const id = `event-${Date.now().toString(36)}`;
  const evento = {
    nombre: data.nombre,
    fechaInicio: new Date(data.fechaInicio).toISOString(),
    fechaFin: new Date(data.fechaFin).toISOString(),
    sitioIds: [] as string[],
  };

  if (DEMO_MODE) {
    demoStore.addEvent({ ...evento, id });
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "events", id), evento);
  return id;
}

export async function createSite(data: {
  eventId: string;
  nombre: string;
  lat: number;
  lng: number;
  radioGeocerca: number;
}): Promise<string> {
  const id = `site-${Date.now().toString(36)}`;
  const site = {
    eventId: data.eventId,
    nombre: data.nombre,
    lat: data.lat,
    lng: data.lng,
    radioGeocerca: data.radioGeocerca,
  };

  if (DEMO_MODE) {
    demoStore.addSite({ ...site, id });
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "sites", id), site);
  const eventRef = doc(getFirestoreDb(), "events", data.eventId);
  const eventSnap = await getDoc(eventRef);
  if (eventSnap.exists()) {
    const sitioIds = (eventSnap.data().sitioIds as string[] | undefined) ?? [];
    if (!sitioIds.includes(id)) {
      await updateDoc(eventRef, { sitioIds: [...sitioIds, id] });
    }
  }
  return id;
}

export function useReportes(): Reporte[] {
  const [reportes, setReportes] = useState<Reporte[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "reports"), orderBy("creadoEn", "desc")),
      (snap) => setReportes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reporte))),
    );
    return unsub;
  }, []);

  const demoReportes = useDemoSnapshot(() => demoStore.reportes);
  return DEMO_MODE ? demoReportes : reportes;
}

export function usePlatformUsers(): AppUser[] {
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser))),
    );
    return unsub;
  }, []);

  const demoUsers = useDemoSnapshot(() => demoStore.accounts.map((a) => a.user));
  return DEMO_MODE ? demoUsers : users;
}

export async function createReporte(data: {
  workerId: string;
  workerNombre: string;
  shiftId?: string;
  siteId?: string;
  siteNombre?: string;
  eventId?: string;
  tipo: ReporteTipo;
  mensaje: string;
}): Promise<string> {
  const id = `rep-${Date.now().toString(36)}`;
  const reporte: Omit<Reporte, "id"> = {
    ...data,
    estado: "abierto",
    creadoEn: new Date().toISOString(),
  };

  if (DEMO_MODE) {
    demoStore.addReporte({ ...reporte, id });
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "reports", id), reporte);
  return id;
}

export async function updateReporteEstado(
  reporteId: string,
  estado: ReporteEstado,
  actor: { uid: string; nombre: string },
): Promise<void> {
  const patch: Partial<Reporte> = { estado };
  if (estado === "resuelto") {
    patch.resueltoEn = new Date().toISOString();
    patch.resueltoPor = actor.uid;
    patch.resueltoPorNombre = actor.nombre;
  }

  if (DEMO_MODE) {
    demoStore.updateReporte(reporteId, patch);
    return;
  }

  await updateDoc(doc(getFirestoreDb(), "reports", reporteId), patch);
}
