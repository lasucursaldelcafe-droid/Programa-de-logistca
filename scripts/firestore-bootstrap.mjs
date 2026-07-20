#!/usr/bin/env node
/**
 * Bootstrap Firestore + cuenta admin SIN JSON de cuenta de servicio.
 *
 * Usa FIREBASE_TOKEN (firebase login:ci) + SDK web (apiKey) + SPE_PROD_PASSWORD.
 * Ideal cuando la organización bloquea claves de service account.
 *
 * Uso:
 *   firebase login:ci   → copia token a config/credenciales.local.json → firebaseToken
 *   npm run firestore:bootstrap
 *
 *   FIREBASE_TOKEN='…' SPE_PROD_PASSWORD='…' npm run firestore:bootstrap
 *   npm run firestore:bootstrap -- --uid 8kJ9xnbXwlNVQerimF088JXo8Ql1 --skip-auth
 *
 * GitHub Actions: secrets FIREBASE_TOKEN + VITE_FIREBASE_* + SPE_PROD_PASSWORD
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_EMAIL,
  getProdPassword,
  getServiceAccountSource,
  loadFirebaseWebConfig,
  isFirebaseConfigComplete,
  run,
  updateFirebaserc,
  writeSetupResult,
} from "./lib/firebase-setup.mjs";
import { getAccessTokenFromRefreshToken } from "./lib/firebase-token.mjs";
import { signInOrCreateUser, upsertFirestoreDocument } from "./lib/firestore-rest.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

function parseArgs() {
  let uid = process.env.SPE_ADMIN_UID?.trim() ?? "";
  let skipAuth = false;
  let location = process.env.FIRESTORE_LOCATION?.trim() ?? "nam5";
  let deployRules = true;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--uid" && args[i + 1]) uid = args[++i];
    else if (a === "--skip-auth") skipAuth = true;
    else if (a === "--location" && args[i + 1]) location = args[++i];
    else if (a === "--no-deploy-rules") deployRules = false;
  }

  return { uid, skipAuth, location, deployRules };
}

async function getFirebaseTokenSync() {
  const fromEnv = process.env.FIREBASE_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const { readFileSync } = await import("node:fs");
  const path = resolve(ROOT, "config/credenciales.local.json");
  if (!existsSync(path)) return "";
  try {
    const local = JSON.parse(readFileSync(path, "utf-8"));
    return local?.firebaseToken?.trim() ?? "";
  } catch {
    return "";
  }
}

async function ensureFirestoreDatabase(projectId, firebaseToken, location) {
  console.log("\n→ Comprobando base de datos Firestore…");
  const listCode = run(
    "npx",
    ["firebase-tools", "firestore:databases:list", "--project", projectId, "--json"],
    { stdio: "pipe", env: { FIREBASE_TOKEN: firebaseToken, ...process.env } },
  );

  if (listCode === 0) {
    console.log("  + Base de datos Firestore accesible");
    return true;
  }

  console.log(`  · Creando base de datos (default) en ${location}…`);
  const createCode = run(
    "npx",
    [
      "firebase-tools",
      "firestore:databases:create",
      "(default)",
      "--location",
      location,
      "--project",
      projectId,
    ],
    { env: { FIREBASE_TOKEN: firebaseToken, ...process.env } },
  );

  if (createCode === 0) {
    console.log("  + Base de datos creada");
    return true;
  }

  console.log("  ! No se pudo crear/listar BD — si ya la creaste en consola, continúa");
  return false;
}

async function deployFirestoreRules(projectId, firebaseToken) {
  console.log("\n→ Desplegando reglas e índices Firestore…");
  const sa = getServiceAccountSource();
  const env = sa
    ? { GOOGLE_APPLICATION_CREDENTIALS: sa.path }
    : { FIREBASE_TOKEN: firebaseToken };

  const code = run(
    "npx",
    [
      "firebase-tools",
      "deploy",
      "--only",
      "firestore:rules,firestore:indexes",
      "--project",
      projectId,
      "--non-interactive",
    ],
    { env: { ...process.env, ...env } },
  );

  if (code === 0) {
    console.log("  + Reglas e índices desplegados");
    return true;
  }
  console.log("  ! Deploy falló — verifica FIREBASE_TOKEN o firebase login");
  return false;
}

async function main() {
  const { uid: uidArg, skipAuth, location, deployRules } = parseArgs();
  const fb = loadFirebaseWebConfig();
  const password = getProdPassword();
  const firebaseToken = await getFirebaseTokenSync();

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  SPE — Bootstrap Firestore (sin JSON SA) ║");
  console.log("╚══════════════════════════════════════════╝");

  if (!fb || !isFirebaseConfigComplete(fb)) {
    console.error("\n✗ Falta firebase-web-config.json o secrets VITE_FIREBASE_*");
    process.exit(1);
  }

  updateFirebaserc(fb.projectId);
  console.log(`\n  Proyecto: ${fb.projectId}`);

  if (!firebaseToken && !getServiceAccountSource()) {
    console.error("\n✗ Falta FIREBASE_TOKEN (firebase login:ci)");
    console.error("  PC: firebase login:ci → guarda en config/credenciales.local.json → firebaseToken");
    console.error("  GitHub Secret: FIREBASE_TOKEN");
    console.error("  npm run setup:firebase-token");
    process.exit(1);
  }

  const log = [`Bootstrap Firestore — ${fb.projectId}`];

  if (firebaseToken) {
    await ensureFirestoreDatabase(fb.projectId, firebaseToken, location);
    log.push("- BD Firestore verificada/creada");
  }

  if (deployRules) {
    const ok = await deployFirestoreRules(fb.projectId, firebaseToken);
    log.push(ok ? "- Reglas desplegadas" : "- Reglas: pendiente");
  }

  let uid = uidArg;
  if (!skipAuth && !uid) {
    if (!password) {
      console.error("\n✗ Falta SPE_PROD_PASSWORD para crear/verificar usuario Auth");
      process.exit(1);
    }
    console.log("\n→ Auth: crear o verificar usuario admin…");
    const session = await signInOrCreateUser(fb.apiKey, ADMIN_EMAIL, password);
    uid = session.uid;
    console.log(`  + Auth OK — UID: ${uid}`);
    log.push(`- Auth: ${ADMIN_EMAIL} (${uid})`);
  } else if (uid) {
    console.log(`\n→ Auth omitido — UID: ${uid}`);
    log.push(`- Auth omitido, UID=${uid}`);
  } else {
    console.error("\n✗ Indica --uid … o quita --skip-auth");
    process.exit(1);
  }

  if (!firebaseToken) {
    console.log("\n! Sin FIREBASE_TOKEN no se puede escribir Firestore vía REST");
    log.push("- Firestore doc: requiere FIREBASE_TOKEN");
    writeSetupResult(log);
    process.exit(1);
  }

  console.log("\n→ Firestore: documento users/{uid}…");
  const accessToken = await getAccessTokenFromRefreshToken(firebaseToken);

  await upsertFirestoreDocument({
    accessToken,
    projectId: fb.projectId,
    collection: "users",
    docId: uid,
    data: {
      email: ADMIN_EMAIL,
      nombre: "La Sucursal del Café",
      role: "administrador",
      workerId: null,
      perfilCompleto: true,
    },
  });
  console.log(`  + users/${uid} creado/actualizado`);

  await upsertFirestoreDocument({
    accessToken,
    projectId: fb.projectId,
    collection: "setupConfig",
    docId: "default",
    data: {
      completado: false,
      pasoActual: "evento",
      pasosCompletados: [],
      actualizadoEn: new Date().toISOString(),
      actualizadoPorNombre: "firestore:bootstrap",
    },
  });
  console.log("  + setupConfig/default OK");

  log.push(`- Firestore users/${uid} OK`, "- setupConfig/default OK");
  log.push("", `Login: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login`);
  log.push(`Email: ${ADMIN_EMAIL}`);

  writeSetupResult(log);
  console.log("\n✓ Bootstrap Firestore completado.\n");
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
