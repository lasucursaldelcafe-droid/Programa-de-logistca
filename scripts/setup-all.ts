import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ENV_LOCAL, parseEnvFile, writeEnvUpdates } from "./env-file";

const ROOT = resolve(import.meta.dirname, "..");

function log(msg: string, level: "info" | "ok" | "warn" = "info"): void {
  const prefix = { info: ">", ok: "+", warn: "!" }[level];
  console.log(`${prefix} ${msg}`);
}

function run(cmd: string): void {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

async function main(): Promise<void> {
  log("=== Setup Programa de Logística ===");

  if (!existsSync(ENV_LOCAL)) {
    run("cp .env.example .env.local");
    log("Creado .env.local desde .env.example", "ok");
  }

  const env = parseEnvFile(ENV_LOCAL);

  if (!env.MAIN_EMAIL) {
    writeEnvUpdates({ MAIN_EMAIL: "lasucursaldelcafe@gmail.com" });
    log("MAIN_EMAIL=lasucursaldelcafe@gmail.com", "ok");
  }

  log("1/4 — Turso (remoto si hay TURSO_PLATFORM_TOKEN)...");
  run("tsx scripts/setup-turso.ts");

  log("2/4 — Base de datos local/remota...");
  run("npm run db:init");

  const refreshed = parseEnvFile(ENV_LOCAL);
  if (!refreshed.TURSO_DATABASE_URL?.startsWith("libsql://")) {
    log("3/4 — Datos de ejemplo (solo SQLite local)...");
    run("npm run db:seed");
  } else {
    log("3/4 — Seed opcional omitido (Turso remoto activo)", "warn");
  }

  log("4/4 — Config estática (Google Client ID + Pages base)...");
  run("tsx scripts/inject-static-config.ts");

  log("=== Setup completo ===", "ok");
  log("Siguiente: npm run dev  |  npm run setup:google  |  npm run deploy:vercel");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
