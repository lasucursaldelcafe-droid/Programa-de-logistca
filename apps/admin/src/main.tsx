import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { bootstrapRuntimeConfig, configureFirebase, configureSheetsClient, isEffectiveDemoMode } from "@spe/shared";
import { AuthProvider } from "./contexts/AuthContext";
import { App } from "./App";
import { demoStore } from "./demo/store";
import { isElectron, isNativePlatform } from "./lib/platform";
import "./index.css";

const buildEnv = {
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
  dataBackend: import.meta.env.VITE_DATA_BACKEND,
  sheetsUrl: import.meta.env.VITE_SHEETS_WEB_APP_URL,
  sheetsToken: import.meta.env.VITE_SHEETS_API_TOKEN,
};

configureFirebase({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  useEmulators: import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true",
});

if (import.meta.env.VITE_DATA_BACKEND === "sheets") {
  const url = import.meta.env.VITE_SHEETS_WEB_APP_URL?.trim() ?? "";
  const token = import.meta.env.VITE_SHEETS_API_TOKEN?.trim() ?? "";
  if (url && token) configureSheetsClient(url, token);
}

const Router = isElectron() || isNativePlatform() ? HashRouter : BrowserRouter;
const routerProps = isElectron() || isNativePlatform() ? {} : { basename: import.meta.env.BASE_URL };

async function boot() {
  await bootstrapRuntimeConfig(import.meta.env.BASE_URL, buildEnv);

  if (isEffectiveDemoMode(buildEnv)) {
    demoStore.purgeDemoEvents();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Router {...routerProps}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </StrictMode>,
  );
}

void boot();
