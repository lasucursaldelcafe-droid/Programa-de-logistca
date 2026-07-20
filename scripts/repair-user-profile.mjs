#!/usr/bin/env node
/**
 * Repara Auth huérfano: crea users/{uid} tras login.
 *
 *   SPE_REPAIR_EMAIL='pabcolgom@gmail.com' SPE_REPAIR_PASSWORD='…' npm run repair:user-profile
 *
 * Sin contraseña: imprime el JSON para pegar en Firebase Console.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { loadFirebaseWebConfig, readJson } from "./lib/firebase-setup.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const TARGET_HINT_UID = process.env.SPE_REPAIR_UID?.trim() || "Zk3cQeygprNE42NkvPzGILmrzsG2";

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

async function listInvitations(projectId) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/invitations?pageSize=50`;
  const res = await fetch(url);
  const body = await res.json();
  return (body.documents || []).map((d) => {
    const f = d.fields || {};
    return {
      id: d.name.split("/").pop(),
      email: f.email?.stringValue,
      role: f.role?.stringValue,
      workerId: f.workerId?.stringValue,
      nombre: f.workerNombre?.stringValue,
      estado: f.estado?.stringValue,
      codigo: f.codigoAcceso?.stringValue,
    };
  });
}

async function signIn(apiKey, email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Auth ${res.status}`);
  return { uid: json.localId, idToken: json.idToken, email: json.email };
}

async function createProfile(projectId, session, profile) {
  // Live rules: self-create trabajador OK; supervisor suele fallar → fallback
  const attempts = [
    profile,
    profile.role !== "trabajador"
      ? { ...profile, role: "trabajador", perfilCompleto: false }
      : null,
  ].filter(Boolean);

  for (const p of attempts) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}` +
      `/databases/(default)/documents/users?documentId=${session.uid}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: p.email },
          nombre: { stringValue: p.nombre },
          role: { stringValue: p.role },
          workerId: p.workerId
            ? { stringValue: p.workerId }
            : { nullValue: null },
          perfilCompleto: { booleanValue: p.perfilCompleto !== false },
          habilitado: { booleanValue: true },
        },
      }),
    });
    const body = await res.json();
    if (res.ok) return { ok: true, role: p.role };
    if (String(body.error?.message || "").includes("already exists")) {
      return { ok: true, role: p.role, existed: true };
    }
    console.warn(`  · create role=${p.role} → ${res.status} ${body.error?.message}`);
  }
  return { ok: false };
}

function printConsoleHelp(uid, profile) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Crear en Firebase Console (bypassa reglas)                ║
╚════════════════════════════════════════════════════════════╝

1. https://console.firebase.google.com/project/programalog-ccc12/firestore/data/~2Fusers
2. Add document
3. Document ID = ${uid}
4. Campos:

${JSON.stringify(
  {
    email: profile.email,
    nombre: profile.nombre,
    role: profile.role,
    workerId: profile.workerId ?? null,
    perfilCompleto: true,
    habilitado: true,
  },
  null,
  2,
)}
`);
}

async function main() {
  const fb = ensureWebConfig();
  if (!fb?.apiKey || !fb?.projectId) {
    console.error("✗ Falta config Firebase");
    process.exit(1);
  }

  const email = (process.env.SPE_REPAIR_EMAIL || process.argv[2] || "").trim().toLowerCase();
  const password = (process.env.SPE_REPAIR_PASSWORD || process.argv[3] || "").trim();

  const invitations = await listInvitations(fb.projectId);
  const pending = invitations.filter((i) => i.estado === "pendiente");
  console.log(`Invitaciones pendientes: ${pending.length}`);
  for (const inv of pending) {
    console.log(`  - ${inv.email} (${inv.role}) worker=${inv.workerId} código=${inv.codigo}`);
  }

  const inv =
    pending.find((i) => i.email === email) ||
    pending.find((i) => i.email === "pabcolgom@gmail.com") ||
    pending[0];

  const profile = {
    email: email || inv?.email || "usuario@example.com",
    nombre: inv?.nombre || email || "Usuario",
    role: inv?.role || "trabajador",
    workerId: inv?.workerId || null,
    perfilCompleto: true,
  };

  if (!email || !password) {
    console.log("\nSin email/contraseña → instrucciones Console para el UID reportado:");
    printConsoleHelp(TARGET_HINT_UID, {
      ...profile,
      email: inv?.email || "pabcolgom@gmail.com",
      nombre: inv?.nombre || "pablo colorado gomez",
      role: inv?.role || "supervisor_sitio",
      workerId: inv?.workerId || "YaG7QDCFXw6WsKST8f07",
    });
    console.log(
      "O con contraseña del usuario:\n  SPE_REPAIR_EMAIL='…' SPE_REPAIR_PASSWORD='…' npm run repair:user-profile\n",
    );
    process.exit(0);
  }

  console.log(`→ Login ${email}…`);
  const session = await signIn(fb.apiKey, email, password);
  console.log(`✓ Auth OK — UID ${session.uid}`);
  if (TARGET_HINT_UID && session.uid !== TARGET_HINT_UID) {
    console.log(`  (UID distinto al reportado ${TARGET_HINT_UID})`);
  }

  const result = await createProfile(fb.projectId, session, profile);
  if (!result.ok) {
    console.error("✗ No se pudo crear users/{uid} con la sesión del usuario.");
    printConsoleHelp(session.uid, profile);
    process.exit(1);
  }
  console.log(
    `✓ users/${session.uid} OK (role=${result.role}${result.existed ? ", ya existía" : ""})`,
  );
  console.log("Vuelve a iniciar sesión en la app.");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
