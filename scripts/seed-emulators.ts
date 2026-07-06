/**
 * Seed inicial para Firebase Emulators — plataforma vacía lista para configurar.
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
  role: "super_admin" | "administrador" | "supervisor_sitio";
}

const USERS: SeedUser[] = [
  { email: "master@eventos.test", password: "Master123!", nombre: "Master Plataforma", role: "super_admin" },
  { email: "admin@eventos.test", password: "Admin123!", nombre: "Administrador", role: "administrador" },
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
  console.log("> Seed — plataforma vacía (solo cuentas de administración)");

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
    actualizadoPor: uids["admin@eventos.test"] ?? "seed",
    actualizadoPorNombre: "Administrador",
  });
  console.log("+ configuración inicial (asistente pendiente)");

  console.log("\n✓ Seed completo. Sin eventos, personal ni turnos — empieza desde Configuración.");
  console.log("  Cuentas de plataforma:");
  for (const u of USERS) {
    console.log(`    ${u.email} / ${u.password}`);
  }
  console.log("\n  Supervisores y trabajadores: Admin → Personal (rol) → Cuentas (invitación).");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
