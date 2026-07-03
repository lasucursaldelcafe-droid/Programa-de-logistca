import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const WEB_ENV = resolve(ROOT, "apps/web/.env.local");

const ENV_CONTENT = `VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-personal-eventos.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-personal-eventos
VITE_FIREBASE_STORAGE_BUCKET=demo-personal-eventos.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
VITE_USE_FIREBASE_EMULATORS=true
`;

function main(): void {
  console.log("> Setup Fase 1 — Sistema de Personal Eventos");

  if (!existsSync(WEB_ENV)) {
    writeFileSync(WEB_ENV, ENV_CONTENT, "utf-8");
    console.log("+ Creado apps/web/.env.local (emuladores)");
  }

  console.log("> Instalando dependencias…");
  execSync("npm install", { cwd: ROOT, stdio: "inherit" });

  console.log("\n✓ Setup listo.");
  console.log("  Arranque automático: npm start");
  console.log("  Sincronizar enlaces: npm run sync:links");
  console.log("  (emuladores + seed + app en http://localhost:5173)");
}

main();
