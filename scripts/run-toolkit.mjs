#!/usr/bin/env node
/**
 * Lanza SPE Toolkit GUI — detecta python/python3 según el SO.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gui = join(root, "tools", "spe_toolkit_gui.py");

const candidates =
  process.platform === "win32"
    ? ["python", "py", "python3"]
    : ["python3", "python"];

const bin = candidates.find((c) => {
  try {
    const r = spawn(c, ["--version"], { stdio: "ignore" });
    return r.pid !== undefined;
  } catch {
    return false;
  }
});

if (!bin) {
  console.error(
    "Python no encontrado. Instala Python 3.10+ o usa scripts/windows/SPE-Toolkit.bat"
  );
  process.exit(1);
}

if (!existsSync(gui)) {
  console.error("No se encuentra tools/spe_toolkit_gui.py");
  process.exit(1);
}

const child = spawn(bin, [gui], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 0));
