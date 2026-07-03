import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENV_LOCAL, parseEnvFile } from "./env-file";

const DOCS_DIR = resolve(import.meta.dirname, "../docs");
const CONFIG_PATH = resolve(DOCS_DIR, "config.js");
const INDEX_PATH = resolve(DOCS_DIR, "index.html");
const NOT_FOUND_PATH = resolve(DOCS_DIR, "404.html");

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

  const normalizedBase = pagesBase.endsWith("/") ? pagesBase : `${pagesBase}/`;

  writeFileSync(
    CONFIG_PATH,
    `// Generado por scripts/inject-static-config.ts — no editar a mano.
window.LOGISTICA_CONFIG = {
  googleClientId: ${JSON.stringify(googleClientId)},
  pagesBase: ${JSON.stringify(normalizedBase.replace(/\/$/, "") || "/")},
};
`,
    "utf-8",
  );

  let indexHtml = readFileSync(INDEX_PATH, "utf-8");

  const fallbackConfig = `<script>window.LOGISTICA_CONFIG=window.LOGISTICA_CONFIG||{googleClientId:"",pagesBase:"${normalizedBase.replace(/\/$/, "") || "/"}"};</script>`;
  if (!indexHtml.includes("window.LOGISTICA_CONFIG=window.LOGISTICA_CONFIG")) {
    indexHtml = indexHtml.replace(
      "<script src=\"config.js\"></script>",
      `${fallbackConfig}\n    <script src="config.js"></script>`,
    );
  }

  const baseTag = `<base href="${normalizedBase}" />`;
  if (indexHtml.includes("<base href=")) {
    indexHtml = indexHtml.replace(/<base href="[^"]*"\s*\/?>/, baseTag);
  } else {
    indexHtml = indexHtml.replace(
      "<meta charset=\"utf-8\" />",
      `<meta charset="utf-8" />\n    ${baseTag}`,
    );
  }

  writeFileSync(INDEX_PATH, indexHtml, "utf-8");

  const notFoundHtml = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <base href="${normalizedBase}" />
    <title>Programa de Logística</title>
    <script>
      // GitHub Pages: rutas desconocidas vuelven al inicio
      location.replace("${normalizedBase}");
    </script>
  </head>
  <body>
    <p><a href="${normalizedBase}">Volver al inicio</a></p>
  </body>
</html>
`;
  writeFileSync(NOT_FOUND_PATH, notFoundHtml, "utf-8");

  console.log(
    `+ docs/config.js + base href + 404.html (base=${normalizedBase}, google=${googleClientId ? "sí" : "vacío"})`,
  );
}

main();
