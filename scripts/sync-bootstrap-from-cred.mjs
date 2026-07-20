#!/usr/bin/env node
/** Copia CREDENCIALES-SHEETS-AUTO.txt → config vía sync-repo-config */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("node", ["scripts/sync-repo-config.mjs"], { cwd: ROOT, stdio: "inherit" });
process.exit(r.status ?? 1);
