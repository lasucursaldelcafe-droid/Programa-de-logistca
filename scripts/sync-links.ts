/**
 * Fuente única de verdad para URLs de despliegue.
 * Deriva automáticamente owner/repo desde git o GITHUB_REPOSITORY.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

export interface DeploymentLinks {
  owner: string;
  repo: string;
  pagesBase: string;
  pagesUrl: string;
  repoUrl: string;
  actionsUrl: string;
}

function detectRepo(): { owner: string; repo: string } {
  const fromEnv = process.env.GITHUB_REPOSITORY?.trim();
  if (fromEnv?.includes("/")) {
    const [owner, repo] = fromEnv.split("/");
    return { owner: owner!, repo: repo! };
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
    const canonical = execSync(
      `gh api "repos/${owner}/${repo}" --jq .name`,
      { cwd: ROOT, encoding: "utf-8" },
    ).trim();
    if (canonical) repo = canonical;
  } catch {
    // gh no disponible o sin acceso
  }

  return { owner, repo };
}

export function getDeploymentLinks(): DeploymentLinks {
  const { owner, repo } = detectRepo();
  const pagesBase = `/${repo}/`;
  const pagesUrl = `https://${owner}.github.io/${repo}/`;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const actionsUrl = `${repoUrl}/actions`;

  return { owner, repo, pagesBase, pagesUrl, repoUrl, actionsUrl };
}

function updateReadme(links: DeploymentLinks): boolean {
  const readmePath = resolve(ROOT, "README.md");
  if (!existsSync(readmePath)) return false;

  let content = readFileSync(readmePath, "utf-8");
  const markerStart = "<!-- DEPLOY_LINKS_START -->";
  const markerEnd = "<!-- DEPLOY_LINKS_END -->";
  const block = `${markerStart}
| Recurso | URL |
|---------|-----|
| **App en línea** | ${links.pagesUrl} |
| **Repositorio** | ${links.repoUrl} |
| **Actions (CI)** | ${links.actionsUrl} |

> Enlaces generados automáticamente por \`npm run sync:links\` desde el repo \`${links.owner}/${links.repo}\`.
${markerEnd}`;

  const sectionRe = new RegExp(
    `${markerStart}[\\s\\S]*?${markerEnd}`,
    "m",
  );

  if (sectionRe.test(content)) {
    content = content.replace(sectionRe, block);
  } else {
    const anchor = "## Ver en línea (GitHub Pages)";
    if (content.includes(anchor)) {
      content = content.replace(
        anchor,
        `${anchor}\n\n${block}`,
      );
    }
  }

  content = content.replace(
    /\*\*URL pública:\*\* https:\/\/[^\s]+/,
    `**URL pública:** ${links.pagesUrl}`,
  );

  const before = readFileSync(readmePath, "utf-8");
  if (before === content) return false;
  writeFileSync(readmePath, content, "utf-8");
  return true;
}

function updateRootIndex(links: DeploymentLinks): boolean {
  const indexPath = resolve(ROOT, "index.html");
  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${links.pagesBase}" />
    <script>
      location.replace("${links.pagesBase}" + location.search + location.hash);
    </script>
    <title>Sistema de Personal — Eventos</title>
  </head>
  <body>
    <p><a href="${links.pagesBase}">Ir al Sistema de Personal</a></p>
  </body>
</html>
`;
  const before = existsSync(indexPath) ? readFileSync(indexPath, "utf-8") : "";
  if (before === html) return false;
  writeFileSync(indexPath, html, "utf-8");
  return true;
}

function writeDeploymentJson(links: DeploymentLinks): void {
  const out = resolve(ROOT, "apps/web/public/deployment.json");
  writeFileSync(out, `${JSON.stringify(links, null, 2)}\n`, "utf-8");
}

function main(): void {
  const links = getDeploymentLinks();
  writeDeploymentJson(links);
  const readmeChanged = updateReadme(links);
  const indexChanged = updateRootIndex(links);

  console.log("✓ Enlaces de despliegue sincronizados:");
  console.log(`  base:  ${links.pagesBase}`);
  console.log(`  url:   ${links.pagesUrl}`);
  console.log(`  repo:  ${links.repoUrl}`);
  if (readmeChanged) console.log("  ~ README.md actualizado");
  if (indexChanged) console.log("  ~ index.html actualizado");
}

const isDirectRun = process.argv[1]?.includes("sync-links");
if (isDirectRun) main();

export { updateReadme, updateRootIndex, writeDeploymentJson };
