#!/usr/bin/env node
/**
 * Verifica login Auth + lectura Firestore en producción (sin desplegar nada).
 *
 *   SPE_PROD_PASSWORD='SpeAdmin2026!' node scripts/verify-prod-login.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadFirebaseWebConfig, ADMIN_EMAIL, getProdPassword } from "./lib/firebase-setup.mjs";
import { signInOrCreateUser } from "./lib/firestore-rest.mjs";

const ROOT = resolve(import.meta.dirname, "..");

function loadConfig() {
  const fb = loadFirebaseWebConfig();
  if (fb?.apiKey && fb?.projectId) return fb;

  const bundle = resolve(ROOT, "docs/assets/index-DiLZZIek.js");
  if (!existsSync(bundle)) return null;
  const src = readFileSync(bundle, "utf-8");
  const apiKey = src.match(/apiKey:"(AIza[^"]+)"/)?.[1];
  const projectId = src.match(/projectId:"(programalog[^"]+)"/)?.[1];
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId };
}

async function main() {
  const fb = loadConfig();
  const password = getProdPassword() || process.argv[2]?.trim();
  if (!fb) {
    console.error("✗ No hay firebase-web-config.json ni bundle de producción");
    process.exit(1);
  }
  if (!password) {
    console.error("✗ Indica SPE_PROD_PASSWORD o pasa la contraseña como argumento");
    process.exit(1);
  }

  console.log(`Proyecto: ${fb.projectId}`);
  console.log(`Email: ${ADMIN_EMAIL}`);

  const session = await signInOrCreateUser(fb.apiKey, ADMIN_EMAIL, password);
  console.log(`✓ Auth OK — UID: ${session.uid}`);

  const url =
    `https://firestore.googleapis.com/v1/projects/${fb.projectId}` +
    `/databases/(default)/documents/users/${session.uid}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.idToken}` },
  });
  const body = await res.json();

  if (res.ok) {
    console.log("✓ Firestore users/{uid} legible");
    console.log(JSON.stringify(body.fields ?? body, null, 2));
    return;
  }

  console.error(`✗ Firestore (${res.status}): ${body.error?.message ?? res.statusText}`);
  console.error("\nSolución:");
  console.error("  1. Firebase Console → Firestore → Reglas → pegar firestore.rules → Publicar");
  console.error("  2. GitHub Actions → Bootstrap Firestore (SPE) con FIREBASE_TOKEN");
  process.exit(1);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
