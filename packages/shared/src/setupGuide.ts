import {
  buildDescargasUrl,
  buildGitHubSecretsUrl,
  buildReleasesUrl,
  type DeploymentBase,
} from "./setupLinks";
import { PLATFORM_ADMIN_EMAIL } from "./accounts";
import { isSetupItemDone, type ResolvedSetupStatus } from "./setupStatus";

export interface SetupCredentialRow {
  label: string;
  value: string;
  note?: string;
}

export interface SetupGuideStep {
  id: string;
  title: string;
  priority: "p0" | "p1" | "p2";
  summary: string;
  steps: string[];
  credentials?: SetupCredentialRow[];
  links: Array<{ label: string; href: string }>;
  doneWhen: string;
}

const PAGES =
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";
const REPO = "https://github.com/lasucursaldelcafe-droid/Programa-de-logistca";
const SECRETS =
  "https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions";
const BOOTSTRAP_EDIT =
  "https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/edit/main/config/bootstrap.json";

export function getSetupGuideSteps(
  base?: Partial<DeploymentBase>,
  status?: ResolvedSetupStatus,
): SetupGuideStep[] {
  const allSteps = buildAllSetupGuideSteps(base);
  if (!status) return allSteps;
  return allSteps.filter((step) => !isSetupItemDone(step.id, status));
}

export function getSetupGuideStepsCompleted(
  base?: Partial<DeploymentBase>,
  status?: ResolvedSetupStatus,
): SetupGuideStep[] {
  if (!status) return [];
  return buildAllSetupGuideSteps(base).filter((step) => isSetupItemDone(step.id, status));
}

function buildAllSetupGuideSteps(base?: Partial<DeploymentBase>): SetupGuideStep[] {
  const pages = (base?.pagesUrl ?? PAGES).replace(/\/?$/, "/");
  const owner = base?.owner ?? "lasucursaldelcafe-droid";
  const repo = base?.repo ?? "Programa-de-logistca";
  const deploy: DeploymentBase = {
    pagesUrl: pages,
    repoUrl: base?.repoUrl ?? REPO,
    actionsUrl: base?.actionsUrl ?? `${REPO}/actions`,
    owner,
    repo,
  };

  const allSteps: SetupGuideStep[] = [
    {
      id: "firebase-secrets",
      title: "1. Configurar Firebase (6 secrets)",
      priority: "p0",
      summary: "Backend de producción con Firebase Auth y Firestore.",
      steps: [
        "Entra a Firebase Console → tu proyecto → ⚙️ Configuración.",
        "Pestaña General → «Tus apps» → SDK web → copia cada campo.",
        "En GitHub Secrets crea un secret por cada fila de la tabla.",
        "Verifica config/bootstrap.json con backend: firebase y demoMode: false.",
        "Push a main o espera deploy automático.",
        "Crea la cuenta admin: SPE_PROD_PASSWORD='…' npm run seed:production",
      ],
      credentials: [
        { label: "VITE_DATA_BACKEND", value: "firebase" },
        { label: "VITE_DEMO_MODE", value: "false" },
        { label: "VITE_FIREBASE_API_KEY", value: "(Firebase Console → apiKey)" },
        { label: "VITE_FIREBASE_AUTH_DOMAIN", value: "(Firebase → authDomain)" },
        { label: "VITE_FIREBASE_PROJECT_ID", value: "(Firebase → projectId)" },
        { label: "VITE_FIREBASE_STORAGE_BUCKET", value: "(Firebase → storageBucket)" },
        { label: "VITE_FIREBASE_MESSAGING_SENDER_ID", value: "(Firebase → messagingSenderId)" },
        { label: "VITE_FIREBASE_APP_ID", value: "(Firebase → appId)" },
        {
          label: "Admin producción",
          value: `${PLATFORM_ADMIN_EMAIL} / (contraseña en Firebase Auth)`,
          note: "Crea con seed:production o Firebase Console → Authentication",
        },
      ],
      links: [
        { label: "Firebase Console", href: "https://console.firebase.google.com/" },
        { label: "GitHub Secrets", href: buildGitHubSecretsUrl(owner, repo) },
        { label: "Editar bootstrap.json", href: BOOTSTRAP_EDIT },
        { label: "Guía Firebase", href: `${REPO}/blob/main/docs-source/PRODUCCION-FIREBASE.md` },
      ],
      doneWhen: "CI en verde, login con lasucursaldelcafe@gmail.com y Backend dice Firebase.",
    },
    {
      id: "firestore-deploy",
      title: "2. Desplegar Firestore (reglas + chat)",
      priority: "p0",
      summary: "Necesario para chat interno, comunicación y datos en producción.",
      steps: [
        "En PC: firebase login",
        "firebase use TU_PROJECT_ID (mismo que VITE_FIREBASE_PROJECT_ID)",
        "npm run firebase:deploy-firestore",
        "O usa Firebase MCP en Cursor (.cursor/mcp.json)",
        "Crea cuenta admin si aún no existe: npm run acceso (instrucciones)",
      ],
      credentials: [
        {
          label: "Comando",
          value: "npm run firebase:deploy-firestore",
        },
        {
          label: "Admin seed",
          value: "SPE_PROD_PASSWORD='…' npm run seed:production",
          note: "Requiere service-account.json o FIREBASE_SERVICE_ACCOUNT_JSON",
        },
      ],
      links: [
        { label: "Guía acceso", href: `${REPO}/blob/main/docs-source/ACCESO-PRODUCCION.md` },
        { label: "Firebase Console", href: "https://console.firebase.google.com/" },
      ],
      doneWhen: "Chat en /comunicacion funciona sin errores de permisos Firestore.",
    },
    {
      id: "firebase-login",
      title: "3. Probar login en producción",
      priority: "p0",
      summary: "Verifica que entras al panel con tu cuenta Firebase.",
      steps: [
        "Abre la URL de login (link abajo).",
        "Debe decir Backend: Firebase en el login.",
        "Inicia sesión con lasucursaldelcafe@gmail.com y tu contraseña.",
        "Explora Resumen, Turnos y Personal.",
      ],
      links: [
        { label: "Login producción", href: `${pages}login` },
        { label: "Panel Admin", href: `${pages}panel` },
      ],
      doneWhen: "Ves el panel Admin autenticado con Firebase.",
    },
    {
      id: "releases",
      title: "3. Descargar Windows, Android y Linux",
      priority: "p1",
      summary: "Instaladores generados automáticamente en cada push a main.",
      steps: [
        "Abre GitHub Releases (link abajo).",
        "Descarga SPE-Admin-*-nsis.exe (Windows instalador) o *-portable.exe.",
        "Descarga SPE-Eventos-*-android.apk para Android.",
        "Descarga SPE-Eventos-*-linux.AppImage para Linux.",
        "iOS: Safari → abrir la web → Compartir → Añadir a pantalla de inicio.",
      ],
      credentials: [],
      links: [
        { label: "Página descargas en la app", href: buildDescargasUrl(pages) },
        { label: "GitHub Releases", href: buildReleasesUrl(owner, repo) },
        { label: "Estado CI (Actions)", href: deploy.actionsUrl },
      ],
      doneWhen: "Al menos un .exe, .apk o .AppImage descargable en Releases.",
    },
    {
      id: "maps",
      title: "4. Mapa en vivo (Google Maps)",
      priority: "p1",
      summary: "Opcional. Sin clave se ve mapa esquemático.",
      steps: [
        "Google Cloud Console → APIs → Maps JavaScript API → habilitar.",
        "Credenciales → Crear clave API → restringe por dominio github.io.",
        "Añade VITE_GOOGLE_MAPS_API_KEY en GitHub Secrets o bootstrap.json.",
      ],
      credentials: [
        { label: "VITE_GOOGLE_MAPS_API_KEY", value: "(tu clave AIza...)" },
      ],
      links: [
        { label: "Google Cloud Console", href: "https://console.cloud.google.com/google/maps-apis" },
        { label: "GitHub Secrets", href: SECRETS },
        { label: "Probar mapa", href: `${pages}mapa` },
      ],
      doneWhen: "Mapa en vivo muestra calles reales, no solo esquema.",
    },
    {
      id: "fcm",
      title: "5. Notificaciones push (FCM)",
      priority: "p2",
      summary: "Alertas en móvil cuando hay Firebase configurado.",
      steps: [
        "Firebase Console → Cloud Messaging → certificados web.",
        "Copia clave VAPID pública.",
        "Secret: VITE_FIREBASE_VAPID_KEY en GitHub.",
        "Ejecuta npm run setup:fcm si tienes PC con el repo.",
      ],
      credentials: [
        { label: "VITE_FIREBASE_VAPID_KEY", value: "(Firebase → Cloud Messaging → Web Push)" },
      ],
      links: [
        { label: "Firebase Console", href: "https://console.firebase.google.com/" },
        { label: "GitHub Secrets", href: SECRETS },
      ],
      doneWhen: "Notificaciones llegan al trabajador en campo.",
    },
    {
      id: "integraciones",
      title: "6. Siigo / WhatsApp (fase 2)",
      priority: "p2",
      summary: "Integraciones avanzadas; requieren backend seguro.",
      steps: [
        "Entra al panel Integraciones en la app.",
        "Desbloquea con clave spe-desbloquear.",
        "En producción: credenciales Siigo/WhatsApp van en Cloud Functions, no en el navegador.",
      ],
      credentials: [
        { label: "VITE_INTEGRACIONES_CLAVE", value: "spe-desbloquear" },
      ],
      links: [
        { label: "Integraciones en la app", href: `${pages}integraciones` },
      ],
      doneWhen: "Documentado y planificado; no bloquea operación básica.",
    },
  ];

  return allSteps;
}
