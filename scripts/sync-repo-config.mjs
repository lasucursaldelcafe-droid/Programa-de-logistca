#!/usr/bin/env node
/**
 * Sincroniza TODA la configuración del proyecto desde config/ hacia:
 * - config/bootstrap.json
 * - apps/admin|worker|master/.env.local
 * - apps/admin/public/spe-runtime-config.json
 *
 * Fuentes (en orden):
 * 1. config/proyecto.json — metadatos (siempre en repo)
 * 2. config/cuentas-app.json — cuentas demo documentadas (siempre en repo)
 * 3. config/credenciales.local.json — secretos locales (gitignore, NO se sube)
 * 4. firebase-web-config.json — SDK web Firebase (gitignore)
 * 5. CREDENCIALES-SHEETS-AUTO.txt — generado por setup:sheets-auto (gitignore)
 *
 * Uso: npm run config:sync
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(ROOT, "config");

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    console.warn(`⚠ No se pudo leer ${path}`);
    return null;
  }
}

function isSet(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !value.includes("TU_") &&
    !value.includes("tu-token") &&
    !value.includes("TU_CONTRASEÑA") &&
    !value.includes("PEGAR_")
  );
}

function parseSheetsCredFile() {
  const path = resolve(ROOT, "CREDENCIALES-SHEETS-AUTO.txt");
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf-8");
  const url = text.match(/Web App URL:\s*(https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec)/i)?.[1];
  const token = text.match(/API Token:\s*(\S+)/i)?.[1];
  if (!url || !token) return null;
  return { webAppUrl: url.trim(), apiToken: token.trim() };
}

function mergeFirebase(...sources) {
  const out = {};
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const [k, v] of Object.entries(src)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
  }
  return out;
}

function buildBootstrap() {
  const proyecto = readJson(resolve(CONFIG, "proyecto.json")) ?? {};
  const local = readJson(resolve(CONFIG, "credenciales.local.json")) ?? {};
  const fbFile = readJson(resolve(ROOT, "firebase-web-config.json")) ?? {};
  const sheetsFile = parseSheetsCredFile();

  const sheetsUrl =
    local.sheets?.webAppUrl?.trim() ||
    sheetsFile?.webAppUrl ||
    "";
  const sheetsToken =
    local.sheets?.apiToken?.trim() ||
    sheetsFile?.apiToken ||
    "";

  const firebase = mergeFirebase(local.firebase, fbFile);

  const useSheets = isSet(sheetsUrl) && isSet(sheetsToken);
  const useFirebase =
    isSet(firebase.apiKey) && isSet(firebase.projectId) && isSet(firebase.appId);

  let backend = "demo";
  let demoMode = true;
  if (useSheets) {
    backend = "sheets";
    demoMode = false;
  } else if (useFirebase) {
    backend = "firebase";
    demoMode = false;
  }

  return {
    proyecto: {
      nombre: proyecto.nombre,
      correoProyecto: proyecto.correoProyecto,
    },
    backend,
    demoMode,
    sheetsWebAppUrl: useSheets ? sheetsUrl : "",
    sheetsApiToken: useSheets ? sheetsToken : "",
    firebase: useFirebase ? firebase : {},
  };
}

function envLines(bootstrap) {
  const fb = bootstrap.firebase ?? {};
  const lines = [
    `# Generado por npm run config:sync — editar config/ y volver a ejecutar`,
    `VITE_DEMO_MODE=${bootstrap.demoMode ? "true" : "false"}`,
    `VITE_DATA_BACKEND=${bootstrap.backend}`,
    `VITE_USE_FIREBASE_EMULATORS=false`,
    `VITE_BLOQUEAR_INTEGRACIONES=true`,
    `VITE_INTEGRACIONES_CLAVE=spe-desbloquear`,
  ];

  if (bootstrap.backend === "sheets") {
    lines.push(`VITE_SHEETS_WEB_APP_URL=${bootstrap.sheetsWebAppUrl}`);
    lines.push(`VITE_SHEETS_API_TOKEN=${bootstrap.sheetsApiToken}`);
  }

  if (bootstrap.backend === "firebase" || Object.keys(fb).length > 0) {
    lines.push(`VITE_FIREBASE_API_KEY=${fb.apiKey ?? ""}`);
    lines.push(`VITE_FIREBASE_AUTH_DOMAIN=${fb.authDomain ?? ""}`);
    lines.push(`VITE_FIREBASE_PROJECT_ID=${fb.projectId ?? ""}`);
    lines.push(`VITE_FIREBASE_STORAGE_BUCKET=${fb.storageBucket ?? ""}`);
    lines.push(`VITE_FIREBASE_MESSAGING_SENDER_ID=${fb.messagingSenderId ?? ""}`);
    lines.push(`VITE_FIREBASE_APP_ID=${fb.appId ?? ""}`);
  }

  if (bootstrap.demoMode) {
    lines.push(
      "",
      "# Demo local — emuladores opcionales:",
      "# VITE_USE_FIREBASE_EMULATORS=true",
    );
  }

  return lines.join("\n") + "\n";
}

function runtimeConfig(bootstrap) {
  const base = {
    backend: bootstrap.backend,
    demoMode: bootstrap.demoMode,
  };
  if (bootstrap.backend === "sheets") {
    return {
      ...base,
      sheetsWebAppUrl: bootstrap.sheetsWebAppUrl,
      sheetsApiToken: bootstrap.sheetsApiToken,
    };
  }
  if (bootstrap.backend === "firebase" && Object.keys(bootstrap.firebase).length > 0) {
    return { ...base, firebase: bootstrap.firebase };
  }
  return base;
}

function writeEnv(app, content) {
  const dir = resolve(ROOT, "apps", app);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, ".env.local"), content);
}

function main() {
  const bootstrap = buildBootstrap();
  const bootstrapPath = resolve(CONFIG, "bootstrap.json");
  const runtimePath = resolve(ROOT, "apps/admin/public/spe-runtime-config.json");

  writeFileSync(bootstrapPath, `${JSON.stringify(bootstrap, null, 2)}\n`);
  writeFileSync(runtimePath, `${JSON.stringify(runtimeConfig(bootstrap), null, 2)}\n`);

  const env = envLines(bootstrap);
  writeEnv("admin", env);
  writeEnv("worker", env);
  writeEnv("master", env);

  console.log("✓ config/bootstrap.json");
  console.log("✓ apps/admin/public/spe-runtime-config.json");
  console.log("✓ apps/admin|worker|master/.env.local");
  console.log(`  Backend: ${bootstrap.backend} | demoMode: ${bootstrap.demoMode}`);

  if (bootstrap.demoMode) {
    console.log("\n○ Modo demo — cuentas en config/cuentas-app.json");
    console.log("  admin@eventos.test / Admin123!");
  }

  const localPath = resolve(CONFIG, "credenciales.local.json");
  if (!existsSync(localPath)) {
    console.log("\n→ Para secretos locales: copia config/credenciales.local.ejemplo.json");
    console.log("  a config/credenciales.local.json y ejecuta npm run config:sync de nuevo.");
  }
}

main();
