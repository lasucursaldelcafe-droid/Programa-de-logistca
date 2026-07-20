#!/usr/bin/env node
/**
 * Asegura la cuenta raíz de producción como CEO (sin service account).
 *
 *   SPE_PROD_PASSWORD='…' npm run ensure:prod-ceo
 *
 * Si las reglas Firestore en consola aún son antiguas (sin rol ceo),
 * el PATCH falla con 403: publica firestore.rules y reintenta.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_EMAIL, getProdPassword, loadFirebaseWebConfig, readJson } from "./lib/firebase-setup.mjs";
import { signInOrCreateUser } from "./lib/firestore-rest.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");

function ensureWebConfig() {
  let fb = loadFirebaseWebConfig();
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

async function readRole(fb, session) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${fb.projectId}` +
    `/databases/(default)/documents/users/${session.uid}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.idToken}` },
  });
  const body = await res.json();
  if (!res.ok) return { ok: false, status: res.status, role: null, body };
  return {
    ok: true,
    status: res.status,
    role: body.fields?.role?.stringValue ?? null,
    body,
  };
}

async function patchCeo(fb, session) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${fb.projectId}` +
    `/databases/(default)/documents/users/${session.uid}` +
    `?updateMask.fieldPaths=role&updateMask.fieldPaths=nombre&updateMask.fieldPaths=email` +
    `&updateMask.fieldPaths=perfilCompleto&updateMask.fieldPaths=workerId&updateMask.fieldPaths=habilitado`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        role: { stringValue: "ceo" },
        nombre: { stringValue: "CEO — Dirección general" },
        email: { stringValue: ADMIN_EMAIL },
        perfilCompleto: { booleanValue: true },
        workerId: { nullValue: null },
        habilitado: { booleanValue: true },
      },
    }),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const fb = ensureWebConfig();
  const password = getProdPassword() || process.env.SPE_PROD_PASSWORD?.trim() || "SpeAdmin2026!";
  if (!fb?.apiKey || !fb?.projectId) {
    console.error("✗ Falta firebase-web-config.json o config/bootstrap.json");
    process.exit(1);
  }

  console.log(`Proyecto: ${fb.projectId}`);
  console.log(`Email: ${ADMIN_EMAIL}`);

  const session = await signInOrCreateUser(fb.apiKey, ADMIN_EMAIL, password);
  console.log(`✓ Auth OK — UID: ${session.uid}`);

  const current = await readRole(fb, session);
  if (!current.ok) {
    console.error(`✗ No se pudo leer users/${session.uid} (${current.status})`);
    process.exit(1);
  }
  console.log(`  Rol actual: ${current.role ?? "(sin role)"}`);

  if (current.role === "ceo") {
    const probe = await patchCeo(fb, session);
    if (probe.ok) {
      console.log("✓ Cuenta raíz CEO confirmada (escritura OK — reglas actualizadas)");
      console.log("  Login: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login");
      return;
    }
    console.error("✗ El documento ya es ceo pero Firestore rechaza escrituras (403).");
    console.error("  Las reglas en Firebase Console aún son antiguas (no incluyen rol ceo).");
    console.error("");
    console.error("  RECUPERACIÓN (elige una):");
    console.error("  A) Firebase Console → Firestore → Reglas → pegar firestore.rules del repo → Publicar");
    console.error("     https://console.firebase.google.com/project/programalog-ccc12/firestore/rules");
    console.error("  B) Temporal: edita users/" + session.uid + " → role = super_admin (reglas viejas)");
    console.error("     Luego publica reglas nuevas y vuelve a ejecutar: npm run ensure:prod-ceo");
    console.error("");
    console.error("  Guía: docs-source/LANZAMIENTO-PRODUCCION.md");
    process.exit(2);
  }

  const patched = await patchCeo(fb, session);
  if (!patched.ok) {
    console.error(`✗ No se pudo promover a CEO (${patched.status}):`, patched.body.error?.message ?? patched.body);
    console.error("  Publica firestore.rules en Firebase Console y reintenta.");
    console.error("  docs-source/LANZAMIENTO-PRODUCCION.md");
    process.exit(1);
  }

  console.log("✓ Cuenta raíz en producción: CEO — Dirección general");
  console.log("  Login: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login");
  console.log("  Siguiente: Master → Equipo administrativo → crear el equipo.");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
