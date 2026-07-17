import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { configureFirebase, configureSheetsClient } from "@spe/shared";
import { AuthProvider } from "@core/contexts/AuthContext";
import { isNativePlatform } from "@core/lib/platform";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "@core/index.css";

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

/** HashRouter evita pantalla en blanco en Capacitor/Android (file:// y rutas SPA). */
const useHashRouter = isNativePlatform();
const Router = useHashRouter ? HashRouter : BrowserRouter;
const routerProps = useHashRouter ? {} : { basename: import.meta.env.BASE_URL };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router {...routerProps}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);
