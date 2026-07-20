/** Detecta si la app corre embebida (file://, Capacitor localhost) vs web remota. */

export const DEFAULT_CANONICAL_APP_URL =
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

export function isEmbeddedAppShell(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location;
  if (protocol === "file:") return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return false;
}

export function needsHashRouter(): boolean {
  return isEmbeddedAppShell();
}

export function resolveCanonicalConfigUrl(fallbackBase = DEFAULT_CANONICAL_APP_URL): string {
  const base =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SPE_CANONICAL_URL) ||
    fallbackBase;
  return `${base.replace(/\/?$/, "/")}spe-runtime-config.json`;
}
