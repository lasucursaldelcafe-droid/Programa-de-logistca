import { useEffect, useState, useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  getFirestoreDb,
  type Evento,
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
