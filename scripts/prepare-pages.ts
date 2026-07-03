import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../apps/web/dist");

copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
writeFileSync(resolve(dist, ".nojekyll"), "");

console.log("✓ GitHub Pages listo: 404.html + .nojekyll");
