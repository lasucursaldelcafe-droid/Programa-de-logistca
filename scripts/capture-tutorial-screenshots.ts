/**
 * Captura pantallas para TUTORIAL-APP-SPE.html (modo demo local).
 * Requiere: VITE_DEMO_MODE=true npm run dev -w @spe/admin  →  :5173
 */
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildTutorialSeedState,
  TUTORIAL_INVITATION_CODE,
  TUTORIAL_INVITATION_TOKEN,
  TUTORIAL_QR_PAYLOAD,
  TUTORIAL_WORKER_EMAIL,
  TUTORIAL_WORKER_PASSWORD,
} from "./tutorial-seed-data";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "docs-source/tutorial-imagenes");
const BASE = process.env.TUTORIAL_BASE_URL ?? "http://127.0.0.1:5173";
const STORAGE_KEY = "spe-demo-store-v1";
const SESSION_KEY = "spe-demo-user";

const CHROME_PATHS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

interface Shot {
  file: string;
  path: string;
  waitMs?: number;
  skipGoto?: boolean;
  before?: (page: Page) => Promise<void>;
}

function seedPayload(): string {
  return JSON.stringify(buildTutorialSeedState());
}

async function newSeededPage(browser: Browser, mobile = false): Promise<Page> {
  const page = await browser.newPage();
  const viewport = mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2 }
    : { width: 1280, height: 900, deviceScaleFactor: 1 };
  await page.setViewport(viewport);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(
    (key, sessionKey, payload) => {
      localStorage.setItem(key, payload);
      sessionStorage.removeItem(sessionKey);
    },
    STORAGE_KEY,
    SESSION_KEY,
    seedPayload(),
  );
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  return page;
}

async function launchBrowser(windowSize = "1280,900"): Promise<Browser> {
  const chrome = CHROME_PATHS.find((p) => existsSync(p));
  if (!chrome) throw new Error("Chrome/Chromium no encontrado para capturas");
  return puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", `--window-size=${windowSize}`],
  });
}

function homePathForEmail(email: string): string {
  if (email.includes("master@")) return "/master";
  if (
    email.includes("maria.") ||
    email.includes("carlos.") ||
    email.includes("supervisor.")
  ) {
    return "/worker";
  }
  return "/panel";
}

/** Inicia sesión en modo demo vía sessionStorage (inputs React no cooperan bien con Puppeteer). */
async function login(page: Page, email: string, _password: string): Promise<void> {
  await page.evaluate(
    (sessionKey, em) => {
      sessionStorage.setItem(sessionKey, em);
    },
    SESSION_KEY,
    email,
  );
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));

  const sessionEmail = await page.evaluate(
    (sessionKey) => sessionStorage.getItem(sessionKey),
    SESSION_KEY,
  );
  if (sessionEmail !== email) {
    throw new Error(`Login falló para ${email} — sessionStorage no persistió`);
  }

  const home = homePathForEmail(email);
  await page.goto(`${BASE}${home}`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 600));
  const url = page.url();
  if (url.includes("/login")) {
    throw new Error(`Login falló para ${email} — redirigido a login desde ${home}`);
  }
}

async function capture(page: Page, { file, path, waitMs = 1400, before, skipGoto }: Shot): Promise<void> {
  if (before) await before(page);
  if (!skipGoto) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
  }
  await new Promise((r) => setTimeout(r, waitMs));
  await page.screenshot({ path: resolve(OUT, file), fullPage: false });
  console.log(`+ ${file}  ←  ${path}`);
}

async function clickWizardStep(page: Page, stepTitle: string): Promise<void> {
  await page.evaluate((title) => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.trim().startsWith(title),
    );
    btn?.click();
  }, stepTitle);
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });

  const browser = await launchBrowser();
  const page = await newSeededPage(browser);

  // —— Públicas ——
  await capture(page, { file: "01-login.png", path: "/login", waitMs: 1800 });
  await capture(page, { file: "02-unirse.png", path: "/unirse" });
  await capture(page, {
    file: "26-activar-cuenta.png",
    path: `/activar/${TUTORIAL_INVITATION_TOKEN}?codigo=${TUTORIAL_INVITATION_CODE}`,
    waitMs: 1600,
  });
  await capture(page, { file: "03-ayuda-publica.png", path: "/ayuda", waitMs: 1600 });

  // —— Admin (datos demo completos) ——
  await login(page, "admin@eventos.test", "Admin123!");

  const adminShots: Shot[] = [
    { file: "04-panel-admin.png", path: "/panel", waitMs: 2000 },
    { file: "05-configuracion.png", path: "/configuracion", waitMs: 1800, before: async (p) => {
      await p.goto(`${BASE}/configuracion`, { waitUntil: "networkidle0" });
      await clickWizardStep(p, "Evento");
      await new Promise((r) => setTimeout(r, 600));
    }, skipGoto: true },
    { file: "06-personal.png", path: "/personal" },
    { file: "07-cuentas.png", path: "/cuentas" },
    { file: "08-qr-sitios.png", path: "/qr-sitios" },
    { file: "09-turnos-admin.png", path: "/turnos" },
    { file: "10-mapa.png", path: "/mapa", waitMs: 2000 },
    { file: "22-supervision.png", path: "/supervision", waitMs: 1800 },
    { file: "11-reportes.png", path: "/reportes" },
    { file: "12-nomina.png", path: "/nomina" },
    { file: "13-notificaciones.png", path: "/notificaciones" },
    { file: "23-clientes.png", path: "/clientes" },
    { file: "24-facturacion.png", path: "/facturacion" },
    { file: "25-inventario.png", path: "/inventario" },
    { file: "14-integraciones.png", path: "/integraciones", waitMs: 1800 },
  ];
  for (const shot of adminShots) {
    await capture(page, shot);
  }

  // —— Master ——
  await login(page, "master@eventos.test", "Master123!");
  await capture(page, { file: "15-master-panel.png", path: "/master", waitMs: 1600 });
  await capture(page, { file: "29-master-administradores.png", path: "/master/administradores" });
  await capture(page, { file: "16-master-informes.png", path: "/master/informes" });
  await capture(page, { file: "17-master-auditoria.png", path: "/master/auditoria" });

  await browser.close();

  // —— Trabajador (móvil) ——
  const mobileBrowser = await launchBrowser("390,844");
  const workerPage = await newSeededPage(mobileBrowser, true);
  await login(workerPage, TUTORIAL_WORKER_EMAIL, TUTORIAL_WORKER_PASSWORD);

  await capture(workerPage, { file: "18-worker-inicio.png", path: "/worker", waitMs: 1600 });
  await capture(workerPage, { file: "19-worker-turnos.png", path: "/worker/turnos" });
  await capture(workerPage, {
    file: "20-worker-entrada.png",
    path: "/worker/entrada",
    waitMs: 1200,
    skipGoto: true,
    before: async (p) => {
      await p.goto(`${BASE}/worker/entrada`, { waitUntil: "networkidle0" });
      await p.waitForFunction(
        () => {
          const t = document.body.textContent ?? "";
          return (
            t.includes("Marcar entrada") ||
            t.includes("Consentimiento") ||
            t.includes("Código QR")
          );
        },
        { timeout: 15000 },
      );

      const alreadyConsent = await p.evaluate(
        () => document.body.textContent?.includes("Consentimiento") ?? false,
      );
      if (alreadyConsent) return;

      await p.evaluate((qr) => {
        const input =
          document.querySelector('input[placeholder*="spe:qr"]') ??
          document.querySelector("form input:not([type=checkbox])");
        if (!input) return;
        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        );
        descriptor?.set?.call(input, qr);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, TUTORIAL_QR_PAYLOAD);

      await Promise.all([
        p
          .waitForFunction(
            () => document.body.textContent?.includes("Consentimiento") ?? false,
            { timeout: 10000 },
          )
          .catch(() => undefined),
        p.click('button[type="submit"]'),
      ]);
      await new Promise((r) => setTimeout(r, 800));
    },
  });
  await capture(workerPage, { file: "21-worker-reportar.png", path: "/worker/reportar" });
  await capture(workerPage, { file: "28-worker-notificaciones.png", path: "/worker/notificaciones" });

  // Completar perfil (cuenta sin perfil completo — sesión nueva)
  await mobileBrowser.close();
  const profileBrowser = await launchBrowser("390,844");
  const profilePage = await newSeededPage(profileBrowser, true);
  await login(profilePage, "carlos.ruiz@eventos.test", "Trabajador123!");
  await capture(profilePage, {
    file: "27-completar-perfil.png",
    path: "/completar-perfil",
    waitMs: 1600,
  });
  await profileBrowser.close();

  // Manifest para cache-bust en HTML
  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    files: [
      "01-login.png", "02-unirse.png", "03-ayuda-publica.png",
      "04-panel-admin.png", "05-configuracion.png", "06-personal.png",
      "07-cuentas.png", "08-qr-sitios.png", "09-turnos-admin.png",
      "10-mapa.png", "11-reportes.png", "12-nomina.png",
      "13-notificaciones.png", "14-integraciones.png",
      "15-master-panel.png", "16-master-informes.png", "17-master-auditoria.png",
      "18-worker-inicio.png", "19-worker-turnos.png", "20-worker-entrada.png",
      "21-worker-reportar.png",
      "22-supervision.png", "23-clientes.png", "24-facturacion.png",
      "25-inventario.png", "26-activar-cuenta.png", "27-completar-perfil.png",
      "28-worker-notificaciones.png", "29-master-administradores.png",
    ],
  };
  writeFileSync(resolve(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n✓ ${manifest.files.length} capturas en ${OUT}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
