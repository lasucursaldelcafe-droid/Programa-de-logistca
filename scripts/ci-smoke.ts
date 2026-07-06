/**
 * Smoke test para CI: verifica seed de plataforma vacía en emuladores.
 */
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

const PROJECT_ID = "demo-personal-eventos";

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const auth = getAuth();
const db = getFirestore();

async function expectEmpty(collection: string): Promise<number> {
  const snap = await db.collection(collection).get();
  if (snap.size !== 0) {
    throw new Error(`Se esperaba 0 documentos en ${collection}, hay ${snap.size}`);
  }
  return snap.size;
}

async function main(): Promise<void> {
  const admin = await auth.getUserByEmail("admin@eventos.test");
  if (!admin) throw new Error("Usuario admin no encontrado");

  const master = await auth.getUserByEmail("master@eventos.test");
  if (!master) throw new Error("Usuario master no encontrado");

  const workers = await expectEmpty("workers");
  const events = await expectEmpty("events");
  const shifts = await expectEmpty("shifts");
  const invitations = await expectEmpty("invitations");
  const qrCodes = await expectEmpty("qrCodes");
  const attendance = await expectEmpty("attendance");
  const notifications = await expectEmpty("notifications");
  const payroll = await expectEmpty("payroll");
  const payrollAudit = await expectEmpty("payrollAudit");

  const setupConfig = await db.collection("setupConfig").doc("default").get();
  if (!setupConfig.exists) {
    throw new Error("setupConfig/default no encontrado");
  }
  if (setupConfig.data()?.completado === true) {
    throw new Error("setupConfig debería estar incompleto en plataforma vacía");
  }

  console.log("✓ Smoke test OK (plataforma vacía):", {
    admin: admin.email,
    master: master.email,
    workers,
    events,
    shifts,
    invitations,
    qrCodes,
    attendance,
    notifications,
    payroll,
    payrollAudit,
    setupCompletado: false,
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
