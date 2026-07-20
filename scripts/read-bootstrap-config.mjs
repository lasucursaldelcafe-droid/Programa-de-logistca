#!/usr/bin/env node
/**
 * Lee config/bootstrap.json y exporta variables para GitHub Actions / build.
 * Uso: eval $(node scripts/read-bootstrap-config.mjs --export)
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isConfigSet, isUsableSheetsApiToken } from "./lib/config-placeholders.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BOOTSTRAP = resolve(ROOT, "config/bootstrap.json");

function readBootstrap() {
  if (!existsSync(BOOTSTRAP)) return null;
  try {
    return JSON.parse(readFileSync(BOOTSTRAP, "utf-8"));
  } catch {
    return null;
  }
}

function isSet(value) {
  return isConfigSet(value);
}

function main() {
  const cfg = readBootstrap();
  const exportMode = process.argv.includes("--export");
  const jsonMode = process.argv.includes("--json");

  const backend = cfg?.backend?.trim() ?? "";
  const sheetsUrl = cfg?.sheetsWebAppUrl?.trim() ?? "";
  const sheetsToken = cfg?.sheetsApiToken?.trim() ?? "";
  const fb = cfg?.firebase ?? {};

  const useSheets =
    (backend === "sheets" || (isSet(sheetsUrl) && isUsableSheetsApiToken(sheetsToken))) &&
    isSet(sheetsUrl) &&
    isUsableSheetsApiToken(sheetsToken);
  const useFirebase = backend === "firebase" || (isSet(fb.apiKey) && isSet(fb.projectId) && isSet(fb.appId));
  const demoMode = false;
  const resolvedBackend = "firebase";

  const out = {
    VITE_DEMO_MODE: demoMode ? "true" : "false",
    VITE_DATA_BACKEND: resolvedBackend,
    VITE_SHEETS_WEB_APP_URL: useSheets ? sheetsUrl : "",
    VITE_SHEETS_API_TOKEN: useSheets ? sheetsToken : "",
    VITE_GOOGLE_MAPS_API_KEY: isSet(cfg?.googleMapsApiKey) ? cfg.googleMapsApiKey.trim() : "",
    VITE_FIREBASE_API_KEY: useFirebase ? (fb.apiKey ?? "") : "",
    VITE_FIREBASE_AUTH_DOMAIN: useFirebase ? (fb.authDomain ?? "") : "",
    VITE_FIREBASE_PROJECT_ID: useFirebase ? (fb.projectId ?? "") : "",
    VITE_FIREBASE_STORAGE_BUCKET: useFirebase ? (fb.storageBucket ?? "") : "",
    VITE_FIREBASE_MESSAGING_SENDER_ID: useFirebase ? (fb.messagingSenderId ?? "") : "",
    VITE_FIREBASE_APP_ID: useFirebase ? (fb.appId ?? "") : "",
    VITE_FIREBASE_VAPID_KEY: isSet(cfg?.vapidKey) ? cfg.vapidKey.trim() : "",
    VITE_USE_FIREBASE_EMULATORS: "false",
    VITE_BLOQUEAR_INTEGRACIONES: "true",
    VITE_INTEGRACIONES_CLAVE: "spe-desbloquear",
  };

  if (jsonMode) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (exportMode) {
    for (const [k, v] of Object.entries(out)) {
      if (v) console.log(`export ${k}=${JSON.stringify(v)}`);
    }
    return;
  }

  console.log(JSON.stringify({ demoMode, useSheets, useFirebase, backend: out.VITE_DATA_BACKEND }));
}

main();
