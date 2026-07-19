#!/usr/bin/env node
/**
 * Crea cuentas reales y configuración operativa inicial en Google Sheets.
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
    telefono: "",
    habilitado: "true",
  },
];

const DEFAULT_PAYROLL_RATES = [
  { id: "rate-logistica", perfil: "logistica", tarifaPorHora: 18000, costoRefrigerioAlmuerzo: 12000, costoRefrigerioSnack: 5000 },
  { id: "rate-montaje", perfil: "montaje", tarifaPorHora: 20000, costoRefrigerioAlmuerzo: 12000, costoRefrigerioCena: 10000 },
  { id: "rate-recreacion", perfil: "recreacion", tarifaPorHora: 16000, costoRefrigerioAlmuerzo: 11000, costoRefrigerioSnack: 4500 },
  { id: "rate-anfitrion", perfil: "anfitrion", tarifaPorHora: 17000, costoRefrigerioAlmuerzo: 11000 },
  { id: "rate-chef", perfil: "chef", tarifaPorHora: 25000, costoRefrigerioAlmuerzo: 15000, costoRefrigerioCena: 12000 },
  { id: "rate-supervisor", perfil: "supervisor", tarifaPorHora: 28000, costoRefrigerioAlmuerzo: 15000, costoRefrigerioCena: 12000 },
  { id: "rate-seguridad", perfil: "seguridad", tarifaPorHora: 19000, costoRefrigerioAlmuerzo: 12000 },
];

async function upsertRecord(webAppUrl, token, collection, record, idField = "id") {
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsert",
      token,
      collection,
      idField,
      record,
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

  const now = new Date();
  const inicio = new Date(now);
  inicio.setHours(8, 0, 0, 0);
  const fin = new Date(now);
  fin.setDate(fin.getDate() + 7);
  fin.setHours(22, 0, 0, 0);

  const eventId = "event-lsc-inicial";
  const siteId = "site-lsc-principal";

  console.log("→ Bootstrap hojas SPE…");
  await bootstrap(webAppUrl, token);

  for (const user of PRODUCTION_USERS) {
    console.log(`→ Usuario: ${user.email} (${user.role})`);
    await upsertRecord(webAppUrl, token, "users", user, "uid");
    console.log(`✓ ${user.email}`);
  }

  console.log("→ Evento operativo inicial…");
  await upsertRecord(webAppUrl, token, "events", {
    id: eventId,
    nombre: "Operación La Sucursal del Café",
    fechaInicio: inicio.toISOString(),
    fechaFin: fin.toISOString(),
    sitioIds: siteId,
    temaLaboral:
      "Atención al cliente, montaje de stand y logística de café. Uniforme corporativo y puntualidad.",
    reglasOperativas:
      "Marcar entrada con QR en sitio asignado. Permanecer dentro del radio GPS durante la jornada. Reportar retrasos o incidentes desde la app.",
    tiempoMinimoEstadiaMinutos: 30,
    supervisionActiva: true,
  });

  console.log("→ Sitio con geocerca…");
  await upsertRecord(webAppUrl, token, "sites", {
    id: siteId,
    eventId,
    nombre: "Sitio principal",
    lat: 4.6533,
    lng: -74.0836,
    radioGeocerca: 80,
  });

  console.log("→ Tarifas de nómina…");
  for (const rate of DEFAULT_PAYROLL_RATES) {
    await upsertRecord(webAppUrl, token, "payrollRates", rate);
  }

  console.log("→ Configuración del asistente…");
  await upsertRecord(webAppUrl, token, "setupConfig", {
    id: "default",
    completado: "false",
    pasoActual: "operaciones",
    pasosCompletados: JSON.stringify(["evento", "sitios", "tarifas", "qr"]),
    eventoId,
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: "prod-admin-lsc",
    actualizadoPorNombre: "La Sucursal del Café",
  });

  console.log("\n✓ Producción inicial lista en Google Sheets");
  console.log("  Admin: lasucursaldelcafe@gmail.com / SpeLaSucursal2026!");
  console.log("  Evento:", eventId);
  console.log("  Sitio:", siteId);
  console.log("  App: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login");
  console.log("\n  Siguiente: completar paso Operaciones en /configuracion, invitar personal y asignar turnos.\n");
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
