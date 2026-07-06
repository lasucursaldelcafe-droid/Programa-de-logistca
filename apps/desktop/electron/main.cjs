const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const isDev = process.env.ELECTRON_DEV === "1";

/** Misma URL que Android/Web para compartir datos (localStorage) entre plataformas. */
const REMOTE_APP_URL =
  process.env.SPE_REMOTE_URL ||
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

/** Usar bundle local empaquetado (sin sincronizar con la web). */
const USE_OFFLINE_BUNDLE = process.env.SPE_OFFLINE === "1";

function resolveIndexHtml() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web", "index.html");
  }
  return path.join(__dirname, "..", "..", "admin", "dist", "index.html");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: "SPE Eventos",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else if (!USE_OFFLINE_BUNDLE) {
    win.loadURL(REMOTE_APP_URL);
  } else {
    win.loadFile(resolveIndexHtml());
  }
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
