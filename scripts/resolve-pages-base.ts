import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

export function detectRepoSlug(): string {
  const full = process.env.GITHUB_REPOSITORY?.trim();
  if (full?.includes("/")) {
    const repo = full.split("/")[1];
    if (repo) return repo;
  }

  let owner = "lasucursaldelcafe-droid";
  let repo = "Programa-de-logistca";

  try {
    const remote = execSync("git remote get-url origin", {
      cwd: ROOT,
      encoding: "utf-8",
    }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      owner = match[1]!;
      repo = match[2]!;
    }
  } catch {
    // sin git remoto
  }

  try {
    const canonical = execSync(`gh api "repos/${owner}/${repo}" --jq .name`, {
      cwd: ROOT,
      encoding: "utf-8",
    }).trim();
    if (canonical) return canonical;
  } catch {
    // gh no disponible
  }

  return repo;
}

/** Base path de GitHub Pages, p. ej. `/Programa-de-logistca/` */
export function resolvePagesBase(subpath = ""): string {
  if (process.env.GITHUB_PAGES_BASE) {
    const base = process.env.GITHUB_PAGES_BASE.endsWith("/")
      ? process.env.GITHUB_PAGES_BASE
      : `${process.env.GITHUB_PAGES_BASE}/`;
    return subpath ? `${base}${subpath.replace(/^\//, "")}/` : base;
  }

  const repo = detectRepoSlug();
  const base = `/${repo}/`;
  return subpath ? `${base}${subpath.replace(/^\//, "")}/` : base;
}
