import { cpSync, mkdirSync, rmSync, copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { getDeploymentLinks, updateReadme, updateRootIndex, writeDeploymentJson } from "./sync-links";
import { resolvePagesBase } from "./resolve-pages-base";

const ROOT = resolve(import.meta.dirname, "..");
const docs = resolve(ROOT, "docs");

function run(cmd: string, env: Record<string, string>): void {
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });
}

function mirrorSpaRoutes(distDir: string, routes: string[]): void {
  const indexPath = resolve(distDir, "index.html");
  for (const route of routes) {
    const dir = resolve(distDir, route);
    mkdirSync(dir, { recursive: true });
    copyFileSync(indexPath, resolve(dir, "index.html"));
  }
}

function finalizeSpa(distDir: string, extraRoutes: string[] = []): void {
  copyFileSync(resolve(distDir, "index.html"), resolve(distDir, "404.html"));
  writeFileSync(resolve(distDir, ".nojekyll"), "");
  if (extraRoutes.length > 0) mirrorSpaRoutes(distDir, extraRoutes);
}

function writeLegacyRedirect(targetDir: string, redirectTo: string): void {
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(
    resolve(targetDir, "index.html"),
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${redirectTo}" />
  <script>location.replace(${JSON.stringify(redirectTo)});</script>
  <title>SPE — redirigiendo…</title>
</head>
<body><p>Redirigiendo a la app unificada SPE…</p></body>
</html>`,
  );
}

function appBase(): string {
  return resolvePagesBase();
}

const links = getDeploymentLinks();
writeDeploymentJson(links);
updateReadme(links);
updateRootIndex(links);

console.log("→ Build app unificada (Admin + Master + Trabajador)…");
run("node scripts/sync-repo-config.mjs", {});
run("npm run build -w @spe/shared && npm run build -w @spe/admin", {
  GITHUB_PAGES_BASE: appBase(),
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE ?? "false",
  VITE_USE_FIREBASE_EMULATORS: process.env.VITE_USE_FIREBASE_EMULATORS ?? "false",
  VITE_DATA_BACKEND: process.env.VITE_DATA_BACKEND ?? "",
  VITE_SHEETS_WEB_APP_URL: process.env.VITE_SHEETS_WEB_APP_URL ?? "",
  VITE_SHEETS_API_TOKEN: process.env.VITE_SHEETS_API_TOKEN ?? "",
  VITE_BLOQUEAR_INTEGRACIONES: process.env.VITE_BLOQUEAR_INTEGRACIONES ?? "true",
  VITE_INTEGRACIONES_CLAVE: process.env.VITE_INTEGRACIONES_CLAVE ?? "spe-desbloquear",
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY ?? "",
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID ?? "",
  VITE_FIREBASE_VAPID_KEY: process.env.VITE_FIREBASE_VAPID_KEY ?? "",
});

const adminDist = resolve(ROOT, "apps/admin/dist");

finalizeSpa(adminDist, [
  "login",
  "configurar",
  "ayuda",
  "unirse",
  "completar-perfil",
  "panel",
  "personal",
  "turnos",
  "cuentas",
  "qr-sitios",
  "mapa",
  "reportes",
  "nomina",
  "configuracion",
  "clientes",
  "facturacion",
  "inventario",
  "integraciones",
  "supervision",
  "master",
  "master/administradores",
  "master/informes",
  "master/auditoria",
  "worker",
  "worker/turnos",
  "worker/entrada",
  "worker/reportar",
]);

mkdirSync(docs, { recursive: true });
rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });

cpSync(adminDist, docs, { recursive: true });

// Compatibilidad: URLs antiguas /worker/ y /master/ redirigen a la app unificada
writeLegacyRedirect(resolve(docs, "worker"), links.pagesUrl);
writeLegacyRedirect(resolve(docs, "master"), links.pagesUrl);

copyFileSync(resolve(ROOT, "docs-source/GUIA.md"), resolve(docs, "GUIA.md"));
copyFileSync(
  resolve(ROOT, "apps/admin/public/spe-runtime-config.json"),
  resolve(docs, "spe-runtime-config.json"),
);
copyFileSync(resolve(ROOT, "docs-source/INTEGRACIONES-APIS.md"), resolve(docs, "INTEGRACIONES-APIS.md"));
copyFileSync(resolve(ROOT, "docs-source/CUENTAS-Y-ROLES.md"), resolve(docs, "CUENTAS-Y-ROLES.md"));
copyFileSync(resolve(ROOT, "docs-source/TUTORIAL-APP-SPE.html"), resolve(docs, "TUTORIAL-APP-SPE.html"));
cpSync(resolve(ROOT, "docs-source/tutorial-imagenes"), resolve(docs, "tutorial-imagenes"), { recursive: true });
writeFileSync(resolve(docs, ".nojekyll"), "");

console.log(`✓ GitHub Pages listo (${links.pagesUrl})`);
console.log("  App unificada — login único, panel según rol (Admin / Master / Trabajador)");
console.log("  Redirecciones legacy: /worker/ y /master/ → raíz");
