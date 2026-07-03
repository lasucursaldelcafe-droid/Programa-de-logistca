import { parseEnvFile, writeEnvUpdates, ENV_LOCAL } from "./env-file";

const PROJECT_ID = "empresario-virtual";
const CONSOLE =
  `https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}`;

const ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://lasucursaldelcafe-droid.github.io",
  "https://programa-de-logistica.vercel.app",
];

function main(): void {
  const env = parseEnvFile(ENV_LOCAL);
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    env.GOOGLE_CLIENT_ID ||
    "";

  console.log("> Google OAuth — Programa de Logística");
  console.log(`> Proyecto GCP compartido: ${PROJECT_ID}`);
  console.log(`> Consola: ${CONSOLE}`);
  console.log("");
  console.log("Orígenes JavaScript autorizados (añadir en el cliente OAuth Web):");
  for (const o of ORIGINS) console.log(`  - ${o}`);
  console.log("");

  if (clientId) {
    writeEnvUpdates({
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: clientId,
      GOOGLE_CLIENT_ID: clientId,
    });
    console.log("+ GOOGLE_CLIENT_ID ya presente en .env.local");
  } else {
    console.log("! GOOGLE_CLIENT_ID vacío — créalo en Google Cloud Console");
    console.log("  Luego pégalo en .env.local como NEXT_PUBLIC_GOOGLE_CLIENT_ID=");
    console.log("  y ejecuta: npm run setup:google && npm run setup:static");
  }
}

main();
