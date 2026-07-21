#!/usr/bin/env node
/**
 * Escribe apps/admin/public/spe-runtime-config.json con Firebase desde env (CI).
 * Las apps embebidas (Windows/Android/Linux) lo leen vía fetch a GitHub Pages.
 *
 *   VITE_FIREBASE_*=… node scripts/write-runtime-config.mjs
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME_PATH = resolve(ROOT, "apps/admin/public/spe-runtime-config.json");
const DEFAULT_CANONICAL =
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

function readJson(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function main() {
  const existing = readJson(RUNTIME_PATH);
  const bootstrap = readJson(resolve(ROOT, "config/bootstrap.json"));
  const fbWeb = readJson(resolve(ROOT, "firebase-web-config.json"));
  const docsRuntime = readJson(resolve(ROOT, "docs/spe-runtime-config.json"));

  const firebase = {
    apiKey:
      process.env.VITE_FIREBASE_API_KEY?.trim() ||
      bootstrap.firebase?.apiKey ||
      fbWeb?.apiKey ||
      docsRuntime?.firebase?.apiKey ||
      "",
    authDomain:
      process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ||
      bootstrap.firebase?.authDomain ||
      fbWeb?.authDomain ||
      docsRuntime?.firebase?.authDomain ||
      "",
    projectId:
      process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
      bootstrap.firebase?.projectId ||
      fbWeb?.projectId ||
      docsRuntime?.firebase?.projectId ||
      "",
    storageBucket:
      process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ||
      bootstrap.firebase?.storageBucket ||
      fbWeb?.storageBucket ||
      docsRuntime?.firebase?.storageBucket ||
      "",
    messagingSenderId:
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
      bootstrap.firebase?.messagingSenderId ||
      fbWeb?.messagingSenderId ||
      docsRuntime?.firebase?.messagingSenderId ||
      "",
    appId:
      process.env.VITE_FIREBASE_APP_ID?.trim() ||
      bootstrap.firebase?.appId ||
      fbWeb?.appId ||
      docsRuntime?.firebase?.appId ||
      "",
  };

  const vapidKey =
    process.env.VITE_FIREBASE_VAPID_KEY?.trim() ||
    bootstrap.vapidKey?.trim() ||
    docsRuntime?.vapidKey?.trim() ||
    "";

  const hasFirebase =
    !!firebase.apiKey && !!firebase.projectId && !!firebase.appId && firebase.apiKey !== "demo-api-key";

  const googleMapsApiKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    existing.googleMapsApiKey ||
    bootstrap.googleMapsApiKey ||
    "";

  const uiVersion =
    process.env.SPE_UI_VERSION?.trim() ||
    process.env.GITHUB_SHA?.trim()?.slice(0, 12) ||
    process.env.VITE_SPE_UI_VERSION?.trim() ||
    `local-${new Date().toISOString().slice(0, 10)}`;

  const config = {
    backend: "firebase",
    demoMode: false,
    preferLiveUi: process.env.SPE_PREFER_LIVE_UI !== "0",
    uiVersion,
    canonicalAppUrl: process.env.VITE_SPE_CANONICAL_URL?.trim() || DEFAULT_CANONICAL,
    setupCompletado: {
      firebaseSecrets: hasFirebase,
      googleMaps: !!googleMapsApiKey,
      cuentasPlataforma: existing.setupCompletado?.cuentasPlataforma ?? true,
      fcm: !!vapidKey,
    },
    ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
    ...(hasFirebase ? { firebase } : {}),
    ...(vapidKey ? { vapidKey } : {}),
  };

  mkdirSync(dirname(RUNTIME_PATH), { recursive: true });
  writeFileSync(RUNTIME_PATH, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`✓ ${RUNTIME_PATH}`);
  console.log(`  Firebase: ${hasFirebase ? firebase.projectId : "pendiente"}`);
  console.log(`  FCM VAPID: ${vapidKey ? "configurado" : "pendiente"}`);
  console.log(`  UI version: ${uiVersion}`);
  console.log(`  Live UI: ${config.preferLiveUi ? "sí" : "no"}`);
  console.log(`  Canonical: ${config.canonicalAppUrl}`);
}

main();
