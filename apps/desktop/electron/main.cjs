const { app, BrowserWindow, net } = require("electron");
const path = require("node:path");

const isDev = process.env.ELECTRON_DEV === "1";

/** Misma base de datos Firebase que la web — sincronización en tiempo real vía Firestore. */
const REMOTE_APP_URL =
  process.env.SPE_REMOTE_URL ||
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

/**
 * Sync automático de UI:
 * - Default: carga GitHub Pages (siempre la última versión publicada).
 * - SPE_REMOTE=0: fuerza bundle embebido (offline).
 * - Sin red: fallback al bundle embebido.
 */
const FORCE_OFFLINE_BUNDLE = process.env.SPE_REMOTE === "0";
const FORCE_REMOTE = process.env.SPE_REMOTE === "1";

function resolveIndexHtml() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web", "index.html");
  }
  return path.join(__dirname, "..", "..", "admin", "dist", "index.html");
}

function canReachRemote(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    try {
      const request = net.request({ url, method: "GET" });
      const timer = setTimeout(() => {
        try {
          request.abort();
        } catch {
          /* ignore */
        }
        done(false);
      }, timeoutMs);
      request.on("response", (response) => {
        clearTimeout(timer);
        done(response.statusCode >= 200 && response.statusCode < 500);
      });
      request.on("error", () => {
        clearTimeout(timer);
        done(false);
      });
      request.end();
    } catch {
      done(false);
    }
  });
}

async function loadApp(win) {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  if (FORCE_OFFLINE_BUNDLE) {
    await win.loadFile(resolveIndexHtml());
    return;
  }

  const preferRemote = FORCE_REMOTE || !FORCE_OFFLINE_BUNDLE;
  if (preferRemote) {
    const online = await canReachRemote(REMOTE_APP_URL);
    if (online) {
      await win.loadURL(REMOTE_APP_URL);
      return;
    }
  }

  await win.loadFile(resolveIndexHtml());
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 360,
    minHeight: 480,
    title: "SPE Eventos",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  void loadApp(win);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
