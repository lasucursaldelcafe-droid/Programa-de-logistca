#!/usr/bin/env node
/**
 * Setup producción en un comando (PC con firebase login:ci).
 *
 *   npm run produccion:completa
 */
import { run, ghAvailable, pushFirebaseTokenSecret, pushFirebaseSecrets, loadFirebaseWebConfig, isFirebaseConfigComplete, getProdPassword, pushGhSecret, readJson, REPO, ADMIN_EMAIL } from "./lib/firebase-setup.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function getVapidKey() {
  const fromEnv = process.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (fromEnv) return fromEnv;
  const bootstrap = readJson(resolve(ROOT, "config/bootstrap.json"));
  return bootstrap?.vapidKey?.trim() ?? "";
}

const steps = [];

function mainStep(title, fn) {
  console.log(`\n=== ${title} ===`);
  const ok = fn();
  steps.push({ title, ok });
  return ok;
}

async function main() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║  SPE — Producción completa (local)      ║");
  console.log("╚════════════════════════════════════════╝\n");

  mainStep("1. Sync config", () => run("node", ["scripts/sync-repo-config.mjs"]) === 0);
  mainStep("2. Runtime config + FCM", () => {
    const ok = run("node", ["scripts/write-runtime-config.mjs"]) === 0;
    run("npm", ["run", "setup:fcm"]);
    return ok;
  });

  const fb = loadFirebaseWebConfig();
  const vapidKey = getVapidKey();
  if (fb && isFirebaseConfigComplete(fb)) {
    mainStep("3. GitHub Secrets Firebase", () => {
      if (!ghAvailable()) {
        console.log("  ! gh no autenticado — omite secrets");
        return true;
      }
      const extras = vapidKey ? { VITE_FIREBASE_VAPID_KEY: vapidKey } : {};
      const { fail } = pushFirebaseSecrets(fb, extras);
      return fail === 0;
    });
  } else {
    console.log("\n=== 3. Firebase SDK ===\n  ! Completa firebase-web-config.json o config/bootstrap.json");
  }

  mainStep("4. FIREBASE_TOKEN → GitHub", () => {
    if (!ghAvailable()) return true;
    return pushFirebaseTokenSecret();
  });

  const pwd = getProdPassword() || "SpeAdmin2026!";
  mainStep("5. SPE_PROD_PASSWORD → GitHub", () => {
    if (!ghAvailable()) return true;
    return pushGhSecret("SPE_PROD_PASSWORD", pwd);
  });

  mainStep("6. Desplegar Firestore (reglas + índices chat)", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    return run("node", ["scripts/deploy-firestore.mjs"]) === 0
      || run("node", ["scripts/deploy-firestore-rules-api.mjs"]) === 0;
  });

  mainStep("7. Bootstrap Firestore", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    return run("npm", ["run", "firestore:bootstrap", "--", "--uid", "8kJ9xnbXwlNVQerimF088JXo8Ql1", "--skip-auth"]) === 0;
  });

  mainStep("8. Asegurar CEO + verificar login", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    const ceo = run("npm", ["run", "ensure:prod-ceo"]) === 0;
    const ok = run("node", ["scripts/verify-prod-login.mjs"]) === 0;
    return ceo && ok;
  });

  mainStep("9. QR + cuentas de equipo", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    return run("npm", ["run", "desbloquear:operacion"]) === 0;
  });

  console.log("\n=== Resumen ===");
  for (const s of steps) console.log(`  ${s.ok ? "✓" : "✗"} ${s.title}`);

  console.log(`\nLogin: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login`);
  console.log(`Cuenta raíz CEO: ${ADMIN_EMAIL}`);
  console.log(`QR: /qr-sitios  |  Cuentas: salida del paso 9`);
  console.log(`Repo: ${REPO}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
