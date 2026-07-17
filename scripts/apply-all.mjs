#!/usr/bin/env node
/**
 * Aplica configuración producción y dispara deploy en GitHub Pages.
 * 1) Intenta subir Secrets (requiere gh auth con permisos admin)
 * 2) Si falla, dispara workflow con inputs (un clic en Actions)
 *
 * Uso:
 *   npm run apply:all              # lee CREDENCIALES-SHEETS-AUTO.txt
 *   npm run apply:all -- --setup   # ejecuta setup:sheets-auto antes
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CRED_FILE = resolve(ROOT, "CREDENCIALES-SHEETS-AUTO.txt");
const REPO = process.env.GITHUB_REPOSITORY ?? "lasucursaldelcafe-droid/Programa-de-logistca";
const WORKFLOW = "Publicar app (GitHub Pages)";

function log(msg, level = "info") {
  const p = { info: ">", ok: "+", warn: "!", err: "✗" }[level] ?? ">";
  console.log(`${p} ${msg}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: "utf-8",
    stdio: opts.stdio ?? "pipe",
    shell: process.platform === "win32",
  });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function parseCredentials(path) {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf-8");
  const urlMatch = text.match(/Web App URL:\s*(https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec)/i);
  const tokenMatch = text.match(/API Token:\s*(\S+)/i);
  if (!urlMatch?.[1] || !tokenMatch?.[1]) return null;
  return { webAppUrl: urlMatch[1].trim(), apiToken: tokenMatch[1].trim() };
}

function setSecrets(creds) {
  const pairs = [
    ["VITE_DEMO_MODE", "false"],
    ["VITE_DATA_BACKEND", "sheets"],
    ["VITE_SHEETS_WEB_APP_URL", creds.webAppUrl],
    ["VITE_SHEETS_API_TOKEN", creds.apiToken],
    ["VITE_BLOQUEAR_INTEGRACIONES", "true"],
    ["VITE_INTEGRACIONES_CLAVE", "spe-desbloquear"],
  ];
  let ok = 0;
  for (const [name, value] of pairs) {
    const { code, out } = run("gh", ["secret", "set", name, "--body", value, "--repo", REPO]);
    if (code === 0) {
      log(`Secret ${name}`, "ok");
      ok++;
    } else {
      log(`Secret ${name} falló: ${out.trim().slice(0, 120)}`, "warn");
    }
  }
  return ok === pairs.length;
}

function dispatchWorkflow(creds) {
  log("Disparando workflow en GitHub (sin guardar Secrets)…");
  const { code, out } = run("gh", [
    "workflow",
    "run",
    WORKFLOW,
    "--repo",
    REPO,
    "--ref",
    "main",
    "-f",
    "backend=sheets",
    "-f",
    `sheets_web_app_url=${creds.webAppUrl}`,
    "-f",
    `sheets_api_token=${creds.apiToken}`,
  ]);
  if (code !== 0) {
    log(`workflow run falló:\n${out}`, "err");
    return false;
  }
  log("Workflow iniciado — ve Actions en GitHub", "ok");
  log(`https://github.com/${REPO}/actions`, "info");
  return true;
}

function main() {
  const doSetup = process.argv.includes("--setup");

  console.log("\n=== SPE — Aplicar todo (Sheets + Pages) ===\n");

  if (doSetup) {
    log("Ejecutando setup:sheets-auto…");
    const setup = run("npm", ["run", "setup:sheets-auto"], { stdio: "inherit" });
    if (setup.code !== 0) {
      log("setup:sheets-auto falló (¿clasp login en navegador?)", "err");
      process.exit(1);
    }
  }

  const creds = parseCredentials(CRED_FILE);
  if (!creds) {
    log(`No encontré ${CRED_FILE}`, "err");
    log("Ejecuta: npm run setup:sheets-auto", "warn");
    log("O crea el archivo con Web App URL y API Token", "warn");
    process.exit(1);
  }

  log(`URL: ${creds.webAppUrl.slice(0, 60)}…`, "ok");
  log(`Token: ${creds.apiToken.slice(0, 8)}…`, "ok");

  const ghCheck = run("gh", ["auth", "status"]);
  if (ghCheck.code !== 0) {
    log("gh no autenticado — ejecuta: gh auth login", "err");
    process.exit(1);
  }

  log("Intentando subir GitHub Secrets…");
  const secretsOk = setSecrets(creds);

  if (secretsOk) {
    log("Secrets aplicados. Disparando deploy…", "ok");
    run("gh", ["workflow", "run", WORKFLOW, "--repo", REPO, "--ref", "main", "-f", "backend=auto"]);
  } else {
    log("Sin permiso para Secrets — usando workflow con inputs (igual funciona)", "warn");
    if (!dispatchWorkflow(creds)) process.exit(1);
  }

  log("\n✓ Aplicado. App en ~3 min:", "ok");
  log(`https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/`, "info");
}

main();
