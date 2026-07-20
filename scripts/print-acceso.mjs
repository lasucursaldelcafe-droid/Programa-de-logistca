#!/usr/bin/env node
/**
 * Imprime URL y credenciales de acceso (sin secretos del repo).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const LOGIN_URL =
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login";
const ADMIN_EMAIL = "lasucursaldelcafe@gmail.com";

function loadLocalPassword() {
  const path = resolve(ROOT, "config/acceso.local.json");
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    const pwd = data?.produccion?.password?.trim();
    if (pwd && !pwd.includes("PON_AQUI")) return pwd;
  } catch {
    /* ignore */
  }
  return null;
}

const localPassword = loadLocalPassword();

console.log("\n=== Personal Eventos — Acceso ===\n");
console.log("URL:     ", LOGIN_URL);
console.log("Correo:  ", ADMIN_EMAIL);
if (localPassword) {
  console.log("Password:", localPassword, "(desde config/acceso.local.json)");
} else {
  console.log("Password: (no guardada en repo — créala con seed:production)");
  console.log("\n  SPE_PROD_PASSWORD='TuClave' npm run seed:production -- --service-account ./service-account.json");
  console.log("\n  O copia config/acceso.local.ejemplo.json → config/acceso.local.json");
}
console.log("\nLocal emuladores (npm run dev:full):");
console.log("  admin@eventos.test / Admin123!");
console.log("  master@eventos.test / Master123!");
console.log("\nDocs: docs-source/ACCESO-PRODUCCION.md\n");
