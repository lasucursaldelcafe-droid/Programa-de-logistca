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

function finalizeSpa(distDir: string): void {
  copyFileSync(resolve(distDir, "index.html"), resolve(distDir, "404.html"));
  writeFileSync(resolve(distDir, ".nojekyll"), "");
}

function appBase(subpath?: string): string {
  const root = resolvePagesBase();
  if (!subpath) return root;
  return `${root}${subpath.replace(/^\//, "")}/`;
}

const links = getDeploymentLinks();
writeDeploymentJson(links);
updateReadme(links);
updateRootIndex(links);

console.log("→ Build Admin Console…");
run("npm run build -w @spe/shared && npm run build -w @spe/admin", {
  GITHUB_PAGES_BASE: appBase(),
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE ?? "true",
  VITE_USE_FIREBASE_EMULATORS: process.env.VITE_USE_FIREBASE_EMULATORS ?? "false",
});

console.log("→ Build App Trabajador…");
run("npm run build -w @spe/worker", {
  GITHUB_PAGES_BASE: appBase("worker"),
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE ?? "true",
  VITE_USE_FIREBASE_EMULATORS: process.env.VITE_USE_FIREBASE_EMULATORS ?? "false",
});

console.log("→ Build Master Console…");
run("npm run build -w @spe/master", {
  GITHUB_PAGES_BASE: appBase("master"),
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE ?? "true",
  VITE_USE_FIREBASE_EMULATORS: process.env.VITE_USE_FIREBASE_EMULATORS ?? "false",
});

const adminDist = resolve(ROOT, "apps/admin/dist");
const workerDist = resolve(ROOT, "apps/worker/dist");
const masterDist = resolve(ROOT, "apps/master/dist");

finalizeSpa(adminDist);
finalizeSpa(workerDist);
finalizeSpa(masterDist);

mkdirSync(docs, { recursive: true });
rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });

cpSync(adminDist, docs, { recursive: true });
mkdirSync(resolve(docs, "worker"), { recursive: true });
cpSync(workerDist, resolve(docs, "worker"), { recursive: true });
mkdirSync(resolve(docs, "master"), { recursive: true });
cpSync(masterDist, resolve(docs, "master"), { recursive: true });

const deploymentJson = resolve(ROOT, "apps/admin/public/deployment.json");
copyFileSync(deploymentJson, resolve(docs, "worker/deployment.json"));
copyFileSync(deploymentJson, resolve(docs, "master/deployment.json"));

// Guía estática accesible sin SPA
copyFileSync(resolve(ROOT, "docs-source/GUIA.md"), resolve(docs, "GUIA.md"));
writeFileSync(resolve(docs, ".nojekyll"), "");

console.log(`✓ GitHub Pages listo (${links.pagesUrl})`);
console.log(`  Admin:    ${links.pagesUrl}`);
console.log(`  Worker:   ${links.workerUrl}`);
console.log(`  Master:   ${links.masterUrl}`);
console.log("  docs/ + worker/ + master/ + 404.html + .nojekyll");
