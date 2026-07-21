import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { bootstrapRuntimeConfig, configureFirebase, purgeLegacyClientStorage, needsHashRouter } from "@spe/shared";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { NativePermissionsGate } from "./components/NativePermissionsGate";
import { App } from "./App";
import "./index.css";

const buildEnv = {
  demoMode: false,
  dataBackend: import.meta.env.VITE_DATA_BACKEND ?? "firebase",
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

const Router = needsHashRouter() ? HashRouter : BrowserRouter;
const routerProps = needsHashRouter() ? {} : { basename: import.meta.env.BASE_URL };

async function boot() {
  purgeLegacyClientStorage();
  await bootstrapRuntimeConfig(import.meta.env.BASE_URL, buildEnv);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Router {...routerProps}>
        <AuthProvider>
          <PermissionsProvider>
            <NativePermissionsGate>
              <App />
            </NativePermissionsGate>
          </PermissionsProvider>
        </AuthProvider>
      </Router>
    </StrictMode>,
  );
}

void boot();
