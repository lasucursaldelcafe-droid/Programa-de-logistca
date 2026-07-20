#!/usr/bin/env node
/**
 * Tras publicar firestore.rules: crea QR del evento existente, cuentas de equipo
 * y envía correo de acceso (reset Firebase) sin Cloud Functions.
 *
 *   SPE_PROD_PASSWORD='SpeAdmin2026!' npm run desbloquear:operacion
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_EMAIL, getProdPassword, loadFirebaseWebConfig, readJson } from "./lib/firebase-setup.mjs";
import { signInOrCreateUser } from "./lib/firestore-rest.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const APP_URL = "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca";

function genPassword() {
  return `Spe${randomUUID().replace(/-/g, "").slice(0, 10)}!`;
}

const TEAM_TEMPLATE = [
  {
    email: "admin.operaciones@lasucursaldelcafe.test",
    nombre: "Administrador de operaciones",
    role: "administrador",
  },
  {
    email: "rh.eventos@lasucursaldelcafe.test",
    nombre: "Recursos Humanos",
    role: "recursos_humanos",
  },
  {
    email: "contador.eventos@lasucursaldelcafe.test",
    nombre: "Contabilidad",
    role: "contador",
  },
];

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

function toFields(obj) {
  /** @type {Record<string, object>} */
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number") {
      fields[k] = Number.isInteger(v)
        ? { integerValue: String(v) }
        : { doubleValue: v };
    } else if (Array.isArray(v)) {
      fields[k] = {
        arrayValue: {
          values: v.map((item) =>
            typeof item === "string" ? { stringValue: item } : toFields({ x: item }).x,
          ),
        },
      };
    } else {
      throw new Error(`Tipo no soportado en ${k}`);
    }
  }
  return fields;
}

async function fsFetch(projectId, path, token, { method = "GET", body, mask } = {}) {
  let url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents${path}`;
  if (mask?.length) {
    url += "?" + mask.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function probeWrite(fb, session) {
  const probe = await fsFetch(
    fb.projectId,
    "/setupConfig/default",
    session.idToken,
    {
      method: "PATCH",
      mask: ["actualizadoEn", "actualizadoPorNombre"],
      body: {
        fields: toFields({
          actualizadoEn: new Date().toISOString(),
          actualizadoPorNombre: "desbloquear-operacion",
        }),
      },
    },
  );
  return probe;
}

async function listCollection(fb, session, col) {
  const res = await fsFetch(fb.projectId, `/${col}?pageSize=20`, session.idToken);
  return res.json.documents ?? [];
}

function field(doc, key) {
  const f = doc.fields?.[key];
  if (!f) return null;
  return f.stringValue ?? f.integerValue ?? f.doubleValue ?? f.booleanValue ?? null;
}

async function ensureQr(fb, session) {
  const existing = await listCollection(fb, session, "qrCodes");
  const activos = existing.filter((d) => d.fields?.activo?.booleanValue !== false);
  if (activos.length > 0) {
    const id = activos[0].name.split("/").pop();
    return { id, created: false, token: field(activos[0], "token") };
  }

  const events = await listCollection(fb, session, "events");
  const sites = await listCollection(fb, session, "sites");
  if (!events.length || !sites.length) {
    throw new Error("No hay evento/sitio en Firestore. Crea uno en /configuracion y reintenta.");
  }
  const event = events[0];
  const site = sites.find((s) => field(s, "eventId") === event.name.split("/").pop()) ?? sites[0];
  const eventId = event.name.split("/").pop();
  const siteId = site.name.split("/").pop();
  const now = Date.now();
  const qrId = `qr-${siteId}-${now.toString(36)}`;
  const token = randomUUID().replace(/-/g, "").slice(0, 16);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  const doc = {
    eventId,
    eventNombre: String(field(event, "nombre") ?? "Evento"),
    siteId,
    siteNombre: String(field(site, "nombre") ?? "Sitio"),
    token,
    modo: "unico",
    ventanaInicio: dayStart.toISOString(),
    ventanaFin: dayEnd.toISOString(),
    radioGeocerca: Number(field(site, "radioGeocerca") ?? 80),
    descripcionDatos: "QR operativo — desbloqueo automático",
    activo: true,
    creadoEn: new Date().toISOString(),
    creadoPor: session.uid,
  };

  const res = await fsFetch(fb.projectId, `/qrCodes?documentId=${qrId}`, session.idToken, {
    method: "POST",
    body: { fields: toFields(doc) },
  });
  if (!res.ok) {
    throw new Error(`QR create ${res.status}: ${res.json.error?.message ?? res.status}`);
  }
  return { id: qrId, created: true, token, eventId, siteId, siteNombre: doc.siteNombre };
}

async function signUpAuth(apiKey, email, password, displayName) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    },
  );
  const json = await res.json();
  if (res.ok && json.localId) return { uid: json.localId, created: true };
  if (json.error?.message === "EMAIL_EXISTS") {
    // Sign in to get uid is not possible without their password; leave uid unknown.
    return { uid: null, created: false, exists: true };
  }
  throw new Error(`Auth ${email}: ${json.error?.message ?? res.status}`);
}

async function upsertUserDoc(fb, ceoSession, uid, account) {
  const res = await fsFetch(fb.projectId, `/users?documentId=${uid}`, ceoSession.idToken, {
    method: "POST",
    body: {
      fields: toFields({
        email: account.email,
        nombre: account.nombre,
        role: account.role,
        workerId: null,
        perfilCompleto: true,
        habilitado: true,
        creadoPor: ceoSession.uid,
        creadoPorNombre: "CEO — Dirección general",
      }),
    },
  });
  if (res.ok) return { ok: true, status: res.status };
  // Document may already exist — try PATCH
  if (res.status === 409 || String(res.json.error?.message ?? "").includes("already exists")) {
    const patch = await fsFetch(fb.projectId, `/users/${uid}`, ceoSession.idToken, {
      method: "PATCH",
      mask: ["email", "nombre", "role", "habilitado", "perfilCompleto"],
      body: {
        fields: toFields({
          email: account.email,
          nombre: account.nombre,
          role: account.role,
          habilitado: true,
          perfilCompleto: true,
        }),
      },
    });
    return { ok: patch.ok, status: patch.status, error: patch.json.error?.message };
  }
  return { ok: false, status: res.status, error: res.json.error?.message };
}

async function sendPasswordReset(apiKey, email) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  );
  const json = await res.json();
  return { ok: res.ok, error: json.error?.message };
}

async function createTeam(fb, session) {
  const results = [];
  for (const base of TEAM_TEMPLATE) {
    const account = { ...base, password: genPassword() };
    const auth = await signUpAuth(fb.apiKey, account.email, account.password, account.nombre);
    if (auth.exists) {
      results.push({
        ...account,
        uid: null,
        note: "Auth ya existía — usa la contraseña anterior o «Olvidé mi contraseña»",
        emailSent: false,
      });
      continue;
    }
    if (!auth.uid) {
      results.push({ ...account, error: "Sin UID Auth", emailSent: false });
      continue;
    }
    const doc = await upsertUserDoc(fb, session, auth.uid, account);
    const canMail = !account.email.endsWith(".test");
    const mail = canMail
      ? await sendPasswordReset(fb.apiKey, account.email)
      : { ok: false, error: "correo .test — usa la contraseña impresa" };
    results.push({
      ...account,
      uid: auth.uid,
      firestoreOk: doc.ok,
      firestoreError: doc.error,
      emailSent: mail.ok,
      emailError: mail.error,
    });
  }
  return results;
}

async function resendPendingInvitationMail(fb, session) {
  const invitations = await listCollection(fb, session, "invitations");
  const pending = invitations.filter((d) => field(d, "estado") === "pendiente");
  const out = [];
  for (const inv of pending) {
    const email = String(field(inv, "email") ?? "");
    const codigo = String(field(inv, "codigoAcceso") ?? "");
    const token = String(field(inv, "token") ?? inv.name.split("/").pop());
    if (!email) continue;
    // Correo real vía reset solo si ya hay Auth; si no, devolvemos enlace de activación.
    const mail = await sendPasswordReset(fb.apiKey, email);
    out.push({
      email,
      codigo,
      activarUrl: `${APP_URL}/activar?token=${token}`,
      passwordResetSent: mail.ok,
      passwordResetError: mail.error,
      note: mail.ok
        ? "Firebase envió correo de restablecer contraseña (cuenta Auth ya existía)."
        : "Sin cuenta Auth aún: comparte el enlace de activación y el código (Functions de invitación no desplegadas).",
    });
  }
  return out;
}

function printBlockedHelp() {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  BLOQUEO: Firestore rechaza escrituras (reglas no publicadas)   ║
╚══════════════════════════════════════════════════════════════════╝

Haz UNA de estas dos cosas (2 minutos) y vuelve a ejecutar este script:

A) Firebase Console (más rápido)
   1. Abre:
      https://console.firebase.google.com/project/programalog-ccc12/firestore/rules
   2. Pega el contenido del archivo firestore.rules del repo
   3. Pulsa Publicar
   4. npm run desbloquear:operacion

B) Autorizar al agente (para desplegar yo)
   1. Abre:
      https://auth.firebase.tools/login?code_challenge=X9DSmvbOOBYQEI-c6vwrnV_vWupDZUbYh9STPVjxxxs&session=df2c00cb-d801-43dd-b5b6-d417af0c64ca&attest=JklTygr5bnXw9jqqCmw4h_CifE94JTcr70QN5eIQ_84&studio_prototyper=true
   2. Inicia sesión con lasucursaldelcafe@gmail.com
   3. Pega el código de autorización en el chat del agente

También: GitHub → Settings → Secrets → Actions → FIREBASE_TOKEN
(del comando: npx firebase login:ci)
`);
}

async function main() {
  const fb = ensureWebConfig();
  const password =
    getProdPassword() || process.env.SPE_PROD_PASSWORD?.trim() || "SpeAdmin2026!";
  if (!fb?.apiKey || !fb?.projectId) {
    console.error("✗ Falta config Firebase (bootstrap.json / firebase-web-config.json)");
    process.exit(1);
  }

  console.log(`Proyecto: ${fb.projectId}`);
  console.log(`CEO: ${ADMIN_EMAIL}`);
  const session = await signInOrCreateUser(fb.apiKey, ADMIN_EMAIL, password);
  console.log(`✓ Auth OK — ${session.uid}`);

  const probe = await probeWrite(fb, session);
  if (!probe.ok) {
    console.error(`✗ Escritura Firestore denegada (${probe.status})`);
    printBlockedHelp();
    process.exit(2);
  }
  console.log("✓ Escritura Firestore OK (reglas publicadas)");

  const qr = await ensureQr(fb, session);
  console.log(
    qr.created
      ? `✓ QR creado: ${qr.id} (sitio ${qr.siteNombre}) token=${qr.token}`
      : `✓ QR ya existía: ${qr.id} token=${qr.token}`,
  );

  const team = await createTeam(fb, session);
  console.log("\n=== Cuentas de equipo ===");
  for (const row of team) {
    console.log(
      `- ${row.role}: ${row.email} / ${row.password}` +
        (row.firestoreOk === false ? ` [Firestore: ${row.firestoreError}]` : "") +
        (row.emailSent ? " [correo reset OK]" : row.emailError ? ` [correo: ${row.emailError}]` : "") +
        (row.note ? ` (${row.note})` : ""),
    );
  }

  const invMails = await resendPendingInvitationMail(fb, session);
  if (invMails.length) {
    console.log("\n=== Invitaciones pendientes ===");
    for (const inv of invMails) {
      console.log(`- ${inv.email}`);
      console.log(`  código: ${inv.codigo}`);
      console.log(`  activar: ${inv.activarUrl}`);
      console.log(`  ${inv.note}`);
    }
  }

  console.log(`\nApp: ${APP_URL}/login`);
  console.log(`QR/sitios: ${APP_URL}/qr-sitios`);
  console.log("CEO: " + ADMIN_EMAIL + " / (SPE_PROD_PASSWORD)");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
