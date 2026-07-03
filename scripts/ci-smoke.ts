/**
 * Smoke test para CI: verifica que seed crea usuarios en emuladores.
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

async function main(): Promise<void> {
  const admin = await auth.getUserByEmail("admin@eventos.test");
  if (!admin) throw new Error("Usuario admin no encontrado");

  const workers = await db.collection("workers").get();
  if (workers.size < 3) {
    throw new Error(`Se esperaban ≥3 trabajadores, hay ${workers.size}`);
  }

  const shifts = await db.collection("shifts").get();
  if (shifts.size < 2) {
    throw new Error(`Se esperaban ≥2 turnos, hay ${shifts.size}`);
  }

  const invitations = await db.collection("invitations").get();
  if (invitations.size < 1) {
    throw new Error(`Se esperaba ≥1 invitación, hay ${invitations.size}`);
  }

  const qrCodes = await db.collection("qrCodes").get();
  if (qrCodes.size < 2) {
    throw new Error(`Se esperaban ≥2 códigos QR, hay ${qrCodes.size}`);
  }

  const attendance = await db.collection("attendance").get();
  if (attendance.size < 1) {
    throw new Error(`Se esperaba ≥1 jornada, hay ${attendance.size}`);
  }

  console.log("✓ Smoke test OK:", {
    admin: admin.email,
    workers: workers.size,
    shifts: shifts.size,
    invitations: invitations.size,
    qrCodes: qrCodes.size,
    attendance: attendance.size,
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
