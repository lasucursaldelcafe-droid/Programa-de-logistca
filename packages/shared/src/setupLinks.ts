/** URLs de acceso rápido y checklist de configuración pendiente. */

import { isSetupItemDone, type ResolvedSetupStatus } from "./setupStatus";

export interface DeploymentBase {
  pagesUrl: string;
  repoUrl: string;
  actionsUrl: string;
  owner: string;
  repo: string;
}

export interface SetupChecklistItem {
  id: string;
  title: string;
  description: string;
  priority: "p0" | "p1" | "p2";
  href: string;
  actionLabel: string;
  doneHint?: string;
}

export interface PlatformDownloadSpec {
  id: "web" | "windows" | "windows-portable" | "android" | "linux" | "ios";
  label: string;
  description: string;
  icon: string;
  /** Patrón en nombre de asset de GitHub Release (regex string) */
  assetPattern?: string;
  /** Link fijo si no depende del release */
  fallbackHref?: (base: DeploymentBase) => string;
  installSteps: string[];
}

const DEMO_ADMIN_EMAIL = "admin@eventos.test";
const DEMO_ADMIN_PASSWORD = "Admin123!";

/** @deprecated Modo demo eliminado — redirige al login normal. */
export function buildDemoLoginUrl(pagesUrl: string, _role: "admin" | "master" = "admin"): string {
  void DEMO_ADMIN_EMAIL;
  void DEMO_ADMIN_PASSWORD;
  return `${pagesUrl.replace(/\/?$/, "/")}login`;
}

export function buildLoginUrl(pagesUrl: string): string {
  return `${pagesUrl.replace(/\/?$/, "/")}login`;
}

export function buildDescargasUrl(pagesUrl: string): string {
  return `${pagesUrl.replace(/\/?$/, "/")}descargas`;
}

export function buildGitHubSecretsUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}/settings/secrets/actions`;
}

export function buildReleasesUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}/releases/latest`;
}

export function buildReleasesApiUrl(owner: string, repo: string): string {
  return `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
}

export function getPlatformDownloads(base: DeploymentBase): PlatformDownloadSpec[] {
  const pages = base.pagesUrl.replace(/\/?$/, "/");
  return [
    {
      id: "web",
      label: "Navegador (todas las plataformas)",
      description: "Admin, Master y Trabajador en una sola URL. Funciona en PC, tablet y móvil.",
      icon: "🌐",
      fallbackHref: () => buildLoginUrl(pages),
      installSteps: [
        "Abre el enlace en Chrome, Edge o Safari.",
        "Inicia sesión con tu cuenta Firebase.",
        "Opcional: agrega a favoritos o pantalla de inicio.",
      ],
    },
    {
      id: "windows",
      label: "Windows — Instalador",
      description: "Instalador NSIS (.exe) para Windows 10/11.",
      icon: "🪟",
      assetPattern: "SPE-.*-nsis\\.exe$",
      fallbackHref: () => buildReleasesUrl(base.owner, base.repo),
      installSteps: [
        "Descarga el archivo *-nsis.exe.",
        "Ejecuta el instalador y sigue el asistente.",
        "Abre SPE Eventos e inicia sesión con tu cuenta Firebase (misma que la web).",
        "Los datos se sincronizan en tiempo real con web y móvil.",
      ],
    },
    {
      id: "windows-portable",
      label: "Windows — Portable",
      description: "Ejecutable sin instalar; ideal para USB o pruebas.",
      icon: "💾",
      assetPattern: "SPE-.*-portable\\.exe$",
      fallbackHref: () => buildReleasesUrl(base.owner, base.repo),
      installSteps: [
        "Descarga *-portable.exe.",
        "Ejecuta directamente (no requiere instalación).",
        "Inicia sesión con la misma cuenta que en la web — datos sincronizados vía Firebase.",
      ],
    },
    {
      id: "android",
      label: "Android — APK",
      description: "App nativa para GPS, QR y biometría en campo.",
      icon: "🤖",
      assetPattern: "SPE-Eventos-.*-android\\.apk$",
      fallbackHref: () => buildReleasesUrl(base.owner, base.repo),
      installSteps: [
        "Descarga el .apk en el teléfono.",
        "Permite orígenes desconocidos en Ajustes → Seguridad.",
        "Instala y abre SPE Eventos.",
        "Inicia sesión con la misma cuenta Firebase que en web/PC.",
      ],
    },
    {
      id: "linux",
      label: "Linux — AppImage",
      description: "Ejecutable universal para Ubuntu, Fedora y derivados.",
      icon: "🐧",
      assetPattern: "SPE-.*\\.AppImage$",
      fallbackHref: () => buildReleasesUrl(base.owner, base.repo),
      installSteps: [
        "Descarga el archivo .AppImage.",
        "chmod +x SPE-*.AppImage && ./SPE-*.AppImage",
        "Opcional: integra en el menú de aplicaciones.",
      ],
    },
    {
      id: "ios",
      label: "iPhone / iPad (Safari)",
      description: "App web progresiva: instala desde Safari sin App Store.",
      icon: "📱",
      fallbackHref: () => `${pages}login`,
      installSteps: [
        "Abre el enlace en Safari (no Chrome en iOS).",
        "Toca Compartir → «Añadir a pantalla de inicio».",
        "Abre SPE desde el icono como app nativa.",
      ],
    },
  ];
}

export function getSetupChecklist(
  base: DeploymentBase,
  status?: ResolvedSetupStatus,
): SetupChecklistItem[] {
  const pages = base.pagesUrl.replace(/\/?$/, "/");
  const secretsUrl = buildGitHubSecretsUrl(base.owner, base.repo);
  const releasesUrl = buildReleasesUrl(base.owner, base.repo);

  const items: SetupChecklistItem[] = [
    {
      id: "pendientes-guia",
      title: "Guía paso a paso (config. pendiente)",
      description: "Credenciales, links automáticos y orden de configuración.",
      priority: "p0",
      href: `${pages}pendientes`,
      actionLabel: "Abrir guía",
    },
    {
      id: "firebase-login",
      title: "Probar login en producción",
      description: "Verifica que la app carga y entra con tu cuenta Firebase.",
      priority: "p0",
      href: buildLoginUrl(pages),
      actionLabel: "Ir al login",
      doneHint: "Debes ver el panel con Backend: Firebase",
    },
    {
      id: "descargas",
      title: "Página de descargas",
      description: "Enlaces a Windows, Android, Linux e iOS desde un solo lugar.",
      priority: "p0",
      href: buildDescargasUrl(pages),
      actionLabel: "Ver descargas",
    },
    {
      id: "firebase-secrets",
      title: "Secrets Firebase en GitHub",
      description: "VITE_FIREBASE_* para producción real y releases automáticos.",
      priority: "p0",
      href: secretsUrl,
      actionLabel: "Abrir Secrets",
      doneHint: "6 variables Firebase + opcional VAPID",
    },
    {
      id: "releases",
      title: "Instaladores Windows / Android / Linux",
      description: "Se generan en cada push a main cuando CI pasa.",
      priority: "p1",
      href: releasesUrl,
      actionLabel: "Ver releases",
    },
    {
      id: "integraciones",
      title: "Integraciones Siigo / WhatsApp",
      description: "Requiere backend seguro en Cloud Functions (fase 2).",
      priority: "p2",
      href: `${pages}integraciones`,
      actionLabel: "Ver integraciones",
    },
    {
      id: "fcm",
      title: "Notificaciones push (FCM)",
      description: "Configura VITE_FIREBASE_VAPID_KEY para alertas en producción.",
      priority: "p2",
      href: secretsUrl,
      actionLabel: "Añadir VAPID",
    },
    {
      id: "ci-status",
      title: "Estado del CI y deploy",
      description: "Revisa si build, Pages y releases están en verde.",
      priority: "p1",
      href: base.actionsUrl,
      actionLabel: "Ver Actions",
    },
  ];

  if (!status) return items;
  return items.filter((item) => !isSetupItemDone(item.id, status));
}
