/**
 * Captura pantallas para TUTORIAL-APP-SPE.html (modo demo local).
 * Requiere: VITE_DEMO_MODE=true npm run dev en apps/admin :5173
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "docs-source/tutorial-imagenes");
const BASE = process.env.TUTORIAL_BASE_URL ?? "http://127.0.0.1:5173";

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
  before?: () => Promise<void>;
}

async function main(): Promise<void> {
  const chrome = CHROME_PATHS.find((p) => existsSync(p));
  if (!chrome) throw new Error("Chrome no encontrado");

  mkdirSync(OUT, { recursive: true });
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  async function shot({ file, path, waitMs = 1200, before }: Shot): Promise<void> {
    if (before) await before();
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, waitMs));
    await page.screenshot({ path: resolve(OUT, file), fullPage: false });
    console.log(`+ ${file}`);
  }

  async function login(email: string, password: string): Promise<void> {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await page.type('input[type="email"]', email, { delay: 20 });
    await page.type('input[type="password"]', password, { delay: 20 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 1500));
  }

  async function seedWorkerSession(targetPage: typeof page): Promise<void> {
    await targetPage.evaluateOnNewDocument(() => {
      sessionStorage.setItem("spe-demo-user", "trabajador@eventos.test");
      const state = {
        workers: [
          {
            id: "w-demo-1",
            nombre: "María López",
            email: "trabajador@eventos.test",
            telefono: "3001234567",
            documento: "1234567890",
            rol: "mesero",
            estado: "asignado",
            cuentaCreada: true,
            habilitado: true,
          },
        ],
        shifts: [
          {
            id: "s-demo-1",
            workerId: "w-demo-1",
            workerNombre: "María López",
            siteId: "site-1",
            siteNombre: "Entrada principal",
            eventId: "ev-1",
            eventNombre: "Evento demo",
            inicio: new Date().toISOString(),
            fin: new Date(Date.now() + 8 * 3600_000).toISOString(),
            estado: "confirmado",
          },
        ],
        events: [
          {
            id: "ev-1",
            nombre: "Evento demo",
            fechaInicio: new Date().toISOString(),
            fechaFin: new Date(Date.now() + 86400000).toISOString(),
            activo: true,
          },
        ],
        sites: [
          {
            id: "site-1",
            nombre: "Entrada principal",
            eventId: "ev-1",
            lat: 4.701,
            lng: -74.072,
            radioMetros: 80,
          },
        ],
        invitations: [],
        qrCodes: [],
        attendances: [],
        notifications: [],
        breaks: [],
        payrollRates: [],
        payrollEntries: [],
        payrollAudit: [],
        setupConfig: {
          id: "default",
          completado: true,
          pasoActual: "listo",
          pasosCompletados: ["evento", "sitios", "personal"],
          actualizadoEn: new Date().toISOString(),
          actualizadoPor: "demo-admin",
          actualizadoPorNombre: "Administrador",
        },
        reportes: [],
        clientes: [],
        productos: [],
        facturas: [],
        posiciones: [],
        credencialesIntegraciones: {},
        accounts: [
          {
            email: "admin@eventos.test",
            password: "Admin123!",
            user: {
              uid: "demo-admin",
              email: "admin@eventos.test",
              nombre: "Administrador",
              role: "administrador",
              perfilCompleto: true,
            },
          },
          {
            email: "master@eventos.test",
            password: "Master123!",
            user: {
              uid: "demo-master",
              email: "master@eventos.test",
              nombre: "Master Plataforma",
              role: "super_admin",
              perfilCompleto: true,
            },
          },
          {
            email: "trabajador@eventos.test",
            password: "Trabajador123!",
            user: {
              uid: "demo-worker",
              email: "trabajador@eventos.test",
              nombre: "María López",
              role: "trabajador",
              workerId: "w-demo-1",
              perfilCompleto: true,
              habilitado: true,
            },
          },
        ],
        changeLog: [],
      };
      localStorage.setItem("spe-demo-store-v1", JSON.stringify(state));
    });
  }

  // Públicas
  await shot({ file: "01-login.png", path: "/login", waitMs: 2000 });
  await shot({ file: "02-unirse.png", path: "/unirse" });
  await shot({ file: "03-ayuda-publica.png", path: "/ayuda" });

  // Admin
  await login("admin@eventos.test", "Admin123!");
  const adminRoutes: Array<[string, string]> = [
    ["04-panel-admin.png", "/panel"],
    ["05-configuracion.png", "/configuracion"],
    ["06-personal.png", "/personal"],
    ["07-cuentas.png", "/cuentas"],
    ["08-qr-sitios.png", "/qr-sitios"],
    ["09-turnos-admin.png", "/turnos"],
    ["10-mapa.png", "/mapa"],
    ["11-reportes.png", "/reportes"],
    ["12-nomina.png", "/nomina"],
    ["13-notificaciones.png", "/notificaciones"],
    ["14-integraciones.png", "/integraciones"],
  ];
  for (const [file, path] of adminRoutes) {
    await shot({ file, path, waitMs: 1500 });
  }

  // Master
  await login("master@eventos.test", "Master123!");
  await shot({ file: "15-master-panel.png", path: "/master", waitMs: 1500 });
  await shot({ file: "16-master-informes.png", path: "/master/informes" });
  await shot({ file: "17-master-auditoria.png", path: "/master/auditoria" });

  // Trabajador
  await browser.close();
  const workerBrowser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const workerPage = await workerBrowser.newPage();
  await workerPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await seedWorkerSession(workerPage);
  await workerPage.goto(`${BASE}/worker`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  await workerPage.screenshot({ path: resolve(OUT, "18-worker-inicio.png") });
  console.log("+ 18-worker-inicio.png");

  for (const [file, path] of [
    ["19-worker-turnos.png", "/worker/turnos"],
    ["20-worker-entrada.png", "/worker/entrada"],
    ["21-worker-reportar.png", "/worker/reportar"],
  ] as const) {
    await workerPage.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await workerPage.screenshot({ path: resolve(OUT, file) });
    console.log(`+ ${file}`);
  }

  await workerBrowser.close();
  console.log(`\n✓ Capturas en ${OUT}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
