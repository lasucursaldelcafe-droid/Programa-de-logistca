/**
 * Configuración automática SPE — orquestador principal.
 *
 * Uso:
 *   npm run setup:auto              → desarrollo local (emuladores)
 *   npm run setup:auto -- --production [--json firebase-web-config.json]
 *   npm run setup:auto -- --sheets --web-app-url URL --api-token TOKEN
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const ENV_APPS = [
  resolve(ROOT, "apps/admin/.env.local"),
  resolve(ROOT, "apps/worker/.env.local"),
  resolve(ROOT, "apps/master/.env.local"),
];

const FIREBASE_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const DEMO_ENV = `VITE_DEMO_MODE=true
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-personal-eventos.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-personal-eventos
VITE_FIREBASE_STORAGE_BUCKET=demo-personal-eventos.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
`;

function log(msg: string, level: "info" | "ok" | "warn" | "err" = "info"): void {
  const prefix = { info: ">", ok: "+", warn: "!", err: "✗" }[level];
  console.log(`${prefix} ${msg}`);
}

function run(cmd: string, opts?: { cwd?: string; env?: NodeJS.ProcessEnv }): void {
  execSync(cmd, { cwd: opts?.cwd ?? ROOT, stdio: "inherit", env: { ...process.env, ...opts?.env } });
}

function parseArgs(): {
  mode: "demo" | "production" | "sheets";
  jsonPath: string;
  pushGithub: boolean;
  seedProduction: boolean;
  sheetsUrl: string;
  sheetsToken: string;
  skipInstall: boolean;
} {
  const args = process.argv.slice(2);
  let mode: "demo" | "production" | "sheets" = "demo";
  let jsonPath = resolve(ROOT, "firebase-web-config.json");
  let pushGithub = false;
  let seedProduction = false;
  let sheetsUrl = "";
  let sheetsToken = "";
  let skipInstall = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--production" || a === "-p") mode = "production";
    else if (a === "--sheets") mode = "sheets";
    else if (a === "--json" && args[i + 1]) jsonPath = resolve(ROOT, args[++i]!);
    else if (a === "--push-github") pushGithub = true;
    else if (a === "--seed") seedProduction = true;
    else if (a === "--web-app-url" && args[i + 1]) sheetsUrl = args[++i]!;
    else if (a === "--api-token" && args[i + 1]) sheetsToken = args[++i]!;
    else if (a === "--skip-install") skipInstall = true;
  }

  return { mode, jsonPath, pushGithub, seedProduction, sheetsUrl, sheetsToken, skipInstall };
}

function parseFirebaseJson(path: string): Record<string, string> {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as Record<string, string>;
  return {
    VITE_FIREBASE_API_KEY: raw.apiKey ?? raw.VITE_FIREBASE_API_KEY ?? "",
    VITE_FIREBASE_AUTH_DOMAIN: raw.authDomain ?? raw.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    VITE_FIREBASE_PROJECT_ID: raw.projectId ?? raw.VITE_FIREBASE_PROJECT_ID ?? "",
    VITE_FIREBASE_STORAGE_BUCKET: raw.storageBucket ?? raw.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    VITE_FIREBASE_MESSAGING_SENDER_ID:
      raw.messagingSenderId ?? raw.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    VITE_FIREBASE_APP_ID: raw.appId ?? raw.VITE_FIREBASE_APP_ID ?? "",
    ...(raw.vapidKey || raw.VITE_FIREBASE_VAPID_KEY
      ? { VITE_FIREBASE_VAPID_KEY: raw.vapidKey ?? raw.VITE_FIREBASE_VAPID_KEY ?? "" }
      : {}),
  };
}

function writeProductionEnv(values: Record<string, string>, sheets = false): void {
  const lines = [
    "VITE_DEMO_MODE=false",
    "VITE_USE_FIREBASE_EMULATORS=false",
    ...(sheets ? ["VITE_DATA_BACKEND=sheets"] : []),
    ...FIREBASE_KEYS.map((k) => `${k}=${values[k] ?? ""}`),
  ];
  if (values.VITE_FIREBASE_VAPID_KEY) {
    lines.push(`VITE_FIREBASE_VAPID_KEY=${values.VITE_FIREBASE_VAPID_KEY}`);
  }
  if (sheets && values.VITE_SHEETS_WEB_APP_URL) {
    lines.push(`VITE_SHEETS_WEB_APP_URL=${values.VITE_SHEETS_WEB_APP_URL}`);
  }
  if (sheets && values.VITE_SHEETS_API_TOKEN) {
    lines.push(`VITE_SHEETS_API_TOKEN=${values.VITE_SHEETS_API_TOKEN}`);
  }
  const content = lines.join("\n") + "\n";
  for (const p of ENV_APPS) {
    writeFileSync(p, content, "utf-8");
    log(`Escrito ${p.replace(ROOT + "/", "")}`, "ok");
  }
}

function writeDemoEnv(): void {
  for (const p of ENV_APPS) {
    writeFileSync(p, DEMO_ENV, "utf-8");
    log(`Escrito ${p.replace(ROOT + "/", "")} (emuladores)`, "ok");
  }
}

function writeGithubSecretsTemplate(values: Record<string, string>): void {
  const path = resolve(ROOT, "github-secrets-commands.txt");
  const lines = [
    "# GitHub → Settings → Secrets and variables → Actions",
    "# O ejecuta: gh auth login && npm run toolkit:secrets",
    "",
  ];
  for (const key of [...FIREBASE_KEYS, "VITE_FIREBASE_VAPID_KEY"]) {
    const val = values[key];
    if (val) lines.push(`${key}=${val}`);
  }
  lines.push("");
  lines.push("# Comandos gh CLI:");
  for (const key of [...FIREBASE_KEYS, "VITE_FIREBASE_VAPID_KEY"]) {
    const val = values[key];
    if (val) lines.push(`gh secret set ${key} --body "${val.replace(/"/g, '\\"')}"`);
  }
  writeFileSync(path, lines.join("\n") + "\n", "utf-8");
  log(`Plantilla GitHub: ${path}`, "ok");
}

function writeCredentialsReadme(mode: string): void {
  const path = resolve(ROOT, "CREDENCIALES-SPE.txt");
  const body =
    mode === "demo"
      ? [
          "SPE — Desarrollo local (emuladores)",
          "",
          "1. npm run dev:full",
          "2. Admin:  http://localhost:5173",
          "   Master: http://localhost:5175",
          "   Worker: http://localhost:5174",
          "",
          "Cuentas:",
          "  admin@eventos.test / Admin123!",
          "  master@eventos.test / Master123!",
        ]
      : [
          "SPE — Producción configurada",
          "",
          "Local: npm start",
          "GitHub Pages: sube secrets (github-secrets-commands.txt)",
          "Cuentas: npm run seed:production -- --service-account service-account.json",
          "",
          "Firebase Console → Authentication (email/contraseña activo)",
          "Firestore rules: npm run firebase:deploy-rules",
        ];
  writeFileSync(path, body.join("\n") + "\n", "utf-8");
  log(`Credenciales: ${path}`, "ok");
}

function tryFirebaseDeployRules(projectId: string): void {
  const sa = resolve(ROOT, "service-account.json");
  if (!existsSync(sa)) {
    log("Firestore rules: omite deploy (falta service-account.json)", "warn");
    log("  Descarga la clave en Firebase Console → Cuentas de servicio", "warn");
    return;
  }
  try {
    run(`npx firebase deploy --only firestore:rules --project ${projectId}`, {
      env: { GOOGLE_APPLICATION_CREDENTIALS: sa },
    });
    log("Reglas Firestore desplegadas", "ok");
  } catch {
    log("No se pudieron desplegar reglas (¿firebase login o service account?)", "warn");
  }
}

function tryPushGithubSecrets(): void {
  const r = spawnSync("npm", ["run", "toolkit:secrets"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) {
    log("GitHub Secrets: usa github-secrets-commands.txt manualmente", "warn");
  }
}

function trySeedProduction(): void {
  const sa = resolve(ROOT, "service-account.json");
  if (!existsSync(sa)) {
    log("Seed producción: omite (coloca service-account.json en la raíz)", "warn");
    return;
  }
  try {
    run(`npm run seed:production -- --service-account ${sa}`);
    log("Cuentas admin/master creadas en Firebase Auth", "ok");
  } catch {
    log("Seed producción falló — revisa service-account.json", "warn");
  }
}

async function main(): Promise<void> {
  const opts = parseArgs();
  console.log("\n=== SPE — Configuración automática ===\n");

  if (!opts.skipInstall) {
    log("Instalando dependencias npm…");
    run("npm install");
  }

  if (opts.mode === "demo") {
    writeDemoEnv();
    writeCredentialsReadme("demo");
    log("\n✓ Modo desarrollo listo. Siguiente: npm run dev:full", "ok");
    return;
  }

  if (opts.mode === "sheets") {
    if (!opts.sheetsUrl || !opts.sheetsToken) {
      log("Sheets: indica --web-app-url y --api-token", "err");
      log("  Ver docs-source/OPCION-GOOGLE-SHEETS.md", "warn");
      process.exit(1);
    }
    writeProductionEnv(
      {
        VITE_SHEETS_WEB_APP_URL: opts.sheetsUrl,
        VITE_SHEETS_API_TOKEN: opts.sheetsToken,
        VITE_FIREBASE_API_KEY: "sheets-bridge",
        VITE_FIREBASE_AUTH_DOMAIN: "sheets.local",
        VITE_FIREBASE_PROJECT_ID: "sheets-bridge",
        VITE_FIREBASE_STORAGE_BUCKET: "sheets.local",
        VITE_FIREBASE_MESSAGING_SENDER_ID: "0",
        VITE_FIREBASE_APP_ID: "sheets-bridge",
      },
      true,
    );
    writeCredentialsReadme("sheets");
    log("\n✓ Backend Sheets configurado (piloto). GPS multi-dispositivo requiere Firebase.", "ok");
    return;
  }

  // production
  if (!existsSync(opts.jsonPath)) {
    log(`No existe ${opts.jsonPath}`, "err");
    log("\nPasos desde PC (sin celular):", "warn");
    log("  1. Abre https://console.firebase.google.com en el navegador del PC", "warn");
    log("  2. Proyecto → Configuración → App web → copia firebaseConfig", "warn");
    log("  3. Guárdalo como firebase-web-config.json (ver firebase-web-config.example.json)", "warn");
    log("  4. Vuelve a ejecutar: npm run setup:auto -- --production", "warn");
    process.exit(1);
  }

  const values = parseFirebaseJson(opts.jsonPath);
  const missing = FIREBASE_KEYS.filter((k) => !values[k]?.trim());
  if (missing.length > 0) {
    log(`Firebase incompleto: ${missing.join(", ")}`, "err");
    process.exit(1);
  }

  writeProductionEnv(values);
  writeGithubSecretsTemplate(values);
  writeCredentialsReadme("production");

  log("Actualizando service worker FCM…");
  run("tsx scripts/update-fcm-sw.ts");

  tryFirebaseDeployRules(values.VITE_FIREBASE_PROJECT_ID!);

  if (opts.pushGithub) tryPushGithubSecrets();
  if (opts.seedProduction) trySeedProduction();

  log("\n✓ Producción configurada en las 3 apps.", "ok");
  log("  → GitHub: npm run toolkit:secrets  (o github-secrets-commands.txt)", "info");
  log("  → Cuentas: service-account.json + npm run seed:production", "info");
  log("  → Local: npm start", "info");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
