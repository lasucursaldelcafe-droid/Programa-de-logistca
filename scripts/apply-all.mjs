#!/usr/bin/env node
/**
 * @deprecated Usa npm run setup:cli -- --full (Firebase).
 * Redirige a spe-setup-cli.mjs --full
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n=== apply:all → setup:cli --full (Firebase) ===\n");
const code = spawnSync("node", ["scripts/spe-setup-cli.mjs", "--full"], {
  cwd: ROOT,
  stdio: "inherit",
});
process.exit(code.status ?? 1);
