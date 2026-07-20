/** URLs de acceso rápido y checklist de configuración pendiente. */

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

export function buildDemoLoginUrl(pagesUrl: string, role: "admin" | "master" = "admin"): string {
  const email = role === "master" ? "master@eventos.test" : DEMO_ADMIN_EMAIL;
  const password = role === "master" ? "Master123!" : DEMO_ADMIN_PASSWORD;
  const base = pagesUrl.replace(/\/?$/, "/");
  const params = new URLSearchParams({
    spe_backend: "demo",
    email,
    password,
    auto: "1",
  });
  return `${base}login?${params.toString()}`;
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
      fallbackHref: () => buildDemoLoginUrl(pages),
      installSteps: [
        "Abre el enlace en Chrome, Edge o Safari.",
        "Inicia sesión con tu cuenta o usa el acceso demo.",
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
        "Abre SPE Eventos desde el menú Inicio.",
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
        "Requiere conexión a internet para cargar datos.",
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
        "Abre el archivo e instala SPE Eventos.",
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
      fallbackHref: () => `${pages}login?spe_backend=demo`,
      installSteps: [
        "Abre el enlace en Safari (no Chrome en iOS).",
        "Toca Compartir → «Añadir a pantalla de inicio».",
        "Abre SPE desde el icono como app nativa.",
      ],
    },
  ];
}

export function getSetupChecklist(base: DeploymentBase): SetupChecklistItem[] {
  const pages = base.pagesUrl.replace(/\/?$/, "/");
  const secretsUrl = buildGitHubSecretsUrl(base.owner, base.repo);
  const releasesUrl = buildReleasesUrl(base.owner, base.repo);

  return [
    {
      id: "pendientes-guia",
      title: "Guía paso a paso (config. pendiente)",
      description: "Credenciales, links automáticos y orden de configuración.",
      priority: "p0",
      href: `${pages}pendientes`,
      actionLabel: "Abrir guía",
    },
    {
      id: "login-demo",
      title: "Probar login demo en la web",
      description: "Verifica que la app carga y entra con admin automático.",
      priority: "p0",
      href: buildDemoLoginUrl(pages),
      actionLabel: "Entrar como admin",
      doneHint: "Debes ver el panel con Backend: demo",
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
      id: "sheets-backend",
      title: "Alternativa: Google Sheets",
      description: "Backend sin Firebase JSON — Apps Script + token API.",
      priority: "p0",
      href: `${pages}configurar`,
      actionLabel: "Configurar Sheets",
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
      id: "clasp-push",
      title: "Desplegar Apps Script (Sheets)",
      description: "cd apps-script/spe-backend && clasp push && clasp run setupSheets",
      priority: "p1",
      href: `${base.repoUrl}/blob/main/docs-source/OPCION-GOOGLE-SHEETS.md`,
      actionLabel: "Guía Sheets",
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
}
