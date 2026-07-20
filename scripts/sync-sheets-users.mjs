#!/usr/bin/env node
/**
 * Sincroniza cuentas plataforma en Google Sheets vía Web App (POST JSON).
 * Uso: node scripts/sync-sheets-users.mjs
 * Lee URL/token de config/bootstrap.json
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bootstrap = JSON.parse(readFileSync(resolve(ROOT, "config/bootstrap.json"), "utf-8"));
const webAppUrl = bootstrap.sheetsWebAppUrl?.trim();
const apiToken = bootstrap.sheetsApiToken?.trim();

if (!webAppUrl || !apiToken) {
  console.error("✗ config/bootstrap.json sin sheetsWebAppUrl / sheetsApiToken");
  process.exit(1);
}

/** @type {Array<{uid:string,email:string,password:string,nombre:string,role:string}>} */
const ACCOUNTS = [
  {
    uid: "sheets-admin",
    email: "admin@eventos.test",
    password: "Admin123!",
    nombre: "Administrador",
    role: "administrador",
  },
  {
    uid: "sheets-master",
    email: "master@eventos.test",
    password: "Master123!",
    nombre: "Master Plataforma",
    role: "super_admin",
  },
  {
    uid: "prod-admin-lsc",
    email: "lasucursaldelcafe@gmail.com",
    password: process.env.SPE_PROD_PASSWORD ?? "SpeLaSucursal2026!",
    nombre: "La Sucursal del Café",
    role: "administrador",
  },
];

async function post(payload) {
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: apiToken, ...payload }),
    redirect: "follow",
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 200));
  }
  if (data.error) throw new Error(data.error);
  return data;
}

async function ensureUser(account) {
  try {
    await post({
      action: "delete",
      collection: "users",
      idField: "uid",
      id: account.uid,
    });
  } catch {
    /* no existía */
  }
  await post({
    action: "upsert",
    collection: "users",
    idField: "uid",
    record: {
      ...account,
      workerId: "",
      perfilCompleto: "true",
    },
  });
  const login = await post({
    action: "login",
    email: account.email,
    password: account.password,
  });
  console.log(`✓ ${account.email} (${login.role})`);
}

async function main() {
  console.log("→ Sincronizando cuentas en Sheets…");
  await post({ action: "bootstrap" });
  for (const account of ACCOUNTS) {
    await ensureUser(account);
  }
  console.log("✓ Cuentas listas");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
