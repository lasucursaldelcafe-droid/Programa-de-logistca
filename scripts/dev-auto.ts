/**
 * Arranque automático: setup → emuladores → seed → Admin Console.
 */
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const AUTH_PORT = 9099;
const FIRESTORE_PORT = 8080;
const ADMIN_PORT = 5173;
const PROJECT_ID = "demo-personal-eventos";

let emulatorProc: ChildProcess | null = null;
let webProc: ChildProcess | null = null;
let startedEmulators = false;

function log(msg: string): void {
  console.log(`\n> ${msg}`);
}

function portOpen(port: number, host = "127.0.0.1", timeoutMs = 800): Promise<boolean> {
  return new Promise((resolvePort) => {
    const socket = net.connect({ port, host });
    const timer = setTimeout(() => {
      socket.destroy();
      resolvePort(false);
    }, timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timer);
      socket.end();
      resolvePort(true);
    });
    socket.once("error", () => {
      clearTimeout(timer);
      resolvePort(false);
    });
  });
}

async function waitForPorts(ports: number[], timeoutMs = 90_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const results = await Promise.all(ports.map((p) => portOpen(p)));
    if (results.every(Boolean)) return;
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Emuladores no respondieron en ${timeoutMs / 1000}s`);
}

function runSync(cmd: string, args: string[]): void {
  execSync([cmd, ...args].join(" "), { cwd: ROOT, stdio: "inherit", shell: true });
}

function spawnProc(cmd: string, args: string[], label: string): ChildProcess {
  const proc = spawn(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  proc.on("exit", (code, signal) => {
    if (signal) console.log(`\n× ${label} terminó (${signal})`);
    else if (code !== 0 && code !== null) console.log(`\n× ${label} salió con código ${code}`);
  });
  return proc;
}

async function ensureSetup(): Promise<void> {
  const adminEnv = resolve(ROOT, "apps/admin/.env.local");
  if (!existsSync(adminEnv) || !existsSync(resolve(ROOT, "node_modules"))) {
    log("Ejecutando setup inicial…");
    runSync("npm", ["run", "setup"]);
  }
}

async function ensureEmulators(): Promise<void> {
  const authUp = await portOpen(AUTH_PORT);
  const firestoreUp = await portOpen(FIRESTORE_PORT);

  if (authUp && firestoreUp) {
    log(`Emuladores ya activos (Auth :${AUTH_PORT}, Firestore :${FIRESTORE_PORT})`);
    return;
  }

  log(`Iniciando Firebase Emulators (proyecto ${PROJECT_ID})…`);
  emulatorProc = spawnProc(
    "npx",
    ["firebase", "emulators:start", "--only", "auth,firestore", "--project", PROJECT_ID],
    "Emuladores",
  );
  startedEmulators = true;
  await waitForPorts([AUTH_PORT, FIRESTORE_PORT]);
  log(`Emuladores listos · UI http://localhost:4000`);
}

async function ensureSeed(): Promise<void> {
  log("Cargando datos de prueba (seed)…");
  runSync("npm", ["run", "seed"]);
  log("Seed completo");
}

function startAdmin(): void {
  log(`Admin Console → http://localhost:${ADMIN_PORT}`);
  console.log("\n  Plataformas:");
  console.log("    Master     → npm run dev:master  (5175)  master@eventos.test / Master123!");
  console.log("    Admin      → http://localhost:5173      admin@eventos.test / Admin123!");
  console.log("    Trabajador → npm run dev:worker (5174)  (cuenta vía invitación desde Admin)\n");

  webProc = spawnProc("npm", ["run", "dev:admin"], "Admin");
}

function shutdown(): void {
  if (webProc && !webProc.killed) webProc.kill("SIGTERM");
  if (emulatorProc && startedEmulators && !emulatorProc.killed) {
    log("Deteniendo emuladores…");
    emulatorProc.kill("SIGTERM");
  }
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  Personal Eventos — 3 plataformas");
  console.log("═══════════════════════════════════════════");

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });

  await ensureSetup();
  await ensureEmulators();
  await ensureSeed();
  startAdmin();

  await new Promise<void>((resolveWait) => {
    const check = setInterval(() => {
      if (webProc?.exitCode !== null && webProc?.exitCode !== undefined) {
        clearInterval(check);
        shutdown();
        resolveWait();
      }
    }, 500);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  shutdown();
  process.exit(1);
});
