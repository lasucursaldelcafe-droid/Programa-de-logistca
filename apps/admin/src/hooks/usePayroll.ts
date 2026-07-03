import { useEffect, useState, useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  buildPayrollEntry,
  getFirestoreDb,
  type Attendance,
  type PayrollAuditEntry,
  type PayrollEntry,
  type PayrollRate,
  type Worker,
} from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import { demoStore } from "../demo/store";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function usePayrollRates(): PayrollRate[] {
  const [rates, setRates] = useState<PayrollRate[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "payrollRates"), orderBy("perfil")),
      (snap) => setRates(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayrollRate))),
    );
    return unsub;
  }, []);

  const demoRates = useDemoSnapshot(() => demoStore.payrollRates);
  return DEMO_MODE ? demoRates : rates;
}

export function usePayrollEntries(): PayrollEntry[] {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "payroll"), orderBy("calculadoEn", "desc")),
      (snap) => setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayrollEntry))),
    );
    return unsub;
  }, []);

  const demoEntries = useDemoSnapshot(() => demoStore.payrollEntries);
  return DEMO_MODE ? demoEntries : entries;
}

export function usePayrollAudit(): PayrollAuditEntry[] {
  const [audit, setAudit] = useState<PayrollAuditEntry[]>([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "payrollAudit"), orderBy("timestamp", "desc")),
      (snap) =>
        setAudit(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayrollAuditEntry))),
    );
    return unsub;
  }, []);

  const demoAudit = useDemoSnapshot(() => demoStore.payrollAudit);
  return DEMO_MODE ? demoAudit : audit;
}

export async function upsertPayrollRate(rate: Omit<PayrollRate, "id"> & { id?: string }): Promise<void> {
  const id = rate.id ?? `rate-${rate.perfil}`;
  const { id: _id, ...data } = { ...rate, id };

  if (DEMO_MODE) {
    demoStore.upsertPayrollRate({ ...data, id });
    return;
  }
  await setDoc(doc(getFirestoreDb(), "payrollRates", id), data);
}

async function appendAudit(data: Omit<PayrollAuditEntry, "id">): Promise<void> {
  if (DEMO_MODE) {
    demoStore.addPayrollAudit(data);
    return;
  }
  await addDoc(collection(getFirestoreDb(), "payrollAudit"), data);
}

export async function calculatePayrollFromAttendances(data: {
  attendances: Attendance[];
  workers: Worker[];
  rates: PayrollRate[];
  existingEntries: PayrollEntry[];
  actorUid: string;
  actorNombre: string;
  eventId?: string;
  workerId?: string;
}): Promise<number> {
  const usedAttendanceIds = new Set(data.existingEntries.map((e) => e.attendanceId));
  let created = 0;

  const closed = data.attendances.filter(
    (a) =>
      a.estado === "cerrado" &&
      a.salida &&
      !usedAttendanceIds.has(a.id) &&
      (!data.eventId || a.eventId === data.eventId) &&
      (!data.workerId || a.workerId === data.workerId),
  );

  for (const attendance of closed) {
    const worker = data.workers.find((w) => w.id === attendance.workerId);
    if (!worker) continue;

    const entry = buildPayrollEntry(attendance, worker, data.rates, {
      calculadoPor: data.actorUid,
      calculadoPorNombre: data.actorNombre,
    });
    if (!entry) continue;

    if (DEMO_MODE) {
      const id = demoStore.addPayrollEntry(entry);
      demoStore.addPayrollAudit({
        payrollId: id,
        accion: "calculado",
        actorUid: data.actorUid,
        actorNombre: data.actorNombre,
        timestamp: new Date().toISOString(),
        detalle: `${worker.nombre}: ${entry.horasTrabajadas}h × $${entry.tarifaAplicada}`,
      });
    } else {
      const ref = await addDoc(collection(getFirestoreDb(), "payroll"), entry);
      await appendAudit({
        payrollId: ref.id,
        accion: "calculado",
        actorUid: data.actorUid,
        actorNombre: data.actorNombre,
        timestamp: new Date().toISOString(),
        detalle: `${worker.nombre}: ${entry.horasTrabajadas}h × $${entry.tarifaAplicada}`,
      });
    }
    created += 1;
  }

  return created;
}

export async function markPayrollPaid(
  payrollId: string,
  actor: { uid: string; nombre: string },
): Promise<void> {
  const now = new Date().toISOString();

  if (DEMO_MODE) {
    demoStore.updatePayrollEntry(payrollId, { estado: "pagado", pagadoEn: now });
    demoStore.addPayrollAudit({
      payrollId,
      accion: "marcado_pagado",
      actorUid: actor.uid,
      actorNombre: actor.nombre,
      timestamp: now,
    });
    return;
  }

  await updateDoc(doc(getFirestoreDb(), "payroll", payrollId), {
    estado: "pagado",
    pagadoEn: now,
  });
  await appendAudit({
    payrollId,
    accion: "marcado_pagado",
    actorUid: actor.uid,
    actorNombre: actor.nombre,
    timestamp: now,
  });
}

export async function recordPayrollExport(
  payrollIds: string[],
  actor: { uid: string; nombre: string },
  detalle: string,
): Promise<void> {
  const now = new Date().toISOString();
  for (const payrollId of payrollIds) {
    await appendAudit({
      payrollId,
      accion: "exportado",
      actorUid: actor.uid,
      actorNombre: actor.nombre,
      timestamp: now,
      detalle,
    });
  }
}
