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
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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
  type UserRole,
  type CustomRole,
  type CustomRoleBase,
  type RoleAccessMode,
  type SpePermission,
  ROLE_TEMPLATES,
  roleTemplateDisplayName,
  parseCustomRolePermisos,
  serializeCustomRolePermisos,
  getFirebaseApp,
  workerDocumentPassword,
  type WorkerBulkImportResult,
  type WorkerImportRow,
  puedeAsignarRol,
  rolesCuentaPlataforma,
  normalizeUserRole,
} from "@spe/shared";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { GeoPosition } from "../lib/geolocation";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { useSheetsPoll } from "./useSheetsPoll";
import { sheetsGetById, sheetsListAll, sheetsUpsertRecord, sheetsDeleteRecord } from "../data/sheetsOps";
import { demoStore, setDemoAccountHabilitado, setDemoAccountPassword } from "../demo/store";
import {
  notifyCheckIn,
  notifyCheckOut,
  notifyGeofenceAlert,
  notifyLlegadaSitio,
  notifyReentradaGeocerca,
  notifyReporteTrabajador,
  notifyShiftAssigned,
  notifyShiftResponse,
} from "./useNotifications";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function useWorkers(): Worker[] {
  return useWorkersState().workers;
}

export function useWorkersState(): { workers: Worker[]; loading: boolean } {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(() => !isDemoMode() && !isSheetsBackend());
  const sheetsWorkers = useSheetsPoll<Worker>("workers");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "workers"), orderBy("nombre")),
      (snap) => {
        setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const demoWorkers = useDemoSnapshot(() => demoStore.workers);
  if (isDemoMode()) return { workers: demoWorkers, loading: false };
  if (isSheetsBackend()) return { workers: sheetsWorkers, loading: false };
  return { workers, loading };
}

export function useShifts(): Turno[] {
  return useShiftsState().shifts;
}

export function useShiftsState(): { shifts: Turno[]; loading: boolean } {
  const [shifts, setShifts] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(() => !isDemoMode() && !isSheetsBackend());
  const sheetsShifts = useSheetsPoll<Turno>("shifts");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "shifts"), orderBy("inicio")),
      (snap) => {
        setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Turno)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const demoShifts = useDemoSnapshot(() => demoStore.shifts);
  if (isDemoMode()) return { shifts: demoShifts, loading: false };
  if (isSheetsBackend()) return { shifts: sheetsShifts, loading: false };
  return { shifts, loading };
}

export function useEvents(): Evento[] {
  return useEventsState().events;
}

export function useEventsState(): { events: Evento[]; loading: boolean } {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(() => !isDemoMode() && !isSheetsBackend());
  const sheetsEvents = useSheetsPoll<Evento>("events");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      collection(getFirestoreDb(), "events"),
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Evento)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const demoEvents = useDemoSnapshot(() => demoStore.events);
  if (isDemoMode()) return { events: demoEvents, loading: false };
  if (isSheetsBackend()) return { events: sheetsEvents, loading: false };
  return { events, loading };
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
    customRoleId?: string;
  },
  options?: {
    actorNombre?: string;
    creadaPor?: string;
    creadaPorNombre?: string;
    /** Crea cuenta con correo + documento como clave. Default true. */
    crearCuenta?: boolean;
    /** Envía invitación clásica (solo si crearCuenta es false). Default false. */
    enviarInvitacion?: boolean;
    /** Envía correo con instrucciones de acceso (Firebase). Default true. */
    enviarCredenciales?: boolean;
  },
): Promise<string> {
  const rolPlataforma = data.rolPlataforma ?? "trabajador";
  const actorNombre = options?.actorNombre;
  const shouldCreateAccount = options?.crearCuenta !== false;
  if (isDemoMode()) {
    const id = demoStore.addWorker(
      {
        nombre: data.nombre,
        documento: data.documento,
        telefono: data.telefono,
        email: data.email.trim().toLowerCase(),
        perfiles: data.perfiles,
        rolPlataforma,
        customRoleId: data.customRoleId,
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
    if (shouldCreateAccount) {
      demoStore.provisionWorkerAccount(id, actorNombre);
    }
    return id;
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
    customRoleId: data.customRoleId ?? "",
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
    if (shouldCreateAccount) {
      await provisionWorkerAccount(id, { actorNombre });
    }
    return id;
  }
  const ref = await addDoc(collection(getFirestoreDb(), "workers"), {
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

  const creadaPor = options?.creadaPor;
  const shouldInvite =
    !shouldCreateAccount &&
    options?.enviarInvitacion === true &&
    data.email.trim().length > 0 &&
    Boolean(creadaPor);

  if (shouldInvite && creadaPor) {
    await createInvitation({
      workerId: ref.id,
      workerNombre: data.nombre,
      email: data.email.trim().toLowerCase(),
      role: rolPlataforma,
      creadaPor,
      creadaPorNombre: options?.creadaPorNombre ?? actorNombre ?? "Administrador",
    });
  } else if (shouldCreateAccount) {
    await provisionWorkerAccount(ref.id, {
      actorNombre,
      sendEmail: options?.enviarCredenciales !== false,
    });
  }

  return ref.id;
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

export async function deleteShift(id: string): Promise<void> {
  if (isDemoMode()) {
    const active = demoStore.attendances.find(
      (a) => a.shiftId === id && a.estado !== "cerrado",
    );
    if (active) {
      throw new Error("No se puede quitar: el trabajador tiene jornada activa en este turno.");
    }
    demoStore.removeShift(id);
    return;
  }
  if (isSheetsBackend()) {
    throw new Error("Quitar del evento no está disponible con backend Google Sheets.");
  }

  const attSnap = await getDocs(
    query(
      collection(getFirestoreDb(), "attendance"),
      where("shiftId", "==", id),
    ),
  );
  const hasActive = attSnap.docs.some((d) => {
    const estado = d.data().estado as string | undefined;
    return estado !== "cerrado";
  });
  if (hasActive) {
    throw new Error("No se puede quitar: el trabajador tiene jornada activa en este turno.");
  }

  await deleteDoc(doc(getFirestoreDb(), "shifts", id));
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

  if (isSheetsBackend()) {
    const items = await sheetsListAll<Invitation>("invitations");
    return (
      items.find(
        (inv) =>
          inv.email.toLowerCase() === normalizedEmail &&
          inv.estado === "pendiente" &&
          inv.codigoAcceso === normalizedCode,
      ) ?? null
    );
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
  customRoleId?: string;
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
    customRoleId: data.customRoleId,
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
  if (isSheetsBackend()) {
    const inv = await getInvitationByToken(token);
    if (!inv) throw new Error("Invitación no encontrada");
    await sheetsUpsertRecord(
      "invitations",
      { ...inv, id: token, token, estado: "revocada" },
      "id",
    );
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

  if (isSheetsBackend()) {
    const worker = await getWorkerById(invitation.workerId);
    if (!worker) throw new Error("Trabajador no encontrado");
    if (worker.cuentaCreada) throw new Error("Este trabajador ya tiene cuenta activa");

    const uid = `sheets-${invitation.workerId}-${Date.now().toString(36)}`;
    const assignedRole = invitation.role ?? "trabajador";
    const perfilCompleto = assignedRole === "supervisor_sitio";

    await sheetsUpsertRecord(
      "users",
      {
        uid,
        email: invitation.email,
        password,
        nombre: invitation.workerNombre,
        role: assignedRole,
        workerId: invitation.workerId,
        customRoleId: invitation.customRoleId ?? "",
        perfilCompleto: String(perfilCompleto),
        telefono: "",
        habilitado: "true",
      },
      "uid",
    );

    await sheetsUpsertRecord("workers", { ...worker, cuentaCreada: true });

    await sheetsUpsertRecord(
      "invitations",
      {
        ...invitation,
        id: token,
        token,
        estado: "usada",
        usadaEn: new Date().toISOString(),
        uid,
      },
      "id",
    );

    return {
      uid,
      email: invitation.email,
      nombre: invitation.workerNombre,
      role: assignedRole,
      workerId: invitation.workerId,
      customRoleId: invitation.customRoleId,
      perfilCompleto,
      habilitado: true,
    };
  }

  const auth = getFirebaseAuth();
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, invitation.email, password);
  } catch (err) {
    if (!(err instanceof FirebaseError) || err.code !== "auth/email-already-in-use") {
      throw err;
    }
    // Reintento: la cuenta Auth pudo crearse en un intento anterior que falló al guardar Firestore.
    try {
      cred = await signInWithEmailAndPassword(auth, invitation.email, password);
    } catch {
      throw new Error(
        "Este correo ya tiene cuenta en SPE. Si ya creaste contraseña, usa Iniciar sesión. " +
          "Si no la recuerdas, en login elige «Olvidé mi contraseña». " +
          "Si el problema continúa, pide al administrador una nueva invitación.",
      );
    }
  }

  const desiredRole = invitation.role ?? "trabajador";
  let assignedRole = desiredRole;
  let perfilCompleto = desiredRole === "supervisor_sitio";

  const userRef = doc(getFirestoreDb(), "users", cred.user.uid);
  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    const data = existingUser.data();
    if (data.workerId && data.workerId !== invitation.workerId) {
      throw new Error(
        "Este correo ya está vinculado a otro perfil de personal. Contacta al administrador.",
      );
    }
  }

  const profilePayload = (role: string, completo: boolean) => ({
    email: invitation.email,
    nombre: invitation.workerNombre,
    role,
    workerId: invitation.workerId,
    customRoleId: invitation.customRoleId,
    perfilCompleto: completo,
    habilitado: true,
  });

  try {
    await setDoc(userRef, profilePayload(desiredRole, perfilCompleto), { merge: true });
  } catch (err) {
    // Reglas LIVE solo permiten self-create como trabajador — evita Auth huérfano.
    if (desiredRole !== "trabajador") {
      assignedRole = "trabajador";
      perfilCompleto = false;
      await setDoc(userRef, profilePayload("trabajador", false), { merge: true });
      console.warn(
        "[SPE] Perfil creado como trabajador (reglas aún no permiten",
        desiredRole,
        "). Publica firestore.rules y actualiza el rol.",
        err,
      );
    } else {
      throw err;
    }
  }

  try {
    await updateDoc(doc(getFirestoreDb(), "workers", invitation.workerId), {
      cuentaCreada: true,
    });
  } catch {
    // Supervisor/admin puede fallar si el perfil quedó como trabajador sin permisos de escritura.
  }

  try {
    await updateDoc(doc(getFirestoreDb(), "invitations", token), {
      estado: "usada",
      usadaEn: new Date().toISOString(),
      uid: cred.user.uid,
    });
  } catch {
    // Invitación queda pendiente; el login puede reutilizarla para completar el perfil.
  }

  return {
    uid: cred.user.uid,
    email: invitation.email,
    nombre: invitation.workerNombre,
    role: assignedRole,
    workerId: invitation.workerId,
    customRoleId: invitation.customRoleId,
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
  if (isSheetsBackend()) {
    const users = await sheetsListAll<Record<string, unknown>>("users");
    const user = users.find((u) => String(u.uid) === data.uid);
    if (!user) throw new Error("Usuario no encontrado");
    await sheetsUpsertRecord(
      "users",
      {
        ...user,
        uid: data.uid,
        nombre: data.nombre,
        telefono: data.telefono,
        perfilCompleto: "true",
      },
      "uid",
    );
    const workerId = user.workerId ? String(user.workerId) : null;
    if (workerId) {
      const worker = await getWorkerById(workerId);
      if (worker) {
        await sheetsUpsertRecord("workers", {
          ...worker,
          nombre: data.nombre,
          telefono: data.telefono,
        });
      }
    }
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

/** Crea cuenta de acceso: usuario = correo, contraseña = documento (sin puntos ni espacios). */
export async function provisionWorkerAccount(
  workerId: string,
  options?: { actorNombre?: string; sendEmail?: boolean },
): Promise<void> {
  if (isDemoMode()) {
    demoStore.provisionWorkerAccount(workerId, options?.actorNombre);
    return;
  }

  const worker = await getWorkerById(workerId);
  if (!worker) throw new Error("Trabajador no encontrado");
  if (worker.cuentaCreada) return;

  const password = workerDocumentPassword(worker.documento);
  const email = worker.email.trim().toLowerCase();
  const rolPlataforma = worker.rolPlataforma ?? "trabajador";
  const perfilCompleto = rolPlataforma === "supervisor_sitio";

  if (isSheetsBackend()) {
    const uid = `sheets-${workerId}-${Date.now().toString(36)}`;
    await sheetsUpsertRecord(
      "users",
      {
        uid,
        email,
        password,
        nombre: worker.nombre,
        role: rolPlataforma,
        workerId,
        customRoleId: worker.customRoleId ?? "",
        perfilCompleto: String(perfilCompleto),
        telefono: worker.telefono ?? "",
        habilitado: "true",
      },
      "uid",
    );
    await sheetsUpsertRecord("workers", { ...worker, cuentaCreada: true });
    return;
  }

  const fn = httpsCallable<
    { workerId: string; sendEmail?: boolean },
    { uid: string }
  >(getFunctions(getFirebaseApp(), "us-central1"), "provisionWorkerAccount");
  await fn({ workerId, sendEmail: options?.sendEmail });
}

export async function importWorkersBulk(
  rows: WorkerImportRow[],
  options?: { actorNombre?: string; creadaPor?: string; sendEmail?: boolean },
): Promise<WorkerBulkImportResult> {
  const results: WorkerBulkImportResult["results"] = [];

  if (isDemoMode() || isSheetsBackend()) {
    for (const row of rows) {
      try {
        const workerId = await createWorker(
          {
            nombre: row.nombre,
            documento: row.documento,
            telefono: row.telefono,
            email: row.email,
            perfiles: row.perfiles,
            rolPlataforma: row.rolPlataforma,
          },
          {
            actorNombre: options?.actorNombre,
            creadaPor: options?.creadaPor,
            crearCuenta: true,
            enviarInvitacion: false,
            enviarCredenciales: false,
          },
        );
        results.push({
          line: row.line,
          email: row.email,
          nombre: row.nombre,
          ok: true,
          workerId,
        });
      } catch (err) {
        results.push({
          line: row.line,
          email: row.email,
          nombre: row.nombre,
          ok: false,
          error: err instanceof Error ? err.message : "Error al importar fila",
        });
      }
    }
    const created = results.filter((r) => r.ok).length;
    return { created, failed: results.length - created, results };
  }

  const fn = httpsCallable<
    {
      rows: Array<{
        nombre: string;
        documento: string;
        email: string;
        telefono?: string;
        perfiles?: string[];
        rolPlataforma?: string;
      }>;
      sendEmail?: boolean;
    },
    { created: number; failed: number; results: Array<{ email: string; nombre: string; ok: boolean; workerId?: string; error?: string }> }
  >(getFunctions(getFirebaseApp(), "us-central1"), "importWorkersBulk");

  const response = await fn({
    rows: rows.map((row) => ({
      nombre: row.nombre,
      documento: row.documento,
      email: row.email,
      telefono: row.telefono,
      perfiles: row.perfiles,
      rolPlataforma: row.rolPlataforma,
    })),
    sendEmail: options?.sendEmail !== false,
  });

  const mapped = response.data.results.map((r, index) => ({
    line: rows[index]?.line ?? index + 2,
    email: r.email,
    nombre: r.nombre,
    ok: r.ok,
    workerId: r.workerId,
    error: r.error,
  }));

  return {
    created: response.data.created,
    failed: response.data.failed,
    results: mapped,
  };
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

  if (isSheetsBackend()) {
    const att = await sheetsGetById<Attendance>("attendance", attendanceId);
    if (!att) return;
    const alertasRaw = att.alertasGeocerca as string[] | string | undefined;
    const alertas: string[] = Array.isArray(alertasRaw)
      ? alertasRaw
      : typeof alertasRaw === "string" && alertasRaw.trim()
        ? alertasRaw.split(",").filter(Boolean)
        : [];
    const now = new Date().toISOString();
    if (alertas.length > 0 && alertas[alertas.length - 1] === now) return;
    const isFirstAlert = alertas.length === 0;

    await sheetsUpsertRecord("attendance", {
      ...att,
      estado: "fuera_geocerca",
      alertasGeocerca: [...alertas, now].join(","),
    });

    if (isFirstAlert) {
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

export async function confirmArrivalAtSite(attendanceId: string): Promise<void> {
  if (isDemoMode()) {
    const att = demoStore.attendances.find((a) => a.id === attendanceId);
    if (!att || att.estado === "activo") return;
    demoStore.updateAttendanceLocation(
      attendanceId,
      att.ubicacionActual ?? { lat: 0, lng: 0 },
      true,
    );
    if (att.estado === "revision_manual" || att.estado === "fuera_geocerca") {
      await notifyLlegadaSitio({
        workerId: att.workerId,
        workerNombre: att.workerNombre ?? att.workerId,
        siteNombre: att.siteNombre,
        eventNombre: att.eventNombre,
        attendanceId,
      });
    }
    return;
  }

  if (isSheetsBackend()) {
    const att = await sheetsGetById<Attendance>("attendance", attendanceId);
    if (!att || att.estado === "activo") return;
    await sheetsUpsertRecord("attendance", { ...att, estado: "activo" });
    if (att.estado === "revision_manual" || att.estado === "fuera_geocerca") {
      await notifyLlegadaSitio({
        workerId: att.workerId,
        workerNombre: att.workerNombre ?? att.workerId,
        siteNombre: att.siteNombre,
        eventNombre: att.eventNombre,
        attendanceId,
      });
    }
    return;
  }

  const snap = await getDoc(doc(getFirestoreDb(), "attendance", attendanceId));
  if (!snap.exists()) return;
  const att = { id: snap.id, ...snap.data() } as Attendance;
  if (att.estado === "activo") return;
  await updateDoc(doc(getFirestoreDb(), "attendance", attendanceId), { estado: "activo" });
  if (att.estado === "revision_manual" || att.estado === "fuera_geocerca") {
    await notifyLlegadaSitio({
      workerId: att.workerId,
      workerNombre: att.workerNombre ?? att.workerId,
      siteNombre: att.siteNombre,
      eventNombre: att.eventNombre,
      attendanceId,
    });
  }
}

export async function recordGeofenceReentry(attendanceId: string): Promise<void> {
  if (isDemoMode()) {
    const att = demoStore.attendances.find((a) => a.id === attendanceId);
    if (!att) return;
    demoStore.updateAttendanceLocation(
      attendanceId,
      att.ubicacionActual ?? { lat: 0, lng: 0 },
      true,
    );
    await notifyReentradaGeocerca({
      workerId: att.workerId,
      workerNombre: att.workerNombre ?? att.workerId,
      siteNombre: att.siteNombre,
      attendanceId,
    });
    return;
  }

  if (isSheetsBackend()) {
    const att = await sheetsGetById<Attendance>("attendance", attendanceId);
    if (!att) return;
    await sheetsUpsertRecord("attendance", { ...att, estado: "activo" });
    await notifyReentradaGeocerca({
      workerId: att.workerId,
      workerNombre: att.workerNombre ?? att.workerId,
      siteNombre: att.siteNombre,
      attendanceId,
    });
    return;
  }

  const snap = await getDoc(doc(getFirestoreDb(), "attendance", attendanceId));
  if (!snap.exists()) return;
  const att = { id: snap.id, ...snap.data() } as Attendance;
  await updateDoc(doc(getFirestoreDb(), "attendance", attendanceId), { estado: "activo" });
  await notifyReentradaGeocerca({
    workerId: att.workerId,
    workerNombre: att.workerNombre ?? att.workerId,
    siteNombre: att.siteNombre,
    attendanceId,
  });
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

export async function updateEvento(
  eventId: string,
  data: Partial<
    Pick<
      Evento,
      | "nombre"
      | "fechaInicio"
      | "fechaFin"
      | "temaLaboral"
      | "reglasOperativas"
      | "tiempoMinimoEstadiaMinutos"
      | "supervisionActiva"
    >
  >,
): Promise<void> {
  if (isDemoMode()) {
    demoStore.updateEvent(eventId, data);
    return;
  }
  if (isSheetsBackend()) {
    const evento = await sheetsGetById<Evento>("events", eventId);
    if (!evento) throw new Error("Evento no encontrado");
    await sheetsUpsertRecord("events", {
      ...evento,
      ...data,
      supervisionActiva:
        data.supervisionActiva !== undefined ? data.supervisionActiva : evento.supervisionActiva ?? true,
      tiempoMinimoEstadiaMinutos:
        data.tiempoMinimoEstadiaMinutos ?? evento.tiempoMinimoEstadiaMinutos ?? 0,
    });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "events", eventId), data);
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
  const sheetsReportes = useSheetsPoll<Reporte>("reports");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "reports"), orderBy("creadoEn", "desc")),
      (snap) => setReportes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reporte))),
    );
    return unsub;
  }, []);

  const demoReportes = useDemoSnapshot(() => demoStore.reportes);
  if (isDemoMode()) return demoReportes;
  if (isSheetsBackend()) return sheetsReportes;
  return reportes;
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

export async function createPlatformAccount(
  data: {
    email: string;
    password: string;
    nombre: string;
    role: UserRole;
  },
  creator: Pick<AppUser, "uid" | "nombre" | "role">,
): Promise<string> {
  const role = normalizeUserRole(data.role);
  if (!puedeAsignarRol(creator.role, role)) {
    throw new Error("No tienes permiso para crear una cuenta con ese rol.");
  }
  if (!rolesCuentaPlataforma(creator.role).includes(role)) {
    throw new Error("Este rol debe crearse desde Personal de campo, no como cuenta administrativa.");
  }

  const email = data.email.trim().toLowerCase();
  const nombre = data.nombre.trim();
  if (!email || !nombre || data.password.length < 6) {
    throw new Error("Completa nombre, correo y contraseña (mínimo 6 caracteres).");
  }

  if (isDemoMode()) {
    return demoStore.createPlatformAccount({ email, password: data.password, nombre, role });
  }

  if (isSheetsBackend()) {
    throw new Error("Creación de cuentas administrativas no disponible con backend Sheets.");
  }

  try {
    const fn = httpsCallable<
      { email: string; password: string; nombre: string; role: string },
      { uid: string }
    >(getFunctions(getFirebaseApp(), "us-central1"), "createPlatformAccountFn");
    const result = await fn({ email, password: data.password, nombre, role });
    return result.data.uid;
  } catch {
    // Fallback producción: Identity Toolkit REST (sin cambiar sesión) + doc Firestore.
    return createPlatformAccountViaAuthRest({
      email,
      password: data.password,
      nombre,
      role,
      creatorUid: creator.uid,
      creatorNombre: creator.nombre,
    });
  }
}

async function createPlatformAccountViaAuthRest(data: {
  email: string;
  password: string;
  nombre: string;
  role: UserRole;
  creatorUid: string;
  creatorNombre: string;
}): Promise<string> {
  const app = getFirebaseApp();
  const apiKey = app.options.apiKey;
  if (!apiKey) throw new Error("Firebase apiKey no configurada.");

  const signUp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        displayName: data.nombre,
        returnSecureToken: true,
      }),
    },
  );
  const signUpData = (await signUp.json()) as {
    localId?: string;
    error?: { message?: string };
  };

  if (!signUp.ok || !signUpData.localId) {
    const msg = signUpData.error?.message ?? `HTTP ${signUp.status}`;
    if (msg.includes("EMAIL_EXISTS")) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    throw new Error(`No se pudo crear la cuenta Auth: ${msg}`);
  }

  const uid = signUpData.localId;
  await setDoc(doc(getFirestoreDb(), "users", uid), {
    email: data.email,
    nombre: data.nombre,
    role: data.role,
    workerId: null,
    perfilCompleto: true,
    habilitado: true,
    creadoPor: data.creatorUid,
    creadoPorNombre: data.creatorNombre,
  });

  // Sin Cloud Functions: Firebase Auth puede enviar correo de restablecer contraseña.
  // La contraseña inicial ya quedó creada; el correo cubre el caso "olvidé mi clave".
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), data.email);
  } catch {
    // No bloquear alta de cuenta si el correo falla (dominio inválido, cuota, etc.).
  }

  return uid;
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
    await notifyReporteTrabajador({
      workerId: data.workerId,
      workerNombre: data.workerNombre,
      siteNombre: data.siteNombre,
      tipo: data.tipo,
      mensaje: data.mensaje,
      reporteId: id,
    });
    return id;
  }

  if (isSheetsBackend()) {
    await sheetsUpsertRecord("reports", { ...reporte, id });
    await notifyReporteTrabajador({
      workerId: data.workerId,
      workerNombre: data.workerNombre,
      siteNombre: data.siteNombre,
      tipo: data.tipo,
      mensaje: data.mensaje,
      reporteId: id,
    });
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "reports", id), reporte);
  await notifyReporteTrabajador({
    workerId: data.workerId,
    workerNombre: data.workerNombre,
    siteNombre: data.siteNombre,
    tipo: data.tipo,
    mensaje: data.mensaje,
    reporteId: id,
  });
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

  if (isSheetsBackend()) {
    const reporte = await sheetsGetById<Reporte>("reports", reporteId);
    if (!reporte) throw new Error("Reporte no encontrado");
    await sheetsUpsertRecord("reports", { ...reporte, ...patch });
    return;
  }

  await updateDoc(doc(getFirestoreDb(), "reports", reporteId), patch);
}

export async function createCustomRole(
  data: {
    nombre: string;
    descripcion?: string;
    baseRole: CustomRoleBase;
    permisos: SpePermission[];
    activo: boolean;
    modoAcceso?: RoleAccessMode;
    plantillaId?: string;
  },
  creadoPor: string,
  creadoPorNombre: string,
): Promise<string> {
  const id = `role-${Date.now().toString(36)}`;
  const role: CustomRole = {
    id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    baseRole: data.baseRole,
    permisos: data.permisos,
    activo: data.activo,
    modoAcceso: data.modoAcceso,
    plantillaId: data.plantillaId,
    creadoEn: new Date().toISOString(),
    creadoPor,
    creadoPorNombre,
  };

  if (isDemoMode()) {
    demoStore.addCustomRole(role);
    return id;
  }

  const record = {
    ...role,
    permisos: serializeCustomRolePermisos(role.permisos),
  };

  if (isSheetsBackend()) {
    await sheetsUpsertRecord("customRoles", record);
    return id;
  }

  await setDoc(doc(getFirestoreDb(), "customRoles", id), record);
  return id;
}

export async function updateCustomRole(
  id: string,
  data: Partial<
    Pick<
      CustomRole,
      "nombre" | "descripcion" | "baseRole" | "permisos" | "activo" | "modoAcceso" | "plantillaId"
    >
  >,
  _actorUid: string,
  _actorNombre: string,
): Promise<void> {
  if (isDemoMode()) {
    demoStore.updateCustomRole(id, data);
    return;
  }

  if (isSheetsBackend()) {
    const existing = await sheetsGetById<Record<string, unknown>>("customRoles", id);
    if (!existing) throw new Error("Rol no encontrado");
    const currentPermisos = parseCustomRolePermisos(existing.permisos);
    const merged: CustomRole = {
      id,
      nombre: String(existing.nombre ?? ""),
      descripcion: existing.descripcion ? String(existing.descripcion) : undefined,
      baseRole: (existing.baseRole as CustomRole["baseRole"]) ?? "trabajador",
      permisos: data.permisos ?? currentPermisos,
      activo: data.activo ?? existing.activo !== "false",
      creadoEn: String(existing.creadoEn ?? new Date().toISOString()),
      creadoPor: String(existing.creadoPor ?? ""),
      creadoPorNombre: existing.creadoPorNombre ? String(existing.creadoPorNombre) : undefined,
      ...data,
    };
    await sheetsUpsertRecord("customRoles", {
      ...merged,
      permisos: serializeCustomRolePermisos(merged.permisos),
    });
    return;
  }

  const ref = doc(getFirestoreDb(), "customRoles", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Rol no encontrado");
  const patch = { ...data } as Record<string, unknown>;
  if (data.permisos) patch.permisos = serializeCustomRolePermisos(data.permisos);
  await updateDoc(ref, patch);
}

export async function deleteCustomRole(id: string): Promise<void> {
  if (isDemoMode()) {
    demoStore.deleteCustomRole(id);
    return;
  }

  if (isSheetsBackend()) {
    await sheetsDeleteRecord("customRoles", id);
    return;
  }

  await deleteDoc(doc(getFirestoreDb(), "customRoles", id));
}

/** Importa plantillas de ejemplo que aún no existen (por plantillaId). */
export async function importRoleTemplatesFromCatalog(
  existingRoles: CustomRole[],
  creadoPor: string,
  creadoPorNombre: string,
): Promise<number> {
  const existingTemplateIds = new Set(
    existingRoles.map((r) => r.plantillaId).filter(Boolean),
  );
  let imported = 0;
  for (const template of ROLE_TEMPLATES) {
    if (existingTemplateIds.has(template.id)) continue;
    await createCustomRole(
      {
        nombre: roleTemplateDisplayName(template),
        descripcion: template.descripcion,
        baseRole: template.baseRole,
        permisos: template.permisos,
        activo: true,
        modoAcceso: template.modoAcceso,
        plantillaId: template.id,
      },
      creadoPor,
      creadoPorNombre,
    );
    imported += 1;
  }
  return imported;
}
