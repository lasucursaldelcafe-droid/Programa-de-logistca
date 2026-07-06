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
run("npm run build -w @spe/shared && npm run build -w @spe/admin", {
  GITHUB_PAGES_BASE: appBase(),
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE ?? "true",
  VITE_USE_FIREBASE_EMULATORS: process.env.VITE_USE_FIREBASE_EMULATORS ?? "false",
});

const adminDist = resolve(ROOT, "apps/admin/dist");

finalizeSpa(adminDist, [
  "login",
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
copyFileSync(resolve(ROOT, "docs-source/INTEGRACIONES-APIS.md"), resolve(docs, "INTEGRACIONES-APIS.md"));
writeFileSync(resolve(docs, ".nojekyll"), "");

console.log(`✓ GitHub Pages listo (${links.pagesUrl})`);
console.log("  App unificada — login único, panel según rol (Admin / Master / Trabajador)");
console.log("  Redirecciones legacy: /worker/ y /master/ → raíz");
