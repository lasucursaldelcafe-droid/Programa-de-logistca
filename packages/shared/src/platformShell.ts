/** Detecta si la app corre embebida (file://, Capacitor localhost) vs web remota. */

export const DEFAULT_CANONICAL_APP_URL =
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

const LIVE_REDIRECT_KEY = "spe-live-ui-redirect";

export function isEmbeddedAppShell(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location;
  if (protocol === "file:") return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return false;
}

/** Capacitor nativo o Electron con bundle file:// — no incluye Vite en localhost. */
export function isPackagedNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.protocol === "file:") return true;
  try {
    const cap = (
      window as Window & {
        Capacitor?: { isNativePlatform?: () => boolean };
      }
    ).Capacitor;
    if (typeof cap?.isNativePlatform === "function" && cap.isNativePlatform()) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function needsHashRouter(): boolean {
  return isEmbeddedAppShell();
}

export function resolveCanonicalAppUrl(fallbackBase = DEFAULT_CANONICAL_APP_URL): string {
  const fromEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SPE_CANONICAL_URL
      : undefined;
  const base = (fromEnv?.trim() || fallbackBase).replace(/\/?$/, "/");
  return base;
}

export function resolveCanonicalConfigUrl(fallbackBase = DEFAULT_CANONICAL_APP_URL): string {
  return `${resolveCanonicalAppUrl(fallbackBase)}spe-runtime-config.json`;
}

/**
 * Shells empaquetados (APK / Electron offline) saltan a GitHub Pages cuando hay red
 * para usar siempre la UI publicada. No afecta `npm run dev` en localhost.
 */
export function redirectEmbeddedShellToLiveUi(canonicalAppUrl?: string): boolean {
  if (typeof window === "undefined") return false;
  if (!isPackagedNativeShell()) return false;

  try {
    if (sessionStorage.getItem(LIVE_REDIRECT_KEY) === "1") return false;
  } catch {
    /* private mode */
  }

  const target = (canonicalAppUrl?.trim() || resolveCanonicalAppUrl()).replace(/\/?$/, "/");
  try {
    const current = window.location.href;
    if (current.startsWith(target)) return false;
    sessionStorage.setItem(LIVE_REDIRECT_KEY, "1");
    window.location.replace(target);
    return true;
  } catch {
    return false;
  }
}
