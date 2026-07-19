#!/usr/bin/env node
/**
 * Crea cuentas reales en Google Sheets (Apps Script).
 * Uso: npm run seed:sheets-production
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BOOTSTRAP = resolve(ROOT, "config/bootstrap.json");

/** Primeras credenciales de producción — La Sucursal del Café */
const PRODUCTION_USERS = [
  {
    uid: "prod-admin-lsc",
    email: "lasucursaldelcafe@gmail.com",
    password: "SpeLaSucursal2026!",
    nombre: "La Sucursal del Café",
    role: "administrador",
    workerId: "",
    perfilCompleto: "true",
  },
];

async function upsertUser(webAppUrl, token, user) {
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsert",
      token,
      collection: "users",
      idField: "uid",
      record: user,
    }),
    redirect: "follow",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
}

async function bootstrap(webAppUrl, token) {
  const res = await fetch(
    `${webAppUrl.replace(/\/$/, "")}?action=bootstrap&token=${encodeURIComponent(token)}`,
    { redirect: "follow" },
  );
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error("Bootstrap falló");
}

async function main() {
  const cfg = JSON.parse(readFileSync(BOOTSTRAP, "utf-8"));
  const webAppUrl = cfg.sheetsWebAppUrl?.trim();
  const token = cfg.sheetsApiToken?.trim();
  if (!webAppUrl || !token) {
    console.error("✗ config/bootstrap.json sin Sheets URL/token");
    process.exit(1);
  }

  console.log("→ Bootstrap hojas SPE…");
  await bootstrap(webAppUrl, token);

  for (const user of PRODUCTION_USERS) {
    console.log(`→ Usuario: ${user.email} (${user.role})`);
    await upsertUser(webAppUrl, token, user);
    console.log(`✓ ${user.email}`);
  }

  console.log("\n✓ Cuentas de producción listas en Google Sheets");
  console.log("  Admin: lasucursaldelcafe@gmail.com / SpeLaSucursal2026!");
  console.log("  App: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login\n");
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
