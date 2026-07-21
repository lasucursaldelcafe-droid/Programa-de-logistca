import { cpSync, mkdirSync, rmSync, copyFileSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";
import { getDeploymentLinks, updateReadme, updateRootIndex, writeDeploymentJson } from "./sync-links";
import { resolvePagesBase } from "./resolve-pages-base";
import { SPA_MIRROR_ROUTES } from "./spa-routes";

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

/** Sustituye el BUILD id estático para forzar purge de cache en cada deploy. */
function stampBuildId(distDir: string, buildId: string): void {
  const visit = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === "assets" || name === "tutorial-imagenes") continue;
        visit(full);
        continue;
      }
      if (name !== "index.html" && name !== "404.html") continue;
      const html = readFileSync(full, "utf8");
      const next = html.replace(
        /var BUILD = "[^"]*"/,
        `var BUILD = ${JSON.stringify(buildId)}`,
      );
      if (next !== html) writeFileSync(full, next);
    }
  };
  visit(distDir);
}

function appBase(): string {
  return resolvePagesBase();
}

const links = getDeploymentLinks();
writeDeploymentJson(links);
updateReadme(links);
updateRootIndex(links);

const uiVersion =
  process.env.SPE_UI_VERSION?.trim() ||
  process.env.GITHUB_SHA?.trim()?.slice(0, 12) ||
  `pages-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;

console.log("→ Build app unificada (Admin + Master + Trabajador)…");
run("node scripts/sync-repo-config.mjs", {});
run("node scripts/write-runtime-config.mjs", {
  VITE_SPE_CANONICAL_URL: process.env.VITE_SPE_CANONICAL_URL ?? "",
  SPE_UI_VERSION: uiVersion,
  VITE_SPE_UI_VERSION: uiVersion,
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY ?? "",
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID ?? "",
  VITE_FIREBASE_VAPID_KEY: process.env.VITE_FIREBASE_VAPID_KEY ?? "",
  VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
});
run("npm run setup:fcm", {});
run("npm run build -w @spe/shared && npm run build -w @spe/admin", {
  GITHUB_PAGES_BASE: appBase(),
  VITE_SPE_CANONICAL_URL: process.env.VITE_SPE_CANONICAL_URL ?? links.pagesUrl,
  VITE_SPE_UI_VERSION: uiVersion,
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
  VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
});

const adminDist = resolve(ROOT, "apps/admin/dist");

finalizeSpa(adminDist, [...SPA_MIRROR_ROUTES]);
stampBuildId(adminDist, uiVersion);

mkdirSync(docs, { recursive: true });
rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });

cpSync(adminDist, docs, { recursive: true });

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
console.log(`  UI version: ${uiVersion}`);
console.log("  App unificada — login único, panel según rol (Admin / Master / Trabajador)");
console.log("  Sync: datos Firestore + UI en vivo (web/APK/Electron → Pages)");
