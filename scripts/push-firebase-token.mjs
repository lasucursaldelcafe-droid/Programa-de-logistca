#!/usr/bin/env node
/**
 * Sube FIREBASE_TOKEN (firebase login:ci) a GitHub Secrets.
 * NO requiere JSON de cuenta de servicio — evita políticas org que bloquean claves SA.
 *
 * Uso:
 *   firebase login:ci
 *   npm run setup:firebase-token
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ghAvailable, pushGhSecret, REPO } from "./lib/firebase-setup.mjs";

const ROOT = resolve(import.meta.dirname, "..");

function getFirebaseToken() {
  const fromEnv = process.env.FIREBASE_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const path = resolve(ROOT, "config/credenciales.local.json");
  if (!existsSync(path)) return "";
  try {
    const local = JSON.parse(readFileSync(path, "utf-8"));
    return local?.firebaseToken?.trim() ?? "";
  } catch {
    return "";
  }
}

const token = getFirebaseToken();
if (!token) {
  console.error("\n! Falta FIREBASE_TOKEN");
  console.error("  1. Ejecuta: firebase login:ci  (o npx firebase-tools login:ci)");
  console.error("  2. Copia el token a config/credenciales.local.json → \"firebaseToken\": \"…\"");
  console.error("  3. Vuelve a ejecutar: npm run setup:firebase-token\n");
  process.exit(1);
}

if (!ghAvailable()) {
  console.error("\n! gh no autenticado — ejecuta: gh auth login\n");
  process.exit(1);
}

console.log(`\n→ Subiendo FIREBASE_TOKEN a ${REPO}…\n`);
if (pushGhSecret("FIREBASE_TOKEN", token)) {
  console.log("✓ Secret FIREBASE_TOKEN configurada.");
  console.log("  Actions → Bootstrap Firestore (SPE) → Run workflow\n");
  process.exit(0);
}

console.error("✗ No se pudo subir (permisos admin en el repo).\n");
process.exit(1);
