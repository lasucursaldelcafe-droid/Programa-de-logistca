import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATHS = [
  resolve(ROOT, "apps/admin/.env.local"),
  resolve(ROOT, "apps/worker/.env.local"),
  resolve(ROOT, "apps/master/.env.local"),
];

const ENV_CONTENT = `VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATORS=false
`;

function main(): void {
  console.log("> Setup — 3 plataformas (Master / Admin / Trabajador)");

  for (const envPath of ENV_PATHS) {
    if (!existsSync(envPath)) {
      writeFileSync(envPath, ENV_CONTENT, "utf-8");
      console.log(`+ Creado ${envPath.replace(ROOT + "/", "")}`);
    }
  }

  console.log("> Instalando dependencias…");
  execSync("npm install", { cwd: ROOT, stdio: "inherit" });

  console.log("\n✓ Setup listo.");
  console.log("  1. Copia apps/admin/.env.production.example → apps/admin/.env.local");
  console.log("  2. Pega las credenciales de Firebase Console");
  console.log("  3. npm start          → desarrollo local :5173");
  console.log("  4. npm run dev:full   → emuladores + seed (solo desarrollo)");
}

main();
