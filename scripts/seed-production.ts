/**
 * Crea/actualiza la cuenta raíz de producción (CEO) en Firebase Auth + Firestore.
 * Requiere cuenta de servicio Admin SDK (solo servidor — no va en la app web).
 *
 * Uso:
 *   SPE_PROD_PASSWORD='…' npm run seed:production -- --service-account ./service-account.json
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{…}' SPE_PROD_PASSWORD='…' npm run seed:production
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ROOT = resolve(import.meta.dirname, "..");

const PLATFORM_CEO_EMAIL = "lasucursaldelcafe@gmail.com";

type ProdRootRole = "ceo" | "master_app";

interface SeedUser {
  email: string;
  password: string;
  nombre: string;
  role: ProdRootRole;
}

function parseArgs(): {
  serviceAccountPath: string;
  users: SeedUser[];
} {
  const args = process.argv.slice(2);
  let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
  let customEmail = process.env.SPE_PROD_EMAIL?.trim() ?? PLATFORM_CEO_EMAIL;
  let customPassword = process.env.SPE_PROD_PASSWORD?.trim() ?? "";
  let customNombre = "CEO — Dirección general";
  let customRole: ProdRootRole = "ceo";

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
      if (r === "ceo" || r === "master_app") customRole = r;
    }
  }

  if (!serviceAccountPath) {
    const fallback = resolve(ROOT, "service-account.json");
    if (existsSync(fallback)) serviceAccountPath = fallback;
  }

  if (!customPassword) {
    console.error("✗ Falta contraseña para la cuenta de producción.");
    console.error("  Usa SPE_PROD_PASSWORD='…' o --password '…'");
    process.exit(1);
  }

  const users: SeedUser[] = [
    {
      email: customEmail,
      password: customPassword,
      nombre: customNombre,
      role: customRole,
    },
  ];

  return {
    serviceAccountPath: serviceAccountPath ? resolve(serviceAccountPath) : "",
    users,
  };
}

function loadServiceAccount(serviceAccountPath: string): {
  credentials: ServiceAccount;
  source: string;
} {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonEnv) {
    try {
      return {
        credentials: JSON.parse(jsonEnv) as ServiceAccount,
        source: "variable FIREBASE_SERVICE_ACCOUNT_JSON",
      };
    } catch {
      console.error("✗ FIREBASE_SERVICE_ACCOUNT_JSON no es JSON válido.");
      process.exit(1);
    }
  }

  if (!serviceAccountPath || !existsSync(serviceAccountPath)) {
    console.error("✗ Falta cuenta de servicio (Admin SDK — solo servidor).");
    console.error("  Opción A — archivo:");
    console.error("    Firebase Console → Cuentas de servicio → Generar clave privada");
    console.error("    npm run seed:production -- --service-account ./service-account.json");
    console.error("  Opción B — variable de entorno (CI):");
    console.error("    FIREBASE_SERVICE_ACCOUNT_JSON='{...}' SPE_PROD_PASSWORD='…' npm run seed:production");
    console.error("  Alternativa sin JSON: npm run ensure:prod-ceo (usa login Auth + REST)");
    process.exit(1);
  }

  return {
    credentials: JSON.parse(readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount,
    source: serviceAccountPath,
  };
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
  const { credentials: raw, source } = loadServiceAccount(serviceAccountPath);

  if (!getApps().length) {
    initializeApp({ credential: cert(raw) });
  }

  const auth = getAuth();
  const db = getFirestore();

  console.log("> Seed producción — cuenta raíz CEO / Master App");
  console.log(`  Proyecto: ${(raw as { project_id?: string }).project_id ?? "?"}`);
  console.log(`  Cuenta de servicio: ${source}\n`);

  for (const u of users) {
    const uid = await upsertAuthUser(auth, u);
    await db.collection("users").doc(uid).set(
      {
        email: u.email,
        nombre: u.nombre,
        role: u.role,
        workerId: null,
        perfilCompleto: true,
        habilitado: true,
      },
      { merge: true },
    );
    console.log(`+ ${u.email} (${u.role})`);
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

  console.log("\n✓ Cuenta raíz de producción lista.");
  console.log("  Siguiente: Master → Equipo administrativo → crear Administrador, RH, Contabilidad.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
