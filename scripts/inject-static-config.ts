import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENV_LOCAL, parseEnvFile } from "./env-file";

const CONFIG_PATH = resolve(import.meta.dirname, "../docs/config.js");

function main(): void {
  const env = {
    ...parseEnvFile(resolve(import.meta.dirname, "../.env.example")),
    ...parseEnvFile(ENV_LOCAL),
  };

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    env.GOOGLE_CLIENT_ID ||
    "";

  const pagesBase =
    process.env.GITHUB_PAGES_BASE?.trim() ||
    env.GITHUB_PAGES_BASE ||
    "/Programa-de-logistca";

  const content = `// Generado por scripts/inject-static-config.ts — no editar a mano.
window.LOGISTICA_CONFIG = {
  googleClientId: ${JSON.stringify(googleClientId)},
  pagesBase: ${JSON.stringify(pagesBase)},
};
`;

  writeFileSync(CONFIG_PATH, content, "utf-8");
  console.log(`+ docs/config.js actualizado (googleClientId=${googleClientId ? "sí" : "vacío"})`);
}

main();
