import {
  DEFAULT_CANONICAL_APP_URL,
  buildInvitationLinks,
  buildWorkerActivationUrl,
  buildWorkerJoinUrl,
  formatQrJoinUrl,
  needsHashRouter,
} from "@spe/shared";
import { isNativePlatform } from "./platform";
import { isElectron } from "./platform";

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/**
 * Base pública para enlaces escaneables / compartibles.
 * En localhost, file:// o shell embebido usa la URL canónica de Pages
 * para que un teléfono pueda abrir el enlace (no `localhost`).
 */
function resolveAppBase(appBaseUrl?: string): string {
  if (appBaseUrl) return normalizeBase(appBaseUrl);
  if (import.meta.env.VITE_APP_URL) return normalizeBase(import.meta.env.VITE_APP_URL);
  // Compatibilidad con despliegues antiguos
  if (import.meta.env.VITE_WORKER_APP_URL) {
    return normalizeBase(import.meta.env.VITE_WORKER_APP_URL);
  }
  if (typeof window !== "undefined") {
    if (needsHashRouter()) {
      return normalizeBase(DEFAULT_CANONICAL_APP_URL);
    }
    const base = import.meta.env.BASE_URL || "/";
    return normalizeBase(`${window.location.origin}${base}`);
  }
  return normalizeBase(DEFAULT_CANONICAL_APP_URL);
}

/** ¿La base usa HashRouter (localhost / file / Capacitor)? */
function useHashRouterForBase(base: string): boolean {
  try {
    const u = new URL(base);
    if (u.protocol === "file:") return true;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    return false;
  } catch {
    return isElectron() || isNativePlatform() || needsHashRouter();
  }
}

/** URL embebida en el QR de sitio (abre alta de usuario + puesto). */
export function buildSiteQrJoinUrl(qrId: string, token: string, appBaseUrl?: string): string {
  const base = resolveAppBase(appBaseUrl);
  return formatQrJoinUrl(base, qrId, token, {
    useHashRouter: useHashRouterForBase(base),
  });
}

/** URL de activación (web o app nativa). Rutas en la raíz: /activar/:token */
export function buildActivationUrl(token: string, appBaseUrl?: string): string {
  const base = resolveAppBase(appBaseUrl);
  return buildWorkerActivationUrl(token, base, {
    useHashRouter: useHashRouterForBase(base),
  });
}

/** Enlaces completos para invitaciones (web + Android + registro manual). */
export function buildInvitationUrls(token: string, appBaseUrl?: string) {
  return buildInvitationLinks(token, resolveAppBase(appBaseUrl));
}

export function buildJoinUrl(appBaseUrl?: string): string {
  const base = resolveAppBase(appBaseUrl);
  return buildWorkerJoinUrl(base, {
    useHashRouter: useHashRouterForBase(base),
  });
}
