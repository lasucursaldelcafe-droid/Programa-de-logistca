import { cpSync, mkdirSync, rmSync, copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDeploymentLinks, updateReadme, updateRootIndex, writeDeploymentJson } from "./sync-links";

const dist = resolve(import.meta.dirname, "../apps/web/dist");
const docs = resolve(import.meta.dirname, "../docs");

const links = getDeploymentLinks();
writeDeploymentJson(links);
updateReadme(links);
updateRootIndex(links);

copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
writeFileSync(resolve(dist, ".nojekyll"), "");

mkdirSync(docs, { recursive: true });
rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });
cpSync(dist, docs, { recursive: true });

console.log(`✓ GitHub Pages listo (${links.pagesUrl})`);
console.log("  dist + docs/ + 404.html + .nojekyll + enlaces sincronizados");
