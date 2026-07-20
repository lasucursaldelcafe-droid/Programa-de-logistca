import { useEffect, useState, useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  where,
  getDocs,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getFirestoreDb,
  getRotatingToken,
  generateAccessCode,
  isInsideGeofence,
  isWithinTimeWindow,
  parseQrPayload,
  buildQrCodeDocument,
  buildQrCodeId,
  buildQrCodeToken,
  type CreateQrCodeInput,
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
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { useSheetsPoll } from "./useSheetsPoll";
import { sheetsGetById, sheetsListAll, sheetsUpsertRecord } from "../data/sheetsOps";
import { demoStore, setDemoAccountHabilitado, setDemoAccountPassword } from "../demo/store";
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
  const sheetsWorkers = useSheetsPoll<Worker>("workers");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "workers"), orderBy("nombre")),
      (snap) => setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker))),
    );
    return unsub;
  }, []);

  const demoWorkers = useDemoSnapshot(() => demoStore.workers);
  if (isDemoMode()) return demoWorkers;
  if (isSheetsBackend()) return sheetsWorkers;
  return workers;
}

export function useShifts(): Turno[] {
  const [shifts, setShifts] = useState<Turno[]>([]);
  const sheetsShifts = useSheetsPoll<Turno>("shifts");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "shifts"), orderBy("inicio")),
      (snap) => setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Turno))),
    );
    return unsub;
  }, []);

  const demoShifts = useDemoSnapshot(() => demoStore.shifts);
  if (isDemoMode()) return demoShifts;
  if (isSheetsBackend()) return sheetsShifts;
  return shifts;
}

export function useEvents(): Evento[] {
  const [events, setEvents] = useState<Evento[]>([]);
  const sheetsEvents = useSheetsPoll<Evento>("events");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "events"), (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Evento))),
    );
    return unsub;
  }, []);

  const demoEvents = useDemoSnapshot(() => demoStore.events);
  if (isDemoMode()) return demoEvents;
  if (isSheetsBackend()) return sheetsEvents;
  return events;
}

export function useSites(): Sitio[] {
  const [sites, setSites] = useState<Sitio[]>([]);
  const sheetsSites = useSheetsPoll<Sitio>("sites");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "sites"), (snap) =>
      setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sitio))),
    );
    return unsub;
  }, []);

  const demoSites = useDemoSnapshot(() => demoStore.sites);
  if (isDemoMode()) return demoSites;
  if (isSheetsBackend()) return sheetsSites;
  return sites;
}

export async function createWorker(
  data: {
    nombre: string;
    documento: string;
    telefono: string;
    email: string;
    perfiles: PerfilTrabajo[];
    rolPlataforma?: "trabajador" | "supervisor_sitio";
  },
  actorNombre?: string,
): Promise<void> {
  const rolPlataforma = data.rolPlataforma ?? "trabajador";
  if (isDemoMode()) {
    demoStore.addWorker(
      {
        nombre: data.nombre,
        documento: data.documento,
        telefono: data.telefono,
        email: data.email.trim().toLowerCase(),
        perfiles: data.perfiles,
        rolPlataforma,
        experienciaAnios: 0,
        eventosTrabajados: 0,
        rating: 0,
        estado: "sin_asignar",
        cuentaCreada: false,
        habilitado: true,
        certificaciones: [],
        creadoEn: new Date().toISOString(),
      },
      actorNombre,
    );
    return;
  }
  const id = `worker-${Date.now().toString(36)}`;
  const worker = {
    id,
    nombre: data.nombre,
    documento: data.documento,
    telefono: data.telefono,
    email: data.email.trim().toLowerCase(),
    perfiles: JSON.stringify(data.perfiles),
    rolPlataforma,
    experienciaAnios: 0,
    eventosTrabajados: 0,
    rating: 0,
    estado: "sin_asignar" satisfies WorkerEstado,
    cuentaCreada: false,
    habilitado: true,
    certificaciones: "",
    creadoEn: new Date().toISOString(),
  };
  if (isSheetsBackend()) {
    await sheetsUpsertRecord("workers", worker);
    return;
  }
  await addDoc(collection(getFirestoreDb(), "workers"), {
    nombre: data.nombre,
    documento: data.documento,
    telefono: data.telefono,
    email: data.email.trim().toLowerCase(),
    perfiles: data.perfiles,
    rolPlataforma,
    experienciaAnios: 0,
    eventosTrabajados: 0,
    rating: 0,
    estado: "sin_asignar" satisfies WorkerEstado,
    cuentaCreada: false,
    habilitado: true,
    certificaciones: [],
    creadoEn: new Date().toISOString(),
  });
}

export async function updateWorkerEstado(
  id: string,
  estado: WorkerEstado,
  actorNombre?: string,
): Promise<void> {
  if (isDemoMode()) {
    demoStore.updateWorker(id, { estado }, actorNombre);
    return;
  }
  if (isSheetsBackend()) {
    const worker = await getWorkerById(id);
    if (worker) await sheetsUpsertRecord("workers", { ...worker, estado });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "workers", id), { estado });
}

export async function deleteWorker(id: string, actorNombre?: string): Promise<void> {
  if (isDemoMode()) {
    demoStore.removeWorker(id, actorNombre);
    return;
  }

  const db = getFirestoreDb();
  const activeSnap = await getDocs(
    query(collection(db, "attendance"), where("workerId", "==", id)),
  );
  const hasActive = activeSnap.docs.some((d) => {
    const data = d.data() as Attendance;
    return data.estado !== "cerrado";
  });
  if (hasActive) {
    throw new Error("No se puede eliminar: tiene una jornada activa. Cierra la jornada primero.");
  }

  const shiftSnap = await getDocs(
    query(collection(db, "shifts"), where("workerId", "==", id)),
  );
  await Promise.all(shiftSnap.docs.map((d) => deleteDoc(d.ref)));

  const invSnap = await getDocs(
    query(collection(db, "invitations"), where("workerId", "==", id)),
  );
  await Promise.all(invSnap.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(doc(db, "workers", id));
}

export function useChangeLog() {
  return useDemoSnapshot(() => demoStore.changeLog);
}

export async function setWorkerHabilitado(
  workerId: string,
  habilitado: boolean,
  actorNombre?: string,
): Promise<void> {
  if (isDemoMode()) {
    demoStore.updateWorker(workerId, { habilitado }, actorNombre);
    const worker = demoStore.workers.find((w) => w.id === workerId);
    if (worker?.cuentaCreada) {
      setDemoAccountHabilitado(worker.email, habilitado);
    }
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "workers", workerId), { habilitado });
}

export async function resetWorkerPassword(
  email: string,
  newPassword: string,
): Promise<void> {
  if (isDemoMode()) {
    setDemoAccountPassword(email, newPassword);
    return;
  }
  throw new Error("Restablecer contraseña en producción requiere Firebase Auth admin.");
}

export async function createShift(data: Omit<Turno, "id">): Promise<string> {
  if (isDemoMode()) {
    const id = demoStore.addShift(data);
    await notifyShiftAssigned({ id, ...data });
    return id;
  }
  if (isSheetsBackend()) {
    const id = `shift-${Date.now().toString(36)}`;
    await sheetsUpsertRecord("shifts", { ...data, id });
    await notifyShiftAssigned({ id, ...data });
    return id;
  }
  const ref = await addDoc(collection(getFirestoreDb(), "shifts"), data);
  await notifyShiftAssigned({ id: ref.id, ...data });
  return ref.id;
}

export async function updateShiftEstado(id: string, estado: ShiftEstado): Promise<void> {
  let shift: Turno | null = null;
  if (isDemoMode()) {
    shift = demoStore.shifts.find((s) => s.id === id) ?? null;
    demoStore.updateShift(id, { estado });
  } else if (isSheetsBackend()) {
    shift = (await sheetsGetById<Turno>("shifts", id)) ?? null;
    if (shift) await sheetsUpsertRecord("shifts", { ...shift, estado });
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
  const sheetsInvitations = useSheetsPoll<Invitation>("invitations");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
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
  if (isDemoMode()) return demoInvitations;
  if (isSheetsBackend()) {
    return sheetsInvitations.map((inv) => ({
      ...inv,
      id: inv.id ?? inv.token,
      token: inv.token ?? inv.id,
    }));
  }
  return invitations;
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  if (isDemoMode()) {
    return demoStore.getInvitation(token);
  }
  if (isSheetsBackend()) {
    const row = await sheetsGetById<Invitation>("invitations", token, "id");
    if (!row) return null;
    return { ...row, token: row.token ?? row.id, id: row.id ?? token };
  }
  const snap = await getDoc(doc(getFirestoreDb(), "invitations", token));
  if (!snap.exists()) return null;
  return { id: snap.id, token: snap.id, ...snap.data() } as Invitation;
}

export async function findInvitationByEmailAndCode(
  email: string,
  codigoAcceso: string,
): Promise<Invitation | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = codigoAcceso.replace(/\s/g, "").trim();

  if (isDemoMode()) {
    return demoStore.findInvitationByEmailAndCode(normalizedEmail, normalizedCode);
  }

  const q = query(
    collection(getFirestoreDb(), "invitations"),
    where("email", "==", normalizedEmail),
    where("estado", "==", "pendiente"),
  );
  const snaps = await getDocs(q);
  for (const snap of snaps.docs) {
    const inv = { id: snap.id, token: snap.id, ...snap.data() } as Invitation;
    if (inv.codigoAcceso === normalizedCode) return inv;
  }
  return null;
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

export async function createInvitation(data: {
  workerId: string;
  workerNombre: string;
  email: string;
  role: "trabajador" | "supervisor_sitio";
  creadaPor: string;
  creadaPorNombre: string;
}): Promise<{ token: string; codigoAcceso: string }> {
  const token = generateToken();
  const codigoAcceso = generateAccessCode();
  const now = new Date();
  const expira = new Date(now);
  expira.setDate(expira.getDate() + 7);

  const invitation: Omit<Invitation, "id"> = {
    token,
    workerId: data.workerId,
    workerNombre: data.workerNombre,
    email: data.email.trim().toLowerCase(),
    codigoAcceso,
    role: data.role,
    estado: "pendiente",
    creadaEn: now.toISOString(),
    expiraEn: expira.toISOString(),
    creadaPor: data.creadaPor,
    creadaPorNombre: data.creadaPorNombre,
  };

  if (isDemoMode()) {
    demoStore.addInvitation({ ...invitation, id: token });
    return { token, codigoAcceso };
  }
  if (isSheetsBackend()) {
    await sheetsUpsertRecord("invitations", { ...invitation, id: token }, "id");
    return { token, codigoAcceso };
  }

  await setDoc(doc(getFirestoreDb(), "invitations", token), invitation);
  return { token, codigoAcceso };
}

export async function revokeInvitation(token: string): Promise<void> {
  if (isDemoMode()) {
    demoStore.updateInvitation(token, { estado: "revocada" });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "invitations", token), { estado: "revocada" });
}

export async function activateAccountWithInvitation(
  token: string,
  password: string,
  codigoAcceso: string,
): Promise<AppUser> {
  if (isDemoMode()) {
    demoStore.activateAccount(token, password, codigoAcceso);
    const invitation = demoStore.getInvitation(token);
    if (!invitation?.uid) throw new Error("No se pudo activar la cuenta");
    const account = demoStore.accounts.find((a) => a.user.uid === invitation.uid);
    if (!account) throw new Error("Cuenta no encontrada tras activación");
    return account.user;
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.estado !== "pendiente") throw new Error("Esta invitación ya no está disponible");
  if (new Date(invitation.expiraEn) < new Date()) throw new Error("La invitación ha expirado");
  if (invitation.codigoAcceso !== codigoAcceso.replace(/\s/g, "").trim()) {
    throw new Error("Código de invitación incorrecto");
  }

  const cred = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    invitation.email,
    password,
  );

  const perfilCompleto = (invitation.role ?? "trabajador") === "supervisor_sitio";

  await setDoc(doc(getFirestoreDb(), "users", cred.user.uid), {
    email: invitation.email,
    nombre: invitation.workerNombre,
    role: invitation.role ?? "trabajador",
    workerId: invitation.workerId,
    perfilCompleto,
  });

  await updateDoc(doc(getFirestoreDb(), "workers", invitation.workerId), {
    cuentaCreada: true,
  });

  await updateDoc(doc(getFirestoreDb(), "invitations", token), {
    estado: "usada",
    usadaEn: new Date().toISOString(),
    uid: cred.user.uid,
  });

  return {
    uid: cred.user.uid,
    email: invitation.email,
    nombre: invitation.workerNombre,
    role: invitation.role ?? "trabajador",
    workerId: invitation.workerId,
    perfilCompleto,
  };
}

export async function completeUserProfile(data: {
  uid: string;
  nombre: string;
  telefono: string;
}): Promise<void> {
  if (isDemoMode()) {
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
  if (isDemoMode()) {
    const account = demoStore.findAccountByEmail(email);
    if (!account) throw new Error("No hay cuenta registrada con ese correo");
    return;
  }
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

/** Cambiar la contraseña del usuario con sesión activa (Firebase producción). */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (isDemoMode()) {
    const auth = getFirebaseAuth();
    const fbUser = auth.currentUser;
    if (!fbUser?.email) throw new Error("No hay sesión activa");
    setDemoAccountPassword(fbUser.email, newPassword);
    return;
  }
  if (isSheetsBackend()) {
    throw new Error("Cambio de contraseña en Sheets: contacta al administrador del sistema.");
  }
  if (newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }
  const auth = getFirebaseAuth();
  const fbUser = auth.currentUser;
  if (!fbUser?.email) throw new Error("No hay sesión activa");
  const cred = EmailAuthProvider.credential(fbUser.email, currentPassword);
  await reauthenticateWithCredential(fbUser, cred);
  await updatePassword(fbUser, newPassword);
}

export async function getWorkerById(workerId: string): Promise<Worker | null> {
  if (isDemoMode()) {
    return demoStore.workers.find((w) => w.id === workerId) ?? null;
  }
  if (isSheetsBackend()) {
    return sheetsGetById<Worker>("workers", workerId);
  }
  const snap = await getDoc(doc(getFirestoreDb(), "workers", workerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Worker;
}

export async function getSiteById(siteId: string): Promise<Sitio | null> {
  if (isDemoMode()) return demoStore.sites.find((s) => s.id === siteId) ?? null;
  if (isSheetsBackend()) return sheetsGetById<Sitio>("sites", siteId);
  const snap = await getDoc(doc(getFirestoreDb(), "sites", siteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Sitio;
}

export function useQrCodes(): QrCode[] {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const sheetsQr = useSheetsPoll<QrCode>("qrCodes");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "qrCodes"), orderBy("creadoEn", "desc")),
      (snap) => setQrCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as QrCode))),
    );
    return unsub;
  }, []);

  const demoQr = useDemoSnapshot(() => demoStore.qrCodes);
  if (isDemoMode()) return demoQr;
  if (isSheetsBackend()) return sheetsQr;
  return qrCodes;
}

export function useAttendances(): Attendance[] {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const sheetsAtt = useSheetsPoll<Attendance>("attendance");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "attendance"), orderBy("creadoEn", "desc")),
      (snap) =>
        setAttendances(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attendance))),
    );
    return unsub;
  }, []);

  const demoAtt = useDemoSnapshot(() => demoStore.attendances);
  if (isDemoMode()) return demoAtt;
  if (isSheetsBackend()) return sheetsAtt;
  return attendances;
}

export async function getQrCodeById(qrId: string): Promise<QrCode | null> {
  if (isDemoMode()) return demoStore.qrCodes.find((q) => q.id === qrId) ?? null;
  if (isSheetsBackend()) return sheetsGetById<QrCode>("qrCodes", qrId);
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

export async function createQrCode(data: CreateQrCodeInput): Promise<string> {
  const id = buildQrCodeId(data.siteId);
  const token = buildQrCodeToken(crypto.randomUUID());
  const secret = data.modo === "rotativo" ? crypto.randomUUID().slice(0, 8) : undefined;

  const qr = buildQrCodeDocument(data, { token, secret });

  if (isDemoMode()) {
    demoStore.addQrCode({ ...qr, id });
    return id;
  }
  if (isSheetsBackend()) {
    await sheetsUpsertRecord("qrCodes", { ...qr, id });
    return id;
  }
  await setDoc(doc(getFirestoreDb(), "qrCodes", id), qr);
  return id;
}

export async function deactivateQrCode(qrId: string): Promise<void> {
  if (isDemoMode()) {
    demoStore.updateQrCode(qrId, { activo: false });
    return;
  }
  if (isSheetsBackend()) {
    const qr = await getQrCodeById(qrId);
    if (qr) await sheetsUpsertRecord("qrCodes", { ...qr, activo: false });
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

  if (isDemoMode()) {
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

  if (isSheetsBackend()) {
    const attendanceId = `att-${Date.now().toString(36)}`;
    await sheetsUpsertRecord("attendance", {
      id: attendanceId,
      workerId: data.workerId,
      workerNombre: data.workerNombre,
      shiftId: shift.id,
      siteId: qr.siteId,
      siteNombre: qr.siteNombre,
      eventId: qr.eventId,
      eventNombre: qr.eventNombre,
      qrId: qr.id,
      estado,
      entrada: JSON.stringify(entrada),
      ubicacionActual: JSON.stringify(data.position),
      alertasGeocerca: "",
      creadoEn: new Date().toISOString(),
    });
    await sheetsUpsertRecord("workers", {
      ...(await getWorkerById(data.workerId)),
      id: data.workerId,
      estado: "en_sitio",
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
  if (isDemoMode()) {
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

  if (isSheetsBackend()) {
    const att = await sheetsGetById<Attendance>("attendance", attendanceId);
    if (!att) throw new Error("Jornada no encontrada");
    const site = await getSiteById(att.siteId);
    const dentro = site
      ? isInsideGeofence(position, { lat: site.lat, lng: site.lng }, site.radioGeocerca)
      : true;
    const salida = {
      timestamp: new Date().toISOString(),
      lat: position.lat,
      lng: position.lng,
      dentroGeocerca: dentro,
    };
    await sheetsUpsertRecord("attendance", {
      ...att,
      estado: "cerrado",
      salida: JSON.stringify(salida),
    });
    const worker = await getWorkerById(att.workerId);
    if (worker) {
      await sheetsUpsertRecord("workers", { ...worker, estado: "sin_asignar" });
    }
    await notifyCheckOut({
      workerId: att.workerId,
      workerNombre: att.workerNombre ?? att.workerId,
      siteNombre: att.siteNombre,
      attendanceId,
    });
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
  if (isDemoMode()) {
    demoStore.updateAttendanceLocation(attendanceId, position, dentroGeocerca);
    return;
  }
  if (isSheetsBackend()) {
    const att = await sheetsGetById<Attendance>("attendance", attendanceId);
    if (att) {
      await sheetsUpsertRecord("attendance", {
        ...att,
        ubicacionActual: JSON.stringify(position),
        estado: dentroGeocerca ? "activo" : "fuera_geocerca",
      });
    }
    return;
  }

  const patch: Record<string, unknown> = {
    ubicacionActual: { lat: position.lat, lng: position.lng },
    estado: dentroGeocerca ? "activo" : "fuera_geocerca",
  };
  await updateDoc(doc(getFirestoreDb(), "attendance", attendanceId), patch);
}

export async function recordGeofenceAlert(attendanceId: string): Promise<void> {
  if (isDemoMode()) {
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

  if (isDemoMode()) {
    demoStore.addEvent({ ...evento, id });
    return id;
  }
  if (isSheetsBackend()) {
    await sheetsUpsertRecord("events", { ...evento, id, sitioIds: "" });
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "events", id), evento);
  return id;
}

export async function createSite(data: {
  eventId: string;
  nombre: string;
  direccion?: string;
  lat: number;
  lng: number;
  radioGeocerca: number;
}): Promise<string> {
  const id = `site-${Date.now().toString(36)}`;
  const site = {
    eventId: data.eventId,
    nombre: data.nombre,
    ...(data.direccion?.trim() ? { direccion: data.direccion.trim() } : {}),
    lat: data.lat,
    lng: data.lng,
    radioGeocerca: data.radioGeocerca,
  };

  if (isDemoMode()) {
    demoStore.addSite({ ...site, id });
    return id;
  }
  if (isSheetsBackend()) {
    await sheetsUpsertRecord("sites", { ...site, id });
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
    if (isDemoMode()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "reports"), orderBy("creadoEn", "desc")),
      (snap) => setReportes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reporte))),
    );
    return unsub;
  }, []);

  const demoReportes = useDemoSnapshot(() => demoStore.reportes);
  return isDemoMode() ? demoReportes : reportes;
}

export function usePlatformUsers(): AppUser[] {
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (isDemoMode()) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser))),
    );
    return unsub;
  }, []);

  const demoUsers = useDemoSnapshot(() => demoStore.platformUsers);
  return isDemoMode() ? demoUsers : users;
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

  if (isDemoMode()) {
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

  if (isDemoMode()) {
    demoStore.updateReporte(reporteId, patch);
    return;
  }

  await updateDoc(doc(getFirestoreDb(), "reports", reporteId), patch);
}
