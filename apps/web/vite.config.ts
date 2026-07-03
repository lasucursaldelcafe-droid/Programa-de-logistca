import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { execSync } from "node:child_process";

function resolvePagesBase(): string {
  if (process.env.GITHUB_PAGES_BASE) return process.env.GITHUB_PAGES_BASE;
  const full = process.env.GITHUB_REPOSITORY;
  if (full) {
    const repo = full.split("/")[1];
    if (repo) return `/${repo}/`;
  }
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    const match = remote.match(/github\.com[:/][^/]+\/([^/.]+)/);
    if (match) {
      const owner = remote.match(/github\.com[:/]([^/]+)\//)?.[1];
      const slug = match[1]!;
      if (owner) {
        try {
          const canonical = execSync(
            `gh api "repos/${owner}/${slug}" --jq .name`,
            { encoding: "utf-8" },
          ).trim();
          if (canonical) return `/${canonical}/`;
        } catch {
          // fallback al slug del remoto
        }
      }
      return `/${slug}/`;
    }
  } catch {
    // sin remoto
  }
  return "/";
}

export default defineConfig({
  base: resolvePagesBase(),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  define: {
    "import.meta.env.DEV": JSON.stringify(process.env.NODE_ENV !== "production"),
  },
});
