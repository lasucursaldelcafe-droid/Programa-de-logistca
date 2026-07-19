#!/usr/bin/env node
/**
 * SPE — Automatización máxima (Node). Ejecuta todo lo posible sin login Google.
 * Uso: npm run auto:max
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

function run(cmd, args) {
  console.log(`→ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", encoding: "utf-8" });
  return r.status ?? 1;
}

async function checkPages() {
  try {
    const res = await fetch(PAGES, { method: "GET" });
    console.log(res.ok ? `✓ Pages HTTP ${res.status}` : `! Pages HTTP ${res.status}`);
    return res.ok;
  } catch (e) {
    console.log(`! Pages no responde: ${e.message}`);
    return false;
  }
}

function main() {
  console.log("\n=== SPE MAX AUTO (Node) ===\n");

  run("npm", ["install"]);
  run("node", ["scripts/sync-repo-config.mjs"]);
  run("node", ["scripts/spe-diagnostico.mjs"]);
  run("npm", ["run", "check:nav"]);
  run("npm", ["run", "verify:flows"]);

  const py = spawnSync("python3", ["scripts/spe-max-auto.py"], { cwd: ROOT, stdio: "inherit" });
  if ((py.status ?? 1) !== 0) {
    console.log("! Python no disponible — generando token en Node…");
    const token = randomBytes(24).toString("hex");
    const credPath = resolve(ROOT, "config/credenciales.local.json");
    const ejemplo = resolve(ROOT, "config/credenciales.local.ejemplo.json");
    let base = {};
    if (existsSync(ejemplo)) base = JSON.parse(readFileSync(ejemplo, "utf-8"));
    base.sheets = { webAppUrl: "", apiToken: token };
    base.google = { ...(base.google ?? {}), email: "lasucursaldelcafe@gmail.com" };
    mkdirSync(dirname(credPath), { recursive: true });
    writeFileSync(credPath, JSON.stringify(base, null, 2) + "\n");
    writeFileSync(
      resolve(ROOT, "CREDENCIALES-SPE-GENERADAS.txt"),
      `API Token: ${token}\nWeb App URL: (pendiente setup:sheets-auto)\n`,
    );
    console.log(`✓ Token: ${token.slice(0, 12)}… → CREDENCIALES-SPE-GENERADAS.txt`);
  }

  void checkPages().then(() => {
    console.log("\n→ Para Google Sheets en PC:");
    console.log("  .\\scripts\\windows\\SPE-Setup-Completo.ps1");
    console.log("\n→ Solo celular: edita config/bootstrap.json en GitHub");
    console.log("  Token en config/pendientes-setup.json o CREDENCIALES-SPE-GENERADAS.txt\n");
  });
}

main();
