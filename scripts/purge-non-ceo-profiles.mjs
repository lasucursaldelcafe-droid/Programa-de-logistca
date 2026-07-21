#!/usr/bin/env node
/**
 * Elimina todos los perfiles Auth + Firestore excepto el CEO raíz.
 *
 * Preferido (dueño del proyecto ya logueado en Firebase CLI):
 *   node scripts/purge-non-ceo-profiles.mjs
 *
 * Alternativa con contraseña CEO:
 *   SPE_PROD_PASSWORD='…' node scripts/purge-non-ceo-profiles.mjs --password
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_EMAIL, loadFirebaseWebConfig } from "./lib/firebase-setup.mjs";
import { signInOrCreateUser } from "./lib/firestore-rest.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const CEO_EMAIL = ADMIN_EMAIL.toLowerCase();
const PROJECT_ID = "programalog-ccc12";
const REGION = "us-central1";
const FN_NAME = "deletePlatformAccountFn";
const ROOT_ROLES = new Set(["ceo", "master_app", "super_admin"]);

async function getGoogleAccessToken() {
  const toolsPath = resolve(homedir(), ".config/configstore/firebase-tools.json");
  const tools = JSON.parse(readFileSync(toolsPath, "utf8"));
  const access = tools.tokens?.access_token;
  if (!access) throw new Error("No hay access_token de Firebase CLI. Ejecuta: npx firebase login");
  return access;
}

async function listFirestoreUsers(accessToken) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/users?pageSize=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message ?? `Firestore list ${res.status}`);
  return (body.documents ?? []).map((doc) => {
    const uid = String(doc.name).split("/").pop();
    return {
      uid,
      email: doc.fields?.email?.stringValue ?? "",
      role: doc.fields?.role?.stringValue ?? "",
      nombre: doc.fields?.nombre?.stringValue ?? "",
    };
  });
}

async function deleteAuthUser(accessToken, uid) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ localId: uid }),
    },
  );
  if (res.ok) return;
  const body = await res.json().catch(() => ({}));
  const msg = body.error?.message ?? `HTTP ${res.status}`;
  if (msg === "USER_NOT_FOUND") return;
  throw new Error(msg);
}

async function deleteFirestoreUser(accessToken, uid) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/users/${uid}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.ok || res.status === 404) {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
        `/databases/(default)/documents/fcmTokens/${uid}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
    ).catch(() => undefined);
    return;
  }
  const body = await res.json().catch(() => ({}));
  throw new Error(body.error?.message ?? `HTTP ${res.status}`);
}

async function callDeleteFn(idToken, targetUid) {
  const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FN_NAME}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data: { uid: targetUid } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || JSON.stringify(body.error || body) || `HTTP ${res.status}`);
  }
}

function loadCeoPassword() {
  if (process.env.SPE_PROD_PASSWORD?.trim()) return process.env.SPE_PROD_PASSWORD.trim();
  try {
    const cuentas = JSON.parse(readFileSync(resolve(ROOT, "config/cuentas-app.json"), "utf8"));
    const ceo = (cuentas.produccion?.cuentas ?? []).find(
      (c) => String(c.email ?? "").toLowerCase() === CEO_EMAIL,
    );
    if (ceo?.password) return String(ceo.password);
  } catch {
    /* ignore */
  }
  return null;
}

async function main() {
  const usePassword = process.argv.includes("--password");
  console.log(`Proyecto: ${PROJECT_ID}`);
  console.log(`Conservar: ${CEO_EMAIL}`);

  let users;
  /** @type {(uid: string) => Promise<void>} */
  let deleteOne;

  if (usePassword) {
    const fb = loadFirebaseWebConfig();
    const password = loadCeoPassword();
    if (!fb?.apiKey || !password) {
      throw new Error("Falta firebase-web-config o SPE_PROD_PASSWORD / cuentas-app.json");
    }
    const session = await signInOrCreateUser(fb.apiKey, CEO_EMAIL, password);
    console.log(`✓ Sesión CEO — ${session.uid}`);
    const access = await getGoogleAccessToken().catch(() => null);
    users = access
      ? await listFirestoreUsers(access)
      : []; // CF path still needs targets; require access for list
    if (!access) throw new Error("Necesitas Firebase CLI login para listar usuarios.");
    users = await listFirestoreUsers(access);
    deleteOne = async (uid) => {
      await callDeleteFn(session.idToken, uid);
    };
  } else {
    const access = await getGoogleAccessToken();
    users = await listFirestoreUsers(access);
    deleteOne = async (uid) => {
      await deleteAuthUser(access, uid);
      await deleteFirestoreUser(access, uid);
    };
  }

  console.log(`  Perfiles actuales: ${users.length}`);
  for (const u of users) {
    console.log(`   - ${u.email} (${u.role}) ${u.nombre}`);
  }

  const targets = users.filter((u) => {
    if (u.email.toLowerCase() === CEO_EMAIL) return false;
    if (ROOT_ROLES.has(String(u.role).toLowerCase())) return false;
    return true;
  });

  if (targets.length === 0) {
    console.log("✓ Solo queda el CEO. Nada que borrar.");
    return;
  }

  console.log(`→ Eliminando ${targets.length}…`);
  let ok = 0;
  let fail = 0;
  for (const t of targets) {
    process.stdout.write(`  - ${t.email}… `);
    try {
      await deleteOne(t.uid);
      console.log("OK");
      ok += 1;
    } catch (err) {
      console.log(`FAIL: ${err instanceof Error ? err.message : err}`);
      fail += 1;
    }
  }
  console.log(`\nListo: ${ok} eliminados, ${fail} fallos. Conservado: ${CEO_EMAIL}`);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
