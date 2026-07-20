#!/usr/bin/env node
/**
 * CD automático SPE — diagnostica, corrige lo posible y prepara deploy.
 *
 * Uso:
 *   npm run cd:auto
 *   npm run cd:auto -- --fix
 *   npm run cd:auto -- --fix --deploy   (local: build:pages)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { isConfigSet } from "./lib/config-placeholders.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BOOTSTRAP = resolve(ROOT, "config/bootstrap.json");

const PLACEHOLDER_SHEETS = /TU_ID|PEGAR_|TU_CONTRASEÑA|^tu-token$|^tu-token-de-/i;

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function isRealString(value) {
  return isConfigSet(value);
}

async function sheetsHealth(url, token) {
  const base = url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}?action=health&token=${encodeURIComponent(token)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", encoding: "utf-8" });
  return r.status ?? 1;
}

function enforceFirebaseProduction(reason) {
  const current = readJson(BOOTSTRAP) ?? {};
  const fixed = {
    ...current,
    backend: "firebase",
    demoMode: false,
    sheetsWebAppUrl: "",
    sheetsApiToken: "",
    firebase: current.firebase ?? {},
    _diagnostico: {
      autoFixEn: new Date().toISOString(),
      motivo: reason,
    },
  };
  writeFileSync(BOOTSTRAP, `${JSON.stringify(fixed, null, 2)}\n`);
  console.log(`+ bootstrap → firebase producción (${reason})`);
  return true;
}

function resetBootstrapDemo(reason) {
  // Producción SPE es Firebase-only: no volver a demo automáticamente.
  return enforceFirebaseProduction(`legacy-demo-fix: ${reason}`);
}

async function applyAutoFixes(report) {
  /** @type {string[]} */
  const applied = [];
  const bootstrap = readJson(BOOTSTRAP);

  if (bootstrap?.backend === "sheets") {
    const url = bootstrap.sheetsWebAppUrl?.trim() ?? "";
    const token = bootstrap.sheetsApiToken?.trim() ?? "";
    if (!isRealString(url) || !isRealString(token)) {
      enforceFirebaseProduction("Sheets sin URL/token válidos");
      applied.push("bootstrap→firebase (sheets incompleto)");
    } else {
      const ok = await sheetsHealth(url, token);
      if (!ok) {
        enforceFirebaseProduction("Sheets health check falló");
        applied.push("bootstrap→firebase (sheets no responde)");
      }
    }
  }

  if (bootstrap?.backend === "firebase" && bootstrap?.demoMode === true) {
    enforceFirebaseProduction("demoMode=true con backend firebase");
    applied.push("bootstrap→firebase (demoMode corregido)");
  }

  const failedChecks = report.checks.filter((c) => c.status === "fail" || c.status === "warn");
  const needsSync = failedChecks.some((c) =>
    ["runtime.sync", "config.bootstrap", "sheets.archivo"].includes(c.id),
  );
  if (needsSync || applied.length > 0) {
    run("node", ["scripts/sync-repo-config.mjs"]);
    run("node", ["scripts/write-runtime-config.mjs"]);
    applied.push("config:sync", "config:runtime");
  }

  return applied;
}

async function main() {
  const fix = process.argv.includes("--fix");
  const deploy = process.argv.includes("--deploy");

  const { runDiagnostic } = await import("./spe-diagnostico.mjs");
  let report = await runDiagnostic({ ci: process.env.CI === "true" || process.argv.includes("--ci") });

  console.log("\n=== SPE CD Automático ===\n");

  if (fix) {
    const applied = await applyAutoFixes(report);
    if (applied.length) {
      console.log("\nAuto-fix aplicado:");
      for (const a of applied) console.log(`  + ${a}`);
      report = await runDiagnostic({ ci: process.argv.includes("--ci") });
    } else {
      console.log("○ Nada que corregir automáticamente");
    }
  }

  writeFileSync(
    resolve(ROOT, "config/diagnostico-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  if (deploy) {
    console.log("\n→ Build GitHub Pages…");
    const code = run("npm", ["run", "build:pages"]);
    if (code !== 0) {
      console.error("✗ build:pages falló");
      process.exit(code);
    }
    console.log("✓ build:pages OK — push docs/ o ejecuta workflow deploy");
  }

  console.log(`\nEstado final: ${report.overall} | Backend: ${report.effectiveBackend}`);
  console.log(`Login: ${report.loginUrl}`);

  if (report.effectiveBackend === "firebase") {
    console.log(`Cuenta: ${process.env.SPE_ADMIN_EMAIL ?? "lasucursaldelcafe@gmail.com"} (Firebase Auth)`);
    console.log("  npm run acceso — ver instrucciones de login");
  }

  process.exit(report.overall === "error" ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
