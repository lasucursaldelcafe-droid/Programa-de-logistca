#!/usr/bin/env node
/**
 * Despliega SPE Backend en Google Sheets + Apps Script SIN descargar JSON.
 * Solo requiere: navegador + cuenta Google (clasp login).
 *
 * Uso: npm run setup:sheets-auto
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT_DIR = resolve(ROOT, "apps-script/spe-backend");
const CLASP_JSON = resolve(SCRIPT_DIR, ".clasp.json");
const ENV_APPS = [
  resolve(ROOT, "apps/admin/.env.local"),
  resolve(ROOT, "apps/worker/.env.local"),
  resolve(ROOT, "apps/master/.env.local"),
];

function log(msg, level = "info") {
  const p = { info: ">", ok: "+", warn: "!", err: "✗" }[level] ?? ">";
  console.log(`${p} ${msg}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? SCRIPT_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...opts.env },
  });
  return r.status ?? 1;
}

function writeEnv(webAppUrl, apiToken) {
  const content = `VITE_DEMO_MODE=false
VITE_USE_FIREBASE_EMULATORS=false
VITE_DATA_BACKEND=sheets
VITE_BLOQUEAR_INTEGRACIONES=true
VITE_INTEGRACIONES_CLAVE=spe-desbloquear
VITE_SHEETS_WEB_APP_URL=${webAppUrl}
VITE_SHEETS_API_TOKEN=${apiToken}
VITE_FIREBASE_API_KEY=sheets-bridge
VITE_FIREBASE_AUTH_DOMAIN=sheets.local
VITE_FIREBASE_PROJECT_ID=sheets-bridge
VITE_FIREBASE_STORAGE_BUCKET=sheets.local
VITE_FIREBASE_MESSAGING_SENDER_ID=0
VITE_FIREBASE_APP_ID=sheets-bridge
`;
  for (const p of ENV_APPS) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content, "utf-8");
    log(`Escrito ${p.replace(ROOT + "/", "")}`, "ok");
  }
}

function saveCredentials(webAppUrl, apiToken, spreadsheetUrl) {
  const path = resolve(ROOT, "CREDENCIALES-SHEETS-AUTO.txt");
  writeFileSync(
    path,
    [
      "SPE — Google Sheets + Apps Script (automático)",
      "",
      `Web App URL: ${webAppUrl}`,
      `API Token: ${apiToken}`,
      spreadsheetUrl ? `Hoja: ${spreadsheetUrl}` : "",
      "",
      "Cuentas:",
      "  admin@eventos.test / Admin123!",
      "  master@eventos.test / Master123!",
      "",
      "Probar: npm start",
      "GitHub Pages: añade VITE_SHEETS_* como Secrets",
    ]
      .filter(Boolean)
      .join("\n") + "\n",
    "utf-8",
  );
  log(`Credenciales: ${path}`, "ok");
}

function main() {
  console.log("\n=== SPE — Google Sheets automático (sin JSON) ===\n");

  log("Verificando clasp…");
  if (run("npx", ["@google/clasp", "--version"], { cwd: ROOT }) !== 0) {
    log("Instalando @google/clasp…");
    if (run("npm", ["install", "--save-dev", "@google/clasp"], { cwd: ROOT }) !== 0) {
      log("No se pudo instalar clasp", "err");
      process.exit(1);
    }
  }

  log("Iniciando sesión Google (se abrirá el navegador)…");
  log("  Si ya iniciaste sesión antes, clasp la reutiliza.", "warn");
  if (run("npx", ["@google/clasp", "login", "--no-localhost"], { cwd: ROOT }) !== 0) {
    log("clasp login falló. Prueba: npx @google/clasp login", "err");
    process.exit(1);
  }

  const apiToken = randomBytes(24).toString("hex");
  log(`Token API generado: ${apiToken.slice(0, 8)}…`, "ok");

  if (!existsSync(CLASP_JSON)) {
    log("Creando proyecto Sheets + script…");
    const title = `SPE Backend ${new Date().toISOString().slice(0, 10)}`;
    if (run("npx", ["@google/clasp", "create", "--type", "sheets", "--title", title, "--rootDir", "."]) !== 0) {
      log("clasp create falló", "err");
      process.exit(1);
    }
  } else {
    log("Reutilizando .clasp.json existente", "ok");
  }

  log("Subiendo Code.gs…");
  if (run("npx", ["@google/clasp", "push", "--force"]) !== 0) {
    log("clasp push falló", "err");
    process.exit(1);
  }

  log("Configurando token en el script…");
  run("npx", ["@google/clasp", "run", "setSpeApiToken", "--params", JSON.stringify([apiToken])]);

  log("Creando hojas y usuarios iniciales…");
  run("npx", ["@google/clasp", "run", "setupSheets"]);

  log("Desplegando Web App…");
  const deployCode = run("npx", ["@google/clasp", "deploy", "--description", "SPE production"]);
  if (deployCode !== 0) {
    log("Deploy automático falló — implementa manualmente:", "warn");
    log("  script.google.com → Implementar → Web App → Cualquiera", "warn");
  }

  let webAppUrl = "";
  const openR = spawnSync("npx", ["@google/clasp", "open", "--webapp"], {
    cwd: SCRIPT_DIR,
    encoding: "utf-8",
    shell: process.platform === "win32",
  });
  const combined = `${openR.stdout ?? ""}${openR.stderr ?? ""}`;
  const urlMatch = combined.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/);
  if (urlMatch) {
    webAppUrl = urlMatch[0];
  }

  if (!webAppUrl && existsSync(CLASP_JSON)) {
    log("Pega la URL /exec de la Web App cuando la tengas:", "warn");
    log("  (Apps Script → Implementar → Administrar implementaciones)", "warn");
    const manualPath = resolve(ROOT, "sheets-web-app-url.txt");
    if (existsSync(manualPath)) {
      webAppUrl = readFileSync(manualPath, "utf-8").trim();
    }
  }

  if (!webAppUrl) {
    writeFileSync(
      resolve(ROOT, "sheets-web-app-url.txt"),
      "# Pega aquí la URL /exec y vuelve a ejecutar npm run setup:sheets-auto\n",
      "utf-8",
    );
    log("Guarda la URL en sheets-web-app-url.txt y repite el comando", "err");
    process.exit(1);
  }

  writeEnv(webAppUrl, apiToken);
  saveCredentials(webAppUrl, apiToken, "");

  log("\n✓ Backend Sheets listo. npm start → admin@eventos.test / Admin123!", "ok");
}

main();
