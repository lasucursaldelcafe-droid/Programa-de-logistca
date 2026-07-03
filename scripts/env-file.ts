import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
export const ENV_LOCAL = resolve(ROOT, ".env.local");
export const ENV_EXAMPLE = resolve(ROOT, ".env.example");

export function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const env: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf-8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

export function serializeEnvFile(
  existingLines: string[],
  env: Record<string, string>,
): string {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const rawLine of existingLines) {
    const stripped = rawLine.trim();
    if (!stripped || stripped.startsWith("#") || !stripped.includes("=")) {
      out.push(rawLine.replace(/\n$/, ""));
      continue;
    }
    const key = stripped.split("=")[0]?.trim() ?? "";
    if (key in env) {
      out.push(`${key}=${env[key]}`);
      seen.add(key);
    } else {
      out.push(rawLine.replace(/\n$/, ""));
    }
  }

  for (const [key, value] of Object.entries(env)) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }

  return `${out.join("\n")}\n`;
}

export function writeEnvUpdates(
  updates: Record<string, string>,
  target = ENV_LOCAL,
): void {
  const merged = parseEnvFile(target);
  Object.assign(merged, updates);

  let existingLines: string[] = [];
  if (existsSync(target)) {
    existingLines = readFileSync(target, "utf-8").split("\n");
  } else if (existsSync(ENV_EXAMPLE)) {
    writeFileSync(target, readFileSync(ENV_EXAMPLE, "utf-8"), "utf-8");
    existingLines = readFileSync(target, "utf-8").split("\n");
  }

  writeFileSync(target, serializeEnvFile(existingLines, merged), "utf-8");
}
