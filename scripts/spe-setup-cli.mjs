#!/usr/bin/env node
/**
 * SPE — Configuración CLI automática (Firebase producción).
 *
 * Uso:
 *   npm run setup:cli                    # sync + diagnóstico + build
 *   npm run setup:cli -- --full          # + secrets gh + seed + firestore + deploy CI
 *   npm run setup:cli -- --push-secrets  # sube VITE_FIREBASE_* + CURSOR_API_KEY a GitHub
 *   npm run setup:cli -- --seed          # crea lasucursaldelcafe@gmail.com
 *   npm run setup:cli -- --firestore     # deploy rules + indexes
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_EMAIL,
  REPO,
  deployFirestoreWithServiceAccount,
  getCursorApiKey,
  getProdPassword,
  getServiceAccountSource,
  ghAvailable,
  pushCursorApiKeySecret,
  isFirebaseConfigComplete,
  loadFirebaseWebConfig,
  pushFirebaseSecrets,
  pushGhSecret,
  run,
  updateFirebaserc,
  writeFirebaseWebConfig,
  writeSetupResult,
} from "./lib/firebase-setup.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const full = args.includes("--full");
const pushSecrets = full || args.includes("--push-secrets");
const doSeed = full || args.includes("--seed");
const doFirestore = full || args.includes("--firestore");
const doDeploy = full || args.includes("--deploy");
const skipInstall = args.includes("--skip-install");

/** @type {string[]} */
const log = [];

function step(title, fn) {
  console.log(`\n=== ${title} ===`);
  log.push(`\n## ${title}`);
  return fn();
}

async function main() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║  SPE — Setup CLI automático (Firebase) ║");
  console.log("╚══════════════════════════════════════╝\n");

  if (!skipInstall) {
    step("1. Dependencias", () => {
      run("npm", ["install"]);
      log.push("- npm install OK");
    });
  }

  let fb = loadFirebaseWebConfig();
  step("2. Firebase SDK web", () => {
    if (!fb) {
      console.log("  ! Falta firebase-web-config.json");
      console.log("    Copia firebase-web-config.example.json → firebase-web-config.json");
      console.log("    O completa config/credenciales.local.json → firebase");
      log.push("- Firebase SDK: PENDIENTE (firebase-web-config.json)");
      return;
    }
    if (!isFirebaseConfigComplete(fb)) {
      console.log("  ! Config Firebase incompleta");
      log.push("- Firebase SDK: INCOMPLETO");
      return;
    }
    writeFirebaseWebConfig(fb);
    updateFirebaserc(fb.projectId);
    console.log(`  + Proyecto: ${fb.projectId}`);
    log.push(`- Firebase SDK: ${fb.projectId}`);
  });

  step("3. Sincronizar config", () => {
    run("node", ["scripts/sync-repo-config.mjs"]);
    log.push("- config:sync OK");
  });

  fb = loadFirebaseWebConfig();

  if (fb && isFirebaseConfigComplete(fb)) {
    step("4. Entorno local (.env.local)", () => {
      if (existsSync(resolve(ROOT, "firebase-web-config.json"))) {
        run("npx", ["tsx", "scripts/setup-automation.ts", "--production", "--skip-install"]);
      }
      log.push("- .env.local generado");
    });
  } else {
    console.log("\n=== 4. Entorno local — omitido (falta Firebase JSON) ===");
  }

  if (pushSecrets && fb && isFirebaseConfigComplete(fb)) {
    step("5. GitHub Secrets", () => {
      if (!ghAvailable()) {
        console.log("  ! gh no autenticado — ejecuta: gh auth login");
        log.push("- GitHub Secrets: gh auth login requerido");
        return;
      }
      const { ok, fail } = pushFirebaseSecrets(fb);
      const sa = getServiceAccountSource();
      if (sa && existsSync(sa.path)) {
        const json = readFileSync(sa.path, "utf-8");
        if (pushGhSecret("FIREBASE_SERVICE_ACCOUNT_JSON", json)) {
          console.log("  + secret FIREBASE_SERVICE_ACCOUNT_JSON");
        }
      }
      const pwd = getProdPassword();
      if (pwd && pushGhSecret("SPE_PROD_PASSWORD", pwd)) {
        console.log("  + secret SPE_PROD_PASSWORD");
      } else if (doSeed) {
        console.log("  ! SPE_PROD_PASSWORD no definida (env o config/acceso.local.json)");
      }
      if (pushCursorApiKeySecret()) {
        console.log("  + secret CURSOR_API_KEY");
        log.push("- CURSOR_API_KEY subida a GitHub Secrets");
      } else if (getCursorApiKey()) {
        console.log("  ! CURSOR_API_KEY definida pero gh secret falló");
        log.push("- CURSOR_API_KEY: falló gh secret set");
      } else {
        console.log("  · CURSOR_API_KEY omitida (env o config/credenciales.local.json → cursorApiKey)");
        log.push("- CURSOR_API_KEY: omitida (opcional)");
      }
      log.push(`- GitHub Secrets Firebase: ${ok} OK, ${fail} fallos`);
    });
  } else if (pushSecrets) {
    console.log("\n=== 5. GitHub Secrets — omitido (Firebase incompleto) ===");
  }

  if (doSeed) {
    step("6. Seed cuenta admin", () => {
      const pwd = getProdPassword();
      const sa = getServiceAccountSource();
      if (!sa) {
        console.log("  ! Falta service-account.json o FIREBASE_SERVICE_ACCOUNT_JSON");
        log.push("- Seed: PENDIENTE service account");
        return;
      }
      if (!pwd) {
        console.log("  ! Falta SPE_PROD_PASSWORD (env, credenciales.local.json o acceso.local.json)");
        log.push("- Seed: PENDIENTE contraseña");
        return;
      }
      const code = run("npm", ["run", "seed:production"], {
        env: {
          SPE_PROD_PASSWORD: pwd,
          FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "",
          GOOGLE_APPLICATION_CREDENTIALS: sa.path,
        },
      });
      if (code === 0) {
        console.log(`  + Cuenta: ${ADMIN_EMAIL}`);
        log.push(`- Seed OK: ${ADMIN_EMAIL}`);
      } else {
        log.push("- Seed FALLÓ");
      }
    });
  }

  if (doFirestore && fb?.projectId) {
    step("7. Firestore rules + indexes", () => {
      const ok = deployFirestoreWithServiceAccount(fb.projectId);
      log.push(ok ? "- Firestore deploy OK" : "- Firestore deploy PENDIENTE");
    });
  }

  step("8. Diagnóstico y build", () => {
    run("node", ["scripts/spe-diagnostico.mjs"]);
    const buildCode = run("npm", ["run", "build"]);
    run("npm", ["run", "check:nav"]);
    log.push(buildCode === 0 ? "- build OK" : "- build FALLÓ");
  });

  if (doDeploy && ghAvailable()) {
    step("9. Disparar workflows GitHub", () => {
      if (doSeed) {
        run("gh", [
          "workflow",
          "run",
          "Crear usuarios Firebase (producción)",
          "--repo",
          REPO,
          "--ref",
          "main",
        ]);
        console.log("  + Workflow seed-production");
      }
      run("gh", [
        "workflow",
        "run",
        "Setup completo SPE",
        "--repo",
        REPO,
        "--ref",
        "main",
        "-f",
        "deploy_pages=true",
        "-f",
        `deploy_firestore=${doFirestore ? "true" : "false"}`,
      ]);
      console.log("  + Workflow setup-completo");
      log.push("- Workflows disparados en GitHub Actions");
    });
  }

  const pwd = getProdPassword();
  log.push(
    "",
    "## Acceso producción",
    "URL: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login",
    `Email: ${ADMIN_EMAIL}`,
    pwd
      ? "Password: (definida — ver config/acceso.local.json o SPE_PROD_PASSWORD)"
      : "Password: PENDIENTE — define SPE_PROD_PASSWORD y --seed",
    "",
    "Docs: docs-source/ACCESO-PRODUCCION.md",
  );
  writeSetupResult(log);

  console.log("\n✓ Setup CLI terminado.\n");
  run("npm", ["run", "acceso"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
