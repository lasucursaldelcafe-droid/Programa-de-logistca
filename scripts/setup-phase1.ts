import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATHS = [
  resolve(ROOT, "apps/admin/.env.local"),
  resolve(ROOT, "apps/worker/.env.local"),
  resolve(ROOT, "apps/master/.env.local"),
];

/** Config emuladores locales — funciona con `npm run dev:full` + seed sin Firebase real. */
const DEMO_EMULATOR_ENV = `VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-personal-eventos.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-personal-eventos
VITE_FIREBASE_STORAGE_BUCKET=demo-personal-eventos.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
VITE_USE_FIREBASE_EMULATORS=true
`;

function main(): void {
  console.log("> Setup — 3 plataformas (Master / Admin / Trabajador)");

  for (const envPath of ENV_PATHS) {
    if (!existsSync(envPath)) {
      writeFileSync(envPath, DEMO_EMULATOR_ENV, "utf-8");
      console.log(`+ Creado ${envPath.replace(ROOT + "/", "")} (emuladores demo)`);
    }
  }

  console.log("> Instalando dependencias…");
  execSync("npm install", { cwd: ROOT, stdio: "inherit" });

  console.log("\n✓ Setup listo.");
  console.log("  Desarrollo local (recomendado):");
  console.log("    npm run dev:full     → emuladores + seed + 3 apps");
  console.log("    npm run toolkit:demo → alternativa con SPE Toolkit");
  console.log("  Cuentas demo: admin@eventos.test / Admin123!  |  master@eventos.test / Master123!");
  console.log("  Producción: npm run toolkit:firebase  o  npm run setup:production");
}

main();
