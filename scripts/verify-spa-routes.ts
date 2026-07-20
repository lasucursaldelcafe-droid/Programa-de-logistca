/**
 * Verifica que GitHub Pages sirva la SPA en rutas críticas (sin redirecciones rotas).
 * Ejecutar tras `npm run build:pages` o contra docs/ ya generado.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SPA_CRITICAL_ROUTES, SPA_MIRROR_ROUTES } from "./spa-routes";

const ROOT = resolve(import.meta.dirname, "..");
const docsDir = resolve(ROOT, "docs");

function readIndex(route: string): string | null {
  const path = route ? resolve(docsDir, route, "index.html") : resolve(docsDir, "index.html");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function isSpaShell(html: string): boolean {
  return html.includes('type="module"') && !html.includes('http-equiv="refresh"');
}

const errors: string[] = [];

if (!existsSync(docsDir)) {
  console.error("✗ No existe docs/ — ejecuta npm run build:pages primero");
  process.exit(1);
}

for (const route of SPA_MIRROR_ROUTES) {
  const html = readIndex(route);
  if (!html) {
    errors.push(`Falta docs/${route}/index.html`);
    continue;
  }
  if (!isSpaShell(html)) {
    errors.push(`${route}: index.html no es shell SPA (¿redirección legacy?)`);
  }
}

for (const route of SPA_CRITICAL_ROUTES) {
  const html = readIndex(route);
  if (!html) {
    errors.push(`Ruta crítica sin espejo: ${route}`);
  }
}

const root404 = resolve(docsDir, "404.html");
if (!existsSync(root404)) {
  errors.push("Falta docs/404.html (necesario para /activar/:token y rutas dinámicas)");
} else {
  const html404 = readFileSync(root404, "utf-8");
  if (!isSpaShell(html404)) {
    errors.push("404.html no contiene shell SPA");
  }
}

const workerHtml = readIndex("worker");
const masterHtml = readIndex("master");
if (workerHtml && !isSpaShell(workerHtml)) {
  errors.push("/worker/ redirige fuera de la SPA — los trabajadores pierden su inicio al recargar");
}
if (masterHtml && !isSpaShell(masterHtml)) {
  errors.push("/master/ redirige fuera de la SPA — el panel master no carga al recargar");
}

if (errors.length > 0) {
  console.error("✗ Rutas SPA con problemas:\n" + errors.map((e) => `  · ${e}`).join("\n"));
  process.exit(1);
}

console.log(`✓ SPA espejada OK (${SPA_MIRROR_ROUTES.length} rutas + 404.html)`);
