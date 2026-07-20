#!/usr/bin/env node
/**
 * Utilidades compartidas para setup Firebase (CLI + CI).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { isConfigSet } from "./config-placeholders.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const REPO = process.env.GITHUB_REPOSITORY ?? "lasucursaldelcafe-droid/Programa-de-logistca";
export const ADMIN_EMAIL = "lasucursaldelcafe@gmail.com";

export function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: "utf-8",
    stdio: opts.stdio ?? "inherit",
    env: { ...process.env, ...opts.env },
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

export function ghAvailable() {
  return run("gh", ["auth", "status"], { stdio: "pipe" }) === 0;
}

export function loadFirebaseWebConfig() {
  const fbFile = readJson(resolve(ROOT, "firebase-web-config.json"));
  if (fbFile?.apiKey || fbFile?.projectId) {
    return normalizeFirebaseConfig(fbFile);
  }
  const local = readJson(resolve(ROOT, "config/credenciales.local.json"));
  if (local?.firebase?.apiKey) return normalizeFirebaseConfig(local.firebase);
  return null;
}

export function normalizeFirebaseConfig(raw) {
  return {
    apiKey: raw.apiKey ?? raw.VITE_FIREBASE_API_KEY ?? "",
    authDomain: raw.authDomain ?? raw.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: raw.projectId ?? raw.VITE_FIREBASE_PROJECT_ID ?? "",
    storageBucket: raw.storageBucket ?? raw.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: raw.messagingSenderId ?? raw.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: raw.appId ?? raw.VITE_FIREBASE_APP_ID ?? "",
  };
}

export function firebaseToViteEnv(fb, extras = {}) {
  return {
    VITE_DATA_BACKEND: "firebase",
    VITE_DEMO_MODE: "false",
    VITE_FIREBASE_API_KEY: fb.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: fb.authDomain,
    VITE_FIREBASE_PROJECT_ID: fb.projectId,
    VITE_FIREBASE_STORAGE_BUCKET: fb.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: fb.messagingSenderId,
    VITE_FIREBASE_APP_ID: fb.appId,
    ...extras,
  };
}

export function isFirebaseConfigComplete(fb) {
  if (!fb) return false;
  return (
    isConfigSet(fb.apiKey) &&
    isConfigSet(fb.projectId) &&
    isConfigSet(fb.appId) &&
    isConfigSet(fb.authDomain)
  );
}

export function writeFirebaseWebConfig(fb) {
  const path = resolve(ROOT, "firebase-web-config.json");
  writeFileSync(path, `${JSON.stringify(fb, null, 2)}\n`);
  return path;
}

export function updateFirebaserc(projectId) {
  if (!projectId) return;
  const path = resolve(ROOT, ".firebaserc");
  writeFileSync(path, `${JSON.stringify({ projects: { default: projectId } }, null, 2)}\n`);
}

export function getServiceAccountSource() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonEnv) {
    const tmp = resolve(ROOT, ".tmp-service-account.json");
    writeFileSync(tmp, jsonEnv);
    return { path: tmp, source: "FIREBASE_SERVICE_ACCOUNT_JSON" };
  }
  const local = readJson(resolve(ROOT, "config/credenciales.local.json"));
  const saPath = local?.firebaseServiceAccountPath
    ? resolve(ROOT, local.firebaseServiceAccountPath)
    : resolve(ROOT, "service-account.json");
  if (existsSync(saPath)) return { path: saPath, source: saPath };
  return null;
}

export function getProdPassword() {
  const fromEnv = process.env.SPE_PROD_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  const local = readJson(resolve(ROOT, "config/credenciales.local.json"));
  const pwd = local?.speProdPassword?.trim() ?? local?.produccion?.password?.trim();
  if (pwd && !pwd.includes("PON_AQUI") && !pwd.includes("TU_")) return pwd;
  const acceso = readJson(resolve(ROOT, "config/acceso.local.json"));
  const accPwd = acceso?.produccion?.password?.trim();
  if (accPwd && !accPwd.includes("PON_AQUI")) return accPwd;
  return "";
}

/** Cursor CLI / GitHub Actions — CURSOR_API_KEY */
export function getCursorApiKey() {
  const fromEnv = process.env.CURSOR_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const local = readJson(resolve(ROOT, "config/credenciales.local.json"));
  const key =
    local?.cursorApiKey?.trim() ??
    local?.cursor?.apiKey?.trim();
  if (key && !key.includes("PON_AQUI") && !key.includes("TU_") && key.length > 8) {
    return key;
  }
  return "";
}

export function pushCursorApiKeySecret() {
  const key = getCursorApiKey();
  if (!key) return false;
  if (!ghAvailable()) return false;
  return pushGhSecret("CURSOR_API_KEY", key);
}

export function pushGhSecret(name, value) {
  if (!value) return false;
  return run("gh", ["secret", "set", name, "--body", value, "--repo", REPO], { stdio: "pipe" }) === 0;
}

export function pushFirebaseSecrets(fb, extras = {}) {
  const env = firebaseToViteEnv(fb);
  let ok = 0;
  let fail = 0;
  for (const [name, value] of Object.entries({ ...env, ...extras })) {
    if (pushGhSecret(name, value)) {
      console.log(`  + secret ${name}`);
      ok++;
    } else {
      console.log(`  ! secret ${name} falló`);
      fail++;
    }
  }
  return { ok, fail };
}

export function getFirebaseToken() {
  const fromEnv = process.env.FIREBASE_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const local = readJson(resolve(ROOT, "config/credenciales.local.json"));
  const t = local?.firebaseToken?.trim();
  if (t && t.length > 20) return t;
  return "";
}

export function pushFirebaseTokenSecret() {
  const token = getFirebaseToken();
  if (!token || !ghAvailable()) return false;
  return pushGhSecret("FIREBASE_TOKEN", token);
}

export function deployFirestoreWithServiceAccount(projectId) {
  const firebaseToken = getFirebaseToken();
  if (firebaseToken) {
    return (
      run(
        "npx",
        [
          "firebase-tools",
          "deploy",
          "--only",
          "firestore:rules,firestore:indexes",
          "--project",
          projectId,
          "--non-interactive",
        ],
        { env: { FIREBASE_TOKEN: firebaseToken } },
      ) === 0
    );
  }
  const sa = getServiceAccountSource();
  if (!sa) {
    console.log("  ! Firestore: falta FIREBASE_TOKEN (firebase login:ci) o service-account.json");
    return false;
  }
  return (
    run(
      "npx",
      [
        "firebase-tools",
        "deploy",
        "--only",
        "firestore:rules,firestore:indexes",
        "--project",
        projectId,
      ],
      { env: { GOOGLE_APPLICATION_CREDENTIALS: sa.path } },
    ) === 0
  );
}

export function writeSetupResult(lines) {
  const path = resolve(ROOT, "SETUP-RESULTADO.txt");
  writeFileSync(path, `${lines.join("\n")}\n`);
  console.log(`\n→ Resumen: ${path}`);
}
