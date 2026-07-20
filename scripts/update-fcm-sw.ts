/**
 * Sincroniza apps/admin/public/firebase-messaging-sw.js con credenciales Firebase.
 * Lee firebase-web-config.json, apps/admin/.env.local o variables de entorno.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SW_PATH = resolve(ROOT, "apps/admin/public/firebase-messaging-sw.js");
const CONFIG_CANDIDATES = [
  resolve(ROOT, "config/bootstrap.json"),
  resolve(ROOT, "firebase-web-config.json"),
  resolve(ROOT, "docs/spe-runtime-config.json"),
  resolve(ROOT, "apps/admin/.env.local"),
];

const KEY_MAP: Record<string, string> = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
};

const PLACEHOLDERS = new Set([
  "",
  "demo-api-key",
  "demo-personal-eventos",
  "000000000000",
  "1:000000000000:web:demo",
]);

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const [key, ...rest] = s.split("=");
    out[key!.trim()] = rest.join("=").trim();
  }
  return out;
}

function loadFirebaseConfig(): Record<string, string> | null {
  for (const path of CONFIG_CANDIDATES) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf-8");
    if (path.endsWith(".json")) {
      try {
        const data = JSON.parse(raw) as Record<string, string> & {
          firebase?: Record<string, string>;
        };
        const src = data.firebase ?? data;
        const mapped: Record<string, string> = {};
        for (const [srcKey, dest] of Object.entries(KEY_MAP)) {
          const val = src[srcKey] ?? data[dest];
          if (val) mapped[srcKey] = String(val).trim();
        }
        if (mapped.apiKey && !PLACEHOLDERS.has(mapped.apiKey)) return mapped;
      } catch {
        /* try next */
      }
    } else {
      const env = parseEnv(raw);
      const mapped: Record<string, string> = {};
      for (const [src, dest] of Object.entries(KEY_MAP)) {
        const val = env[dest];
        if (val) mapped[src] = val;
      }
      if (mapped.apiKey && !PLACEHOLDERS.has(mapped.apiKey)) return mapped;
    }
  }

  const fromEnv: Record<string, string> = {};
  for (const [src, dest] of Object.entries(KEY_MAP)) {
    const val = process.env[dest]?.trim();
    if (val) fromEnv[src] = val;
  }
  if (fromEnv.apiKey && !PLACEHOLDERS.has(fromEnv.apiKey)) return fromEnv;
  return null;
}

function buildSw(config: Record<string, string>): string {
  return `/* eslint-disable no-undef */
/* Generado por scripts/update-fcm-sw.ts — no editar a mano */
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Personal Eventos";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/favicon.ico",
  };
  self.registration.showNotification(title, options);
});
`;
}

function main(): void {
  const config = loadFirebaseConfig();
  if (!config) {
    console.log("○ FCM service worker: sin config Firebase real — se mantiene demo");
    return;
  }

  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  const missing = required.filter((k) => !config[k]);
  if (missing.length > 0) {
    console.warn(`⚠ FCM SW: faltan campos ${missing.join(", ")}`);
    return;
  }

  writeFileSync(SW_PATH, buildSw(config), "utf-8");
  console.log(`✓ firebase-messaging-sw.js actualizado (proyecto: ${config.projectId})`);
}

main();
