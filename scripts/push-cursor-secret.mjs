#!/usr/bin/env node
/**
 * Sube CURSOR_API_KEY a GitHub Secrets (workflow Cursor Agent SPE).
 *
 * Origen de la key (en orden):
 *   1. env CURSOR_API_KEY
 *   2. config/credenciales.local.json → cursorApiKey
 *
 * Uso:
 *   npm run setup:cursor-key
 *   CURSOR_API_KEY='...' npm run setup:cursor-key
 */
import { getCursorApiKey, ghAvailable, pushCursorApiKeySecret, REPO } from "./lib/firebase-setup.mjs";

const key = getCursorApiKey();
if (!key) {
  console.error("\n! Falta CURSOR_API_KEY");
  console.error("  Opción A: CURSOR_API_KEY='...' npm run setup:cursor-key");
  console.error("  Opción B: config/credenciales.local.json → \"cursorApiKey\": \"...\"");
  console.error("  Genera la key: https://cursor.com/settings → API Keys\n");
  process.exit(1);
}

if (!ghAvailable()) {
  console.error("\n! gh no autenticado — ejecuta: gh auth login\n");
  process.exit(1);
}

console.log(`\n→ Subiendo CURSOR_API_KEY a ${REPO}...\n`);
if (pushCursorApiKeySecret()) {
  console.log("✓ Secret CURSOR_API_KEY configurada.");
  console.log("  Actions → Cursor Agent (SPE) → Run workflow\n");
  process.exit(0);
}

console.error("✗ No se pudo subir CURSOR_API_KEY (permisos admin en el repo).\n");
process.exit(1);
