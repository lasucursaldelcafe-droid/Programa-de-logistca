#!/usr/bin/env node
/**
 * Lanza SPE CLI — python -m tools.spe_automation.cli <args>
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const candidates =
  process.platform === "win32"
    ? ["python", "py", "python3"]
    : ["python3", "python"];

let bin = null;
for (const c of candidates) {
  const r = spawnSync(c, ["--version"], { encoding: "utf8" });
  if (r.status === 0) {
    bin = c;
    break;
  }
}

if (!bin) {
  console.error("Python no encontrado.");
  process.exit(1);
}

const result = spawnSync(bin, ["-m", "tools.spe_automation.cli", ...args], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
