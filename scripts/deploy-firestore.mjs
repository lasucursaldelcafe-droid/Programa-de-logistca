#!/usr/bin/env node
/**
 * Despliega reglas + índices Firestore (chat, invitaciones, producción).
 *
 * Credenciales (una de estas):
 *   - FIREBASE_TOKEN (firebase login:ci)
 *   - config/credenciales.local.json → firebaseToken
 *   - service-account.json o FIREBASE_SERVICE_ACCOUNT_JSON
 *
 * Uso:
 *   npm run deploy:firestore
 *   npm run firebase:deploy-firestore
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAccessTokenFromRefreshToken } from "./lib/firebase-token.mjs";
import {
  getFirebaseToken,
  getServiceAccountSource,
  loadFirebaseWebConfig,
} from "./lib/firebase-setup.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function getAccessTokenFromServiceAccount(saPath) {
  const saJson = JSON.parse(readFileSync(saPath, "utf-8"));
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: saJson.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");

  const crypto = await import("node:crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(saJson.private_key, "base64url");
  const jwt = `${header}.${claim}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`SA token falló: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data.access_token;
}

async function resolveAccessToken() {
  const refresh = getFirebaseToken();
  if (refresh) return { accessToken: await getAccessTokenFromRefreshToken(refresh), firebaseToken: refresh };

  const sa = getServiceAccountSource();
  if (sa) {
    return { accessToken: await getAccessTokenFromServiceAccount(sa.path), firebaseToken: null };
  }
  return null;
}

async function deployRules(projectId, accessToken) {
  const rulesPath = resolve(ROOT, "firestore.rules");
  if (!existsSync(rulesPath)) throw new Error("Falta firestore.rules");
  const content = readFileSync(rulesPath, "utf-8");

  const base = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;

  const createRes = await fetch(`${base}/rulesets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: { files: [{ name: "firestore.rules", content }] },
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Ruleset create (${createRes.status}): ${JSON.stringify(createData).slice(0, 300)}`);
  }

  const rulesetName = createData.name;
  const releaseRes = await fetch(`${base}/releases`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${base}/releases/cloud.firestore`,
      rulesetName,
    }),
  });
  const releaseData = await releaseRes.json();
  if (!releaseRes.ok) {
    throw new Error(`Release (${releaseRes.status}): ${JSON.stringify(releaseData).slice(0, 300)}`);
  }

  return rulesetName;
}

function deployIndexes(projectId, firebaseToken) {
  if (!firebaseToken) {
    console.log("→ Índices: omitidos (service account — usa Firebase Console o firebase deploy --only firestore:indexes)");
    return true;
  }

  console.log("→ Desplegando índices Firestore (chatMessages, invitations)…");
  const r = spawnSync(
    "npx",
    [
      "firebase-tools@14",
      "deploy",
      "--only",
      "firestore:indexes",
      "--project",
      projectId,
      "--non-interactive",
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, FIREBASE_TOKEN: firebaseToken },
    },
  );
  return r.status === 0;
}

async function main() {
  const fb = loadFirebaseWebConfig();
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    fb?.projectId ||
    "programalog-ccc12";

  console.log(`\n=== Firestore completo (${projectId}) ===\n`);

  const auth = await resolveAccessToken();
  if (!auth) {
    console.error("✗ Falta credencial Firebase para desplegar.\n");
    console.error("En tu PC (PowerShell):");
    console.error("  .\\scripts\\windows\\SPE-Deploy-Firestore.ps1");
    console.error("\nO manualmente:");
    console.error("  firebase login");
    console.error(`  firebase use ${projectId}`);
    console.error("  firebase login:ci   → pega token en config/credenciales.local.json como firebaseToken");
    console.error("  npm run setup:firebase-token   → sube FIREBASE_TOKEN a GitHub Secrets");
    console.error("  npm run deploy:firestore\n");
    process.exit(1);
  }

  console.log("→ Desplegando reglas Firestore…");
  const ruleset = await deployRules(projectId, auth.accessToken);
  console.log(`✓ Reglas: ${ruleset}`);

  const indexesOk = deployIndexes(projectId, auth.firebaseToken);
  if (!indexesOk) {
    console.error("✗ Índices fallaron — revisa firestore.indexes.json");
    process.exit(1);
  }
  if (auth.firebaseToken) console.log("✓ Índices desplegados");

  console.log("\n✓ Firestore listo (reglas + chat).\n");
  console.log("Siguiente (opcional):");
  console.log("  npm run firestore:bootstrap");
  console.log("  SPE_PROD_PASSWORD='…' npm run seed:production");
  console.log("  npm run verify:prod-login\n");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
