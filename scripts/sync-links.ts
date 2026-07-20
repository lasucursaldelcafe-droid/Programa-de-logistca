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
  workerBase: string;
  workerUrl: string;
  masterBase: string;
  masterUrl: string;
  repoUrl: string;
  actionsUrl: string;
  guiaUrl: string;
  descargasUrl: string;
  releasesUrl: string;
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
  const workerBase = `/${repo}/worker/`;
  const workerUrl = `https://${owner}.github.io/${repo}/worker/`;
  const masterBase = `/${repo}/master/`;
  const masterUrl = `https://${owner}.github.io/${repo}/master/`;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const actionsUrl = `${repoUrl}/actions`;
  const guiaUrl = `${pagesUrl}GUIA.md`;
  const descargasUrl = `${pagesUrl}descargas`;
  const releasesUrl = `https://github.com/${owner}/${repo}/releases/latest`;

  return {
    owner,
    repo,
    pagesBase,
    pagesUrl,
    workerBase,
    workerUrl,
    masterBase,
    masterUrl,
    repoUrl,
    actionsUrl,
    guiaUrl,
    descargasUrl,
    releasesUrl,
  };
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
| **App unificada (web)** | ${links.pagesUrl} |
| **Guía (markdown)** | ${links.guiaUrl} |
| **Repositorio** | ${links.repoUrl} |
| **Actions (CI)** | ${links.actionsUrl} |

> Una sola app: Admin, Master y Trabajador en la misma URL. Enlaces generados por \`npm run sync:links\`.
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
    <title>Sistema de Personal — Eventos</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
      h1 { font-size: 1.25rem; }
      ul { line-height: 1.8; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <h1>Sistema de Personal para Eventos</h1>
    <p>Elige la plataforma que corresponde a tu rol:</p>
    <ul>
      <li><a href="${links.pagesBase}">Admin Console</a> — administradores y supervisores</li>
      <li><a href="${links.workerBase}">App Trabajador</a> — personal de campo</li>
      <li><a href="${links.masterBase}">Master Console</a> — super administrador</li>
      <li><a href="${links.guiaUrl}">Guía de uso (GUIA.md)</a></li>
    </ul>
  </body>
</html>
`;
  const before = existsSync(indexPath) ? readFileSync(indexPath, "utf-8") : "";
  if (before === html) return false;
  writeFileSync(indexPath, html, "utf-8");
  return true;
}

function writeDeploymentJson(links: DeploymentLinks): void {
  const out = resolve(ROOT, "apps/admin/public/deployment.json");
  writeFileSync(out, `${JSON.stringify(links, null, 2)}\n`, "utf-8");
}

function main(): void {
  const links = getDeploymentLinks();
  writeDeploymentJson(links);
  const readmeChanged = updateReadme(links);
  const indexChanged = updateRootIndex(links);

  console.log("✓ Enlaces de despliegue sincronizados:");
  console.log(`  admin:  ${links.pagesUrl}`);
  console.log(`  worker: ${links.workerUrl}`);
  console.log(`  master: ${links.masterUrl}`);
  console.log(`  repo:   ${links.repoUrl}`);
  if (readmeChanged) console.log("  ~ README.md actualizado");
  if (indexChanged) console.log("  ~ index.html actualizado");
}

const isDirectRun = process.argv[1]?.includes("sync-links");
if (isDirectRun) main();

export { updateReadme, updateRootIndex, writeDeploymentJson };
