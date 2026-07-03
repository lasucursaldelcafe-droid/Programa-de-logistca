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
  type Evento,
  type Invitation,
  type PerfilTrabajo,
  type ShiftEstado,
  type Sitio,
  type Turno,
  type Worker,
  type WorkerEstado,
} from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import { demoStore } from "../demo/store";

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

export async function createShift(data: Omit<Turno, "id">): Promise<void> {
  if (DEMO_MODE) {
    demoStore.addShift(data);
    return;
  }
  await addDoc(collection(getFirestoreDb(), "shifts"), data);
}

export async function updateShiftEstado(id: string, estado: ShiftEstado): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateShift(id, { estado });
    return;
  }
  await updateDoc(doc(getFirestoreDb(), "shifts", id), { estado });
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
