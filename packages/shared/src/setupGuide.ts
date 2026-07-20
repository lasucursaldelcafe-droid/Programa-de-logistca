import {
  buildDemoLoginUrl,
  buildDescargasUrl,
  buildGitHubSecretsUrl,
  buildReleasesUrl,
  type DeploymentBase,
} from "./setupLinks";
import { PLATFORM_ADMIN_EMAIL, PLATFORM_SEED_ACCOUNTS } from "./accounts";

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

export function getSetupGuideSteps(base?: Partial<DeploymentBase>): SetupGuideStep[] {
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

  const demoAdmin = PLATFORM_SEED_ACCOUNTS.find((a) => a.role === "administrador")!;
  const demoMaster = PLATFORM_SEED_ACCOUNTS.find((a) => a.role === "super_admin")!;

  return [
    {
      id: "login-demo",
      title: "1. Probar que la app funciona (demo)",
      priority: "p0",
      summary: "Sin configurar nada. Solo verifica que entras al panel.",
      steps: [
        "Abre el link de acceso automático (abajo).",
        "Debe decir Backend: demo (navegador) en el login o entrar directo al panel.",
        "Explora Resumen, Turnos y Personal.",
        "En móvil: icono ☰ arriba a la izquierda abre el menú lateral.",
      ],
      credentials: [
        { label: "Admin demo", value: `${demoAdmin.email} / ${demoAdmin.password}` },
        { label: "Master demo", value: `${demoMaster.email} / ${demoMaster.password}` },
      ],
      links: [
        { label: "Entrar admin automático", href: buildDemoLoginUrl(pages, "admin") },
        { label: "Entrar master automático", href: buildDemoLoginUrl(pages, "master") },
        { label: "Login manual", href: `${pages}login?spe_backend=demo` },
      ],
      doneWhen: "Ves el panel Admin con menú lateral desplegable por categorías.",
    },
    {
      id: "sheets-backend",
      title: "2. Producción con Google Sheets (recomendado)",
      priority: "p0",
      summary: "Datos reales sin descargar JSON de Firebase. Ideal desde celular.",
      steps: [
        "En PC ejecuta: npm run setup:sheets-auto (genera token y URL).",
        "O revisa el correo lasucursaldelcafe@gmail.com → busca CREDENCIALES-SHEETS.",
        "Copia Web App URL (termina en /exec) y API Token (hex largo).",
        "Opción A — Edita config/bootstrap.json en GitHub (link abajo).",
        "Opción B — Pega los mismos valores en GitHub Secrets (tabla de credenciales).",
        "En Apps Script (script.google.com): clasp push + ejecutar setupSheets si tienes PC.",
        "Espera 2–5 min al deploy y prueba login producción.",
      ],
      credentials: [
        { label: "VITE_DATA_BACKEND", value: "sheets" },
        { label: "VITE_DEMO_MODE", value: "false" },
        {
          label: "VITE_SHEETS_WEB_APP_URL",
          value: "https://script.google.com/macros/s/TU_ID/exec",
          note: "Reemplaza con tu URL real del paso 3",
        },
        {
          label: "VITE_SHEETS_API_TOKEN",
          value: "(token de CREDENCIALES-SHEETS-AUTO.txt)",
          note: "64+ caracteres hex; no uses cambiar-token-seguro",
        },
        {
          label: "Admin producción (Sheets)",
          value: `${PLATFORM_ADMIN_EMAIL} / SpeLaSucursal2026!`,
          note: "Se crea al ejecutar setupSheets en Apps Script",
        },
        { label: "VITE_BLOQUEAR_INTEGRACIONES", value: "true" },
        { label: "VITE_INTEGRACIONES_CLAVE", value: "spe-desbloquear" },
      ],
      links: [
        { label: "Editar bootstrap.json", href: BOOTSTRAP_EDIT },
        { label: "Configurar desde móvil", href: `${pages}configurar` },
        { label: "GitHub Secrets", href: SECRETS },
        { label: "Guía Sheets completa", href: `${REPO}/blob/main/docs-source/OPCION-GOOGLE-SHEETS.md` },
      ],
      doneWhen: "Login con lasucursaldelcafe@gmail.com funciona y Backend dice Google Sheets.",
    },
    {
      id: "firebase-secrets",
      title: "3. Alternativa: Firebase (6 secrets)",
      priority: "p0",
      summary: "Si prefieres Firestore en lugar de Sheets.",
      steps: [
        "Entra a Firebase Console → tu proyecto → ⚙️ Configuración.",
        "Pestaña General → «Tus apps» → SDK web → copia cada campo.",
        "En GitHub Secrets crea un secret por cada fila de la tabla.",
        "Opcional: FIREBASE_SERVICE_ACCOUNT_JSON para seed automático.",
        "Push a main o espera deploy; login con cuenta Firebase Auth.",
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
      ],
      links: [
        { label: "Firebase Console", href: "https://console.firebase.google.com/" },
        { label: "GitHub Secrets", href: buildGitHubSecretsUrl(owner, repo) },
        { label: "Guía Firebase", href: `${REPO}/blob/main/docs-source/PRODUCCION-FIREBASE.md` },
      ],
      doneWhen: "CI en verde y login producción sin modo demo.",
    },
    {
      id: "releases",
      title: "4. Descargar Windows, Android y Linux",
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
      title: "5. Mapa en vivo (Google Maps)",
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
      title: "6. Notificaciones push (FCM)",
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
      title: "7. Siigo / WhatsApp (fase 2)",
      priority: "p2",
      summary: "Integraciones avanzadas; requieren backend seguro.",
      steps: [
        "Entra al panel Integraciones en la app.",
        "Desbloquea con clave spe-desbloquear (demo).",
        "En producción: credenciales Siigo/WhatsApp van en Cloud Functions, no en el navegador.",
      ],
      credentials: [
        { label: "VITE_INTEGRACIONES_CLAVE (demo)", value: "spe-desbloquear" },
      ],
      links: [
        { label: "Integraciones en la app", href: `${pages}integraciones` },
      ],
      doneWhen: "Documentado y planificado; no bloquea operación básica.",
    },
  ];
}
