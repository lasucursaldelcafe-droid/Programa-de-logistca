/**
 * Seed inicial para Firebase Emulators — solo cuentas raíz CEO y Master App.
 * Requiere emuladores corriendo: npm run emulators
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

interface SeedUser {
  email: string;
  password: string;
  nombre: string;
  role: "ceo" | "master_app";
}

/** Solo las dos cuentas raíz. El resto se crea desde Master → Equipo administrativo. */
const USERS: SeedUser[] = [
  {
    email: "ceo@eventos.test",
    password: "Ceo123!",
    nombre: "CEO — Propietario",
    role: "ceo",
  },
  {
    email: "master@eventos.test",
    password: "Master123!",
    nombre: "Master App — Plataforma",
    role: "master_app",
  },
];

async function upsertAuthUser(u: SeedUser): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(u.email);
    await auth.updateUser(existing.uid, { password: u.password, displayName: u.nombre });
    return existing.uid;
  } catch {
    const created = await auth.createUser({
      email: u.email,
      password: u.password,
      displayName: u.nombre,
    });
    return created.uid;
  }
}

async function main(): Promise<void> {
  console.log("> Seed — plataforma vacía (solo CEO y Master App)");

  const uids: Record<string, string> = {};
  for (const u of USERS) {
    const uid = await upsertAuthUser(u);
    uids[u.email] = uid;
    await db.collection("users").doc(uid).set({
      email: u.email,
      nombre: u.nombre,
      role: u.role,
      workerId: null,
      perfilCompleto: true,
    });
    console.log(`+ usuario ${u.email} (${u.role})`);
  }

  await db.collection("setupConfig").doc("default").set({
    completado: false,
    pasoActual: "evento",
    pasosCompletados: [],
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: uids["ceo@eventos.test"] ?? "seed",
    actualizadoPorNombre: "CEO",
  });
  console.log("+ configuración inicial (asistente pendiente)");

  console.log("\n✓ Seed completo. Sin eventos ni personal — empieza creando el equipo administrativo.");
  console.log("  Cuentas raíz:");
  for (const u of USERS) {
    console.log(`    ${u.email} / ${u.password}  (${u.role})`);
  }
  console.log("\n  Siguiente paso: Master → Equipo administrativo → crear Administrador, RH, Contador…");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
