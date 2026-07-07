/**
 * Crea cuentas de plataforma en Firebase PRODUCCIÓN (Auth + Firestore).
 * Requiere cuenta de servicio con permisos Admin SDK.
 *
 * Uso:
 *   npm run seed:production -- --service-account ./service-account.json
 *   npm run seed:production -- --service-account ./sa.json --email admin@empresa.com --password "MiPass123!"
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ROOT = resolve(import.meta.dirname, "..");

interface SeedUser {
  email: string;
  password: string;
  nombre: string;
  role: "super_admin" | "administrador";
}

const DEFAULT_USERS: SeedUser[] = [
  {
    email: "master@eventos.test",
    password: "Master123!",
    nombre: "Master Plataforma",
    role: "super_admin",
  },
  {
    email: "admin@eventos.test",
    password: "Admin123!",
    nombre: "Administrador",
    role: "administrador",
  },
];

function parseArgs(): {
  serviceAccountPath: string;
  users: SeedUser[];
} {
  const args = process.argv.slice(2);
  let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
  let customEmail = "";
  let customPassword = "";
  let customNombre = "Administrador";
  let customRole: SeedUser["role"] = "administrador";

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--service-account" && args[i + 1]) {
      serviceAccountPath = args[++i]!;
    } else if (a === "--email" && args[i + 1]) {
      customEmail = args[++i]!;
    } else if (a === "--password" && args[i + 1]) {
      customPassword = args[++i]!;
    } else if (a === "--nombre" && args[i + 1]) {
      customNombre = args[++i]!;
    } else if (a === "--role" && args[i + 1]) {
      const r = args[++i]!;
      if (r === "super_admin" || r === "administrador") customRole = r;
    }
  }

  if (!serviceAccountPath) {
    const fallback = resolve(ROOT, "service-account.json");
    if (existsSync(fallback)) serviceAccountPath = fallback;
  }

  if (!serviceAccountPath || !existsSync(serviceAccountPath)) {
    console.error("✗ Falta archivo de cuenta de servicio.");
    console.error("  Firebase Console → Configuración → Cuentas de servicio → Generar clave privada");
    console.error("  Guarda como service-account.json en la raíz del proyecto.");
    console.error("  npm run seed:production -- --service-account ./service-account.json");
    process.exit(1);
  }

  const users = [...DEFAULT_USERS];
  if (customEmail && customPassword) {
    users.push({
      email: customEmail,
      password: customPassword,
      nombre: customNombre,
      role: customRole,
    });
  }

  return { serviceAccountPath: resolve(serviceAccountPath), users };
}

async function upsertAuthUser(
  auth: ReturnType<typeof getAuth>,
  u: SeedUser,
): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(u.email);
    await auth.updateUser(existing.uid, { password: u.password, displayName: u.nombre });
    return existing.uid;
  } catch {
    const created = await auth.createUser({
      email: u.email,
      password: u.password,
      displayName: u.nombre,
      emailVerified: true,
    });
    return created.uid;
  }
}

async function main(): Promise<void> {
  const { serviceAccountPath, users } = parseArgs();
  const raw = JSON.parse(readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount;

  if (!getApps().length) {
    initializeApp({ credential: cert(raw) });
  }

  const auth = getAuth();
  const db = getFirestore();

  console.log("> Seed producción — Firebase Auth + Firestore");
  console.log(`  Proyecto: ${(raw as { project_id?: string }).project_id ?? "?"}`);
  console.log(`  Cuenta de servicio: ${serviceAccountPath}\n`);

  for (const u of users) {
    const uid = await upsertAuthUser(auth, u);
    await db.collection("users").doc(uid).set(
      {
        email: u.email,
        nombre: u.nombre,
        role: u.role,
        workerId: null,
        perfilCompleto: true,
      },
      { merge: true },
    );
    console.log(`+ ${u.email} (${u.role})`);
    console.log(`    Password: ${u.password}`);
  }

  await db.collection("setupConfig").doc("default").set(
    {
      completado: false,
      pasoActual: "evento",
      pasosCompletados: [],
      actualizadoEn: new Date().toISOString(),
      actualizadoPorNombre: "seed:production",
    },
    { merge: true },
  );

  console.log("\n✓ Cuentas de producción listas.");
  console.log("  Inicia sesión en la app con las credenciales mostradas arriba.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
