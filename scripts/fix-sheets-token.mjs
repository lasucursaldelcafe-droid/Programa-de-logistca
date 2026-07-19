#!/usr/bin/env node
/**
 * Detecta el token válido del Apps Script SPE y actualiza bootstrap + runtime.
 * Uso: npm run fix:sheets-token
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BOOTSTRAP = resolve(ROOT, "config/bootstrap.json");
const RUNTIME = resolve(ROOT, "apps/admin/public/spe-runtime-config.json");

const CANDIDATE_TOKENS = [
  "54fcc140d21cd5101df28b00673cc359f799e9bca53ff72c",
  "cambiar-token-seguro",
];

async function probeToken(baseUrl, token) {
  const url = `${baseUrl.replace(/\/$/, "")}?action=health&token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return false;
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

function main() {
  const bootstrap = JSON.parse(readFileSync(BOOTSTRAP, "utf-8"));
  const webAppUrl = bootstrap.sheetsWebAppUrl?.trim();
  if (!webAppUrl || !webAppUrl.includes("script.google.com")) {
    console.error("✗ config/bootstrap.json sin sheetsWebAppUrl válida");
    process.exit(1);
  }

  console.log("→ Probando tokens contra Apps Script…");
  console.log(`  ${webAppUrl.slice(0, 70)}…`);

  void (async () => {
    for (const token of CANDIDATE_TOKENS) {
      const ok = await probeToken(webAppUrl, token);
      console.log(ok ? `✓ Token OK: ${token.slice(0, 12)}…` : `✗ Token falló: ${token.slice(0, 12)}…`);
      if (ok) {
        bootstrap.sheetsApiToken = token;
        writeFileSync(BOOTSTRAP, `${JSON.stringify(bootstrap, null, 2)}\n`);
        const runtime = {
          backend: bootstrap.backend,
          demoMode: bootstrap.demoMode,
          sheetsWebAppUrl: bootstrap.sheetsWebAppUrl,
          sheetsApiToken: token,
        };
        if (bootstrap.googleMapsApiKey) runtime.googleMapsApiKey = bootstrap.googleMapsApiKey;
        writeFileSync(RUNTIME, `${JSON.stringify(runtime, null, 2)}\n`);
        spawnSync("node", ["scripts/sync-repo-config.mjs"], { cwd: ROOT, stdio: "inherit" });
        console.log("\n✓ bootstrap.json y spe-runtime-config.json actualizados");
        console.log("  Haz commit + push a main para desplegar en Pages.\n");
        process.exit(0);
      }
    }
    console.error("\n✗ Ningún token funcionó. En Apps Script → Propiedades → SPE_API_TOKEN");
    process.exit(1);
  })();
}

main();
