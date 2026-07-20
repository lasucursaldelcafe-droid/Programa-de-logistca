#!/usr/bin/env node
/**
 * Diagnóstico SPE — analiza config, backend, login, deploy y secrets.
 *
 * Uso:
 *   npm run diagnostico
 *   npm run diagnostico -- --json
 *   npm run diagnostico -- --ci
 *   npm run diagnostico -- --fix   (delega en spe-cd-auto.mjs)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isConfigSet } from "./lib/config-placeholders.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(ROOT, "config");

const PLACEHOLDER_FIREBASE = new Set([
  "",
  "demo-api-key",
  "demo-personal-eventos",
  "000000000000",
  "1:000000000000:web:demo",
]);

const PLACEHOLDER_SHEETS = /TU_ID|PEGAR_|TU_CONTRASEÑA|^tu-token$|^tu-token-de-/i;

/** @typedef {"ok"|"warn"|"fail"} CheckStatus */
/** @typedef {{ id: string, status: CheckStatus, message: string, fix?: string }} Check */

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

function isRealFirebaseKey(value) {
  const v = (value ?? "").trim();
  return v.length > 0 && !PLACEHOLDER_FIREBASE.has(v);
}

async function fetchOk(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(t);
  }
}

async function sheetsHealth(url, token) {
  if (!isRealString(url) || !isRealString(token)) {
    return { ok: false, error: "URL o token vacíos" };
  }
  const base = url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}?action=health&token=${encodeURIComponent(token)}`);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: !!data.ok, backend: data.backend };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function envFirebase() {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.VITE_FIREBASE_APP_ID ?? "",
  };
}

function mergeFirebase(fromBootstrap, fromEnv) {
  const out = { ...fromBootstrap };
  for (const [k, v] of Object.entries(fromEnv)) {
    if (isRealFirebaseKey(v)) out[k] = v.trim();
  }
  return out;
}

function firebaseComplete(fb) {
  const keys = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  const missing = keys.filter((k) => !isRealFirebaseKey(fb[k]));
  return { complete: missing.length === 0, missing };
}

/**
 * @param {{ ci?: boolean }} opts
 */
export async function runDiagnostic(opts = {}) {
  const ci = opts.ci ?? process.argv.includes("--ci");
  /** @type {Check[]} */
  const checks = [];
  /** @type {string[]} */
  const recommendations = [];

  const proyecto = readJson(resolve(CONFIG, "proyecto.json"));
  const cuentas = readJson(resolve(CONFIG, "cuentas-app.json"));
  const bootstrap = readJson(resolve(CONFIG, "bootstrap.json"));
  const runtime = readJson(resolve(ROOT, "apps/admin/public/spe-runtime-config.json"));
  const credLocal = readJson(resolve(CONFIG, "credenciales.local.json"));
  const credEjemplo = existsSync(resolve(CONFIG, "credenciales.local.ejemplo.json"));
  const sheetsTxt = existsSync(resolve(ROOT, "CREDENCIALES-SHEETS-AUTO.txt"));
  const fbWebFile = readJson(resolve(ROOT, "firebase-web-config.json"));
  const serviceAccount = existsSync(resolve(ROOT, "service-account.json"));

  // --- Archivos base ---
  checks.push({
    id: "config.proyecto",
    status: proyecto ? "ok" : "fail",
    message: proyecto ? "config/proyecto.json presente" : "Falta config/proyecto.json",
    fix: "Restaura config/proyecto.json desde el repo",
  });

  const prodCuentas = cuentas?.produccion?.cuentas?.length ?? 0;
  const demoCuentas = cuentas?.modoDemo?.cuentas?.length ?? 0;
  checks.push({
    id: "config.cuentas",
    status: prodCuentas || demoCuentas ? "ok" : "warn",
    message: prodCuentas
      ? `${prodCuentas} cuenta(s) producción documentadas`
      : demoCuentas
        ? `${demoCuentas} cuentas demo documentadas`
        : "Falta config/cuentas-app.json o cuentas",
    fix: "Usa admin@eventos.test / Admin123! — ver config/cuentas-app.json",
  });

  checks.push({
    id: "config.bootstrap",
    status: bootstrap ? "ok" : "fail",
    message: bootstrap ? `bootstrap: backend=${bootstrap.backend ?? "?"} demo=${bootstrap.demoMode}` : "Falta config/bootstrap.json",
    fix: "Ejecuta npm run config:sync",
  });

  // --- Backend efectivo ---
  const sheetsUrlFixed =
    bootstrap?.sheetsWebAppUrl?.trim() ||
    process.env.VITE_SHEETS_WEB_APP_URL?.trim() ||
    credLocal?.sheets?.webAppUrl?.trim() ||
    "";
  const sheetsTokenFixed =
    bootstrap?.sheetsApiToken?.trim() ||
    process.env.VITE_SHEETS_API_TOKEN?.trim() ||
    credLocal?.sheets?.apiToken?.trim() ||
    "";

  const fb = mergeFirebase(bootstrap?.firebase ?? {}, mergeFirebase(fbWebFile ?? {}, envFirebase()));
  const fbCheck = firebaseComplete(fb);

  let effectiveBackend = bootstrap?.backend ?? "demo";
  if (bootstrap?.demoMode === true && effectiveBackend !== "demo") {
    checks.push({
      id: "bootstrap.inconsistente",
      status: "warn",
      message: `demoMode=true pero backend=${effectiveBackend}`,
      fix: "npm run diagnostico:fix — resetea a demo coherente",
    });
  }

  const wantsSheets =
    effectiveBackend === "sheets" || (isRealString(sheetsUrlFixed) && isRealString(sheetsTokenFixed));
  const wantsFirebase = effectiveBackend === "firebase" || fbCheck.complete;

  // --- Sheets ---
  if (wantsSheets) {
    if (!isRealString(sheetsUrlFixed) || !isRealString(sheetsTokenFixed)) {
      checks.push({
        id: "sheets.credenciales",
        status: "fail",
        message: "Backend Sheets configurado pero faltan URL o token",
        fix: "Edita config/bootstrap.json (celular) o npm run setup:sheets-auto (PC)",
      });
      effectiveBackend = "demo";
      recommendations.push("Sheets incompleto → login demo: admin@eventos.test / Admin123!");
    } else {
      const health = await sheetsHealth(sheetsUrlFixed, sheetsTokenFixed);
      checks.push({
        id: "sheets.health",
        status: health.ok ? "ok" : "fail",
        message: health.ok
          ? `Sheets responde OK (${health.backend ?? "health"})`
          : `Sheets no responde: ${health.error ?? "Unauthorized"}`,
        fix: health.ok
          ? undefined
          : "Token/URL incorrectos — corrige bootstrap.json o pulsa Restablecer modo demo en /login",
      });
      if (!health.ok) {
        effectiveBackend = "demo";
        recommendations.push("Sheets caído → auto-fix puede volver a modo demo");
      }
    }
  } else if (sheetsTxt) {
    checks.push({
      id: "sheets.archivo",
      status: "warn",
      message: "CREDENCIALES-SHEETS-AUTO.txt existe pero bootstrap no usa Sheets",
      fix: "npm run sync:bootstrap && npm run config:sync",
    });
  }

  // --- Firebase ---
  if (wantsFirebase && !wantsSheets) {
    checks.push({
      id: "firebase.sdk",
      status: fbCheck.complete ? "ok" : "fail",
      message: fbCheck.complete
        ? `Firebase SDK completo (project: ${fb.projectId})`
        : `Firebase incompleto: faltan ${fbCheck.missing.join(", ")}`,
      fix: "GitHub Secrets VITE_FIREBASE_* o config/credenciales.local.json + config:sync",
    });
    if (!fbCheck.complete) {
      effectiveBackend = bootstrap?.demoMode ? "demo" : effectiveBackend;
      recommendations.push("Firebase incompleto → GitHub Pages queda en demo hasta configurar Secrets");
    }
  }

  if (ci) {
    const secretKeys = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_SHEETS_WEB_APP_URL",
      "VITE_SHEETS_API_TOKEN",
      "FIREBASE_SERVICE_ACCOUNT_JSON",
    ];
    const present = secretKeys.filter((k) => (process.env[k] ?? "").trim().length > 0);
    checks.push({
      id: "ci.secrets",
      status: present.length > 0 ? "ok" : "warn",
      message:
        present.length > 0
          ? `Secrets CI presentes: ${present.join(", ")}`
          : "Ningún secret VITE_* inyectado en este job (normal en diagnóstico local)",
      fix: present.length ? undefined : "Configura Secrets en GitHub → Settings → Actions",
    });

    const hasSa = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "").trim().length > 10;
    checks.push({
      id: "firebase.seed",
      status: hasSa ? "ok" : "warn",
      message: hasSa
        ? "FIREBASE_SERVICE_ACCOUNT_JSON listo para seed:production"
        : "Sin cuenta de servicio — no se pueden crear usuarios Firebase automáticamente",
      fix: "Workflow «Crear usuarios Firebase (producción)» requiere FIREBASE_SERVICE_ACCOUNT_JSON",
    });
  } else {
    checks.push({
      id: "credenciales.local",
      status: credLocal ? "ok" : credEjemplo ? "warn" : "fail",
      message: credLocal
        ? "config/credenciales.local.json presente (local)"
        : credEjemplo
          ? "Solo plantilla credenciales.local.ejemplo.json — copia a credenciales.local.json"
          : "Falta plantilla de credenciales locales",
      fix: "cp config/credenciales.local.ejemplo.json config/credenciales.local.json",
    });

    checks.push({
      id: "firebase.serviceAccount",
      status:
        serviceAccount || bootstrap?.setupCompletado?.firebaseSecrets
          ? "ok"
          : effectiveBackend === "sheets"
            ? "ok"
            : "warn",
      message: serviceAccount
        ? "service-account.json presente (seed local)"
        : bootstrap?.setupCompletado?.firebaseSecrets
          ? "Firebase Secrets marcados listos (GitHub Actions)"
          : effectiveBackend === "sheets"
            ? "Opcional — backend activo es Sheets; Firebase solo para releases/FCM"
            : "Sin service-account.json — seed:production solo vía GitHub Actions",
      fix:
        serviceAccount || bootstrap?.setupCompletado?.firebaseSecrets || effectiveBackend === "sheets"
          ? undefined
          : "Firebase Console → Cuentas de servicio → Generar clave",
    });
  }

  // --- Runtime sync ---
  if (runtime && bootstrap) {
    const syncOk =
      runtime.backend === bootstrap.backend &&
      runtime.demoMode === bootstrap.demoMode;
    checks.push({
      id: "runtime.sync",
      status: syncOk ? "ok" : "warn",
      message: syncOk
        ? "spe-runtime-config.json alineado con bootstrap"
        : `Desalineado: runtime=${runtime.backend} vs bootstrap=${bootstrap.backend}`,
      fix: "npm run config:sync",
    });
  }

  // --- GitHub Pages ---
  const pagesUrl =
    proyecto?.appWeb ?? "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";
  const loginUrl = `${pagesUrl.replace(/\/?$/, "/")}login`;
  const pagesFetch = await fetchOk(pagesUrl);
  checks.push({
    id: "pages.live",
    status: pagesFetch.ok ? "ok" : "fail",
    message: pagesFetch.ok
      ? `GitHub Pages responde (${pagesFetch.status})`
      : `GitHub Pages no accesible: ${pagesFetch.error ?? pagesFetch.status}`,
    fix: "Actions → «Publicar app (GitHub Pages)» o «SPE — Diagnóstico y CD» con deploy=true",
  });

  // --- Login demo guidance ---
  if (effectiveBackend === "demo" || bootstrap?.demoMode) {
    checks.push({
      id: "login.demo",
      status: "ok",
      message: "Login demo: admin@eventos.test / Admin123! — Restablecer modo demo si falla",
      fix: undefined,
    });
    recommendations.push(`App: ${loginUrl}`);
  }

  // --- Docs build ---
  const docsIndex = existsSync(resolve(ROOT, "docs/index.html"));
  checks.push({
    id: "docs.build",
    status: docsIndex ? "ok" : "warn",
    message: docsIndex ? "docs/index.html presente en repo" : "Sin build Pages en docs/ — ejecutar build:pages",
    fix: "npm run build:pages",
  });

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const overall = failCount > 0 ? "error" : warnCount > 0 ? "warning" : "ok";

  const report = {
    timestamp: new Date().toISOString(),
    overall,
    effectiveBackend,
    demoMode: effectiveBackend === "demo" || bootstrap?.demoMode === true,
    pagesUrl,
    loginUrl,
    checks,
    recommendations,
    summary: {
      ok: checks.filter((c) => c.status === "ok").length,
      warn: warnCount,
      fail: failCount,
      total: checks.length,
    },
  };

  return report;
}

function printReport(report) {
  const icon = { ok: "+", warn: "!", fail: "✗" };
  console.log("\n=== SPE Diagnóstico ===");
  console.log(`Estado: ${report.overall.toUpperCase()} | Backend efectivo: ${report.effectiveBackend}`);
  console.log(`App: ${report.loginUrl}\n`);
  for (const c of report.checks) {
    console.log(`${icon[c.status] ?? "?"} [${c.id}] ${c.message}`);
    if (c.fix && c.status !== "ok") console.log(`    → ${c.fix}`);
  }
  if (report.recommendations.length) {
    console.log("\nRecomendaciones:");
    for (const r of report.recommendations) console.log(`  • ${r}`);
  }
  console.log(`\nResumen: ${report.summary.ok} ok, ${report.summary.warn} avisos, ${report.summary.fail} errores\n`);
}

async function main() {
  if (process.argv.includes("--fix")) {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("node", ["scripts/spe-cd-auto.mjs", "--fix"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    process.exit(r.status ?? 1);
  }

  const report = await runDiagnostic({ ci: process.argv.includes("--ci") });
  const jsonMode = process.argv.includes("--json");

  const outDir = resolve(ROOT, "config");
  mkdirSync(outDir, { recursive: true });
  const reportPath = resolve(outDir, "diagnostico-report.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
    console.log(`Reporte guardado: config/diagnostico-report.json`);
  }

  process.exit(report.overall === "error" ? 1 : 0);
}

const isMain = process.argv[1]?.endsWith("spe-diagnostico.mjs");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
