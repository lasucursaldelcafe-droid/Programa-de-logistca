import {
  buildInvitationLinks,
  buildWorkerActivationUrl,
  buildWorkerJoinUrl,
} from "@spe/shared";
import { isNativePlatform } from "./platform";
import { isElectron } from "./platform";

function resolveAppBase(appBaseUrl?: string): string {
  if (appBaseUrl) return appBaseUrl;
  if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL;
  // Compatibilidad con despliegues antiguos
  if (import.meta.env.VITE_WORKER_APP_URL) return import.meta.env.VITE_WORKER_APP_URL;
  if (typeof window !== "undefined") {
    const base = import.meta.env.BASE_URL || "/";
    return `${window.location.origin}${base.endsWith("/") ? base : `${base}/`}`;
  }
  return "/";
}

/** URL de activación (web o app nativa). Rutas en la raíz: /activar/:token */
export function buildActivationUrl(token: string, appBaseUrl?: string): string {
  const base = resolveAppBase(appBaseUrl);
  const useHash = isElectron() || isNativePlatform();
  return buildWorkerActivationUrl(token, base, { useHashRouter: useHash });
}

/** Enlaces completos para invitaciones (web + Android + registro manual). */
export function buildInvitationUrls(token: string, appBaseUrl?: string) {
  return buildInvitationLinks(token, resolveAppBase(appBaseUrl));
}

export function buildJoinUrl(appBaseUrl?: string): string {
  const base = resolveAppBase(appBaseUrl);
  const useHash = isElectron() || isNativePlatform();
  return buildWorkerJoinUrl(base, { useHashRouter: useHash });
}
