#!/usr/bin/env node
/**
 * Setup producción en un comando (PC con firebase login:ci).
 *
 *   npm run produccion:completa
 */
import { run, ghAvailable, pushFirebaseTokenSecret, pushFirebaseSecrets, loadFirebaseWebConfig, isFirebaseConfigComplete, getProdPassword, pushGhSecret, REPO, ADMIN_EMAIL } from "./lib/firebase-setup.mjs";

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
  mainStep("2. Runtime config", () => run("node", ["scripts/write-runtime-config.mjs"]) === 0);

  const fb = loadFirebaseWebConfig();
  if (fb && isFirebaseConfigComplete(fb)) {
    mainStep("3. GitHub Secrets Firebase", () => {
      if (!ghAvailable()) {
        console.log("  ! gh no autenticado — omite secrets");
        return true;
      }
      const { fail } = pushFirebaseSecrets(fb);
      return fail === 0;
    });
  } else {
    console.log("\n=== 3. Firebase SDK ===\n  ! Completa firebase-web-config.json");
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

  mainStep("6. Desplegar reglas Firestore", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    return run("node", ["scripts/deploy-firestore-rules-api.mjs"]) === 0
      || run("npm", ["run", "firestore:bootstrap", "--", "--uid", "8kJ9xnbXwlNVQerimF088JXo8Ql1", "--skip-auth"]) === 0;
  });

  mainStep("7. Bootstrap Firestore", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    return run("npm", ["run", "firestore:bootstrap", "--", "--uid", "8kJ9xnbXwlNVQerimF088JXo8Ql1", "--skip-auth"]) === 0;
  });

  mainStep("8. Verificar login", () => {
    process.env.SPE_PROD_PASSWORD = pwd;
    return run("node", ["scripts/verify-prod-login.mjs"]) === 0;
  });

  console.log("\n=== Resumen ===");
  for (const s of steps) console.log(`  ${s.ok ? "✓" : "✗"} ${s.title}`);

  console.log(`\nLogin: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login`);
  console.log(`Cuenta: ${ADMIN_EMAIL} / ${pwd}`);
  console.log(`Repo: ${REPO}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
