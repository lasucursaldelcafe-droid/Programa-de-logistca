#!/usr/bin/env node
/**
 * Despliega firestore.rules vía Firebase Rules REST API (sin firebase-tools).
 * Requiere FIREBASE_TOKEN (firebase login:ci) o GOOGLE_APPLICATION_CREDENTIALS.
 */
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

async function getAccessToken() {
  const refresh = getFirebaseToken();
  if (refresh) return getAccessTokenFromRefreshToken(refresh);

  const sa = getServiceAccountSource();
  if (!sa) return null;

  const saJson = JSON.parse(readFileSync(sa.path, "utf-8"));
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
  if (!data.access_token) throw new Error(`SA token falló: ${JSON.stringify(data).slice(0, 200)}`);
  return data.access_token;
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

async function main() {
  const fb = loadFirebaseWebConfig();
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    fb?.projectId ||
    "programalog-ccc12";

  console.log(`→ Desplegando reglas Firestore (${projectId})…`);

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error("\n✗ Falta FIREBASE_TOKEN o service-account.json");
    console.error("  PC: firebase login:ci → config/credenciales.local.json → firebaseToken");
    console.error("  npm run setup:firebase-token\n");
    process.exit(1);
  }

  const ruleset = await deployRules(projectId, accessToken);
  console.log(`✓ Reglas desplegadas: ${ruleset}\n`);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
