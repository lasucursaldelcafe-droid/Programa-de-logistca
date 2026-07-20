#!/usr/bin/env node
/**
 * Verifica login Auth + lectura Firestore en producción (sin desplegar nada).
 *
 *   SPE_PROD_PASSWORD='SpeAdmin2026!' node scripts/verify-prod-login.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadFirebaseWebConfig, ADMIN_EMAIL, getProdPassword, readJson } from "./lib/firebase-setup.mjs";
import { signInOrCreateUser } from "./lib/firestore-rest.mjs";

const ROOT = resolve(import.meta.dirname, "..");

function loadConfig() {
  const fb = loadFirebaseWebConfig();
  if (fb?.apiKey && fb?.projectId) return fb;

  const bootstrap = readJson(resolve(ROOT, "config/bootstrap.json"));
  if (bootstrap?.firebase?.apiKey) {
    writeFileSync(
      resolve(ROOT, "firebase-web-config.json"),
      JSON.stringify(bootstrap.firebase, null, 2) + "\n",
    );
    return bootstrap.firebase;
  }
  return null;
}

function fieldString(fields, key) {
  return fields?.[key]?.stringValue ?? null;
}

async function main() {
  const fb = loadConfig();
  const password = getProdPassword() || process.argv[2]?.trim() || "SpeAdmin2026!";
  if (!fb) {
    console.error("✗ No hay firebase-web-config.json ni config/bootstrap.json");
    process.exit(1);
  }
  if (!password) {
    console.error("✗ Indica SPE_PROD_PASSWORD");
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

  if (!res.ok) {
    console.error(`✗ Firestore (${res.status}): ${body.error?.message ?? res.statusText}`);
    console.error("\nSolución:");
    console.error("  1. Firebase Console → Firestore → Reglas → pegar firestore.rules → Publicar");
    console.error("  2. npm run ensure:prod-ceo");
    process.exit(1);
  }

  const role = fieldString(body.fields, "role");
  console.log("✓ Firestore users/{uid} legible");
  console.log(`  role: ${role}`);
  console.log(`  nombre: ${fieldString(body.fields, "nombre")}`);

  if (role !== "ceo" && role !== "master_app" && role !== "super_admin" && role !== "administrador") {
    console.error(
      `\n✗ Rol inesperado en producción (${role}). Ver docs-source/LANZAMIENTO-PRODUCCION.md`,
    );
    process.exit(1);
  }

  // Probe escritura: setupConfig (requiere isAdmin/isMaster en reglas publicadas)
  const probeUrl =
    `https://firestore.googleapis.com/v1/projects/${fb.projectId}` +
    `/databases/(default)/documents/setupConfig/default` +
    `?updateMask.fieldPaths=actualizadoEn&updateMask.fieldPaths=actualizadoPorNombre`;
  const probe = await fetch(probeUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        actualizadoEn: { stringValue: new Date().toISOString() },
        actualizadoPorNombre: { stringValue: "verify-prod-login" },
      },
    }),
  });

  if (!probe.ok) {
    console.error("\n✗ Auth OK pero Firestore rechaza escrituras (reglas desactualizadas).");
    console.error("  Publica firestore.rules en:");
    console.error("  https://console.firebase.google.com/project/programalog-ccc12/firestore/rules");
    console.error("  Guía: docs-source/LANZAMIENTO-PRODUCCION.md");
    process.exit(2);
  }

  console.log("✓ Escritura Firestore OK");
  console.log("\n✓ Producción OK — cuenta raíz operativa.");
  if (role === "super_admin" || role === "administrador") {
    console.log(`  Nota: rol actual ${role} — ejecuta npm run ensure:prod-ceo tras publicar reglas.`);
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
