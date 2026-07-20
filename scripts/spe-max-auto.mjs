#!/usr/bin/env node
/**
 * SPE — Automatización máxima (Firebase producción).
 * Uso: npm run auto:max
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  console.log(`→ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", encoding: "utf-8" });
  return r.status ?? 1;
}

async function checkPages() {
  const PAGES = "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";
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
  console.log("\n=== SPE MAX AUTO (Firebase) ===\n");

  run("node", ["scripts/spe-setup-cli.mjs", "--skip-install"]);

  const hasFirebase = run("node", ["-e", `
    const fs=require('fs');
    process.exit(fs.existsSync('firebase-web-config.json') ? 0 : 1);
  `]);

  if (hasFirebase === 0) {
    console.log("\n→ Para setup completo (secrets + seed + Firestore):");
    console.log("  npm run setup:cli -- --full");
    console.log("\n→ Windows:");
    console.log("  .\\scripts\\windows\\SPE-Setup-Completo.ps1");
  } else {
    console.log("\n→ Coloca firebase-web-config.json (SDK web) y vuelve a ejecutar:");
    console.log("  npm run setup:cli -- --full");
  }

  void checkPages();
}

main();
