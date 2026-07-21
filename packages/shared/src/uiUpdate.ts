import {
  isPackagedNativeShell,
  resolveCanonicalAppUrl,
  resolveCanonicalConfigUrl,
} from "./platformShell";

const DISMISSED_KEY = "spe-ui-version-dismissed";

/** Versión de UI con la que arrancó esta sesión (stamp de Pages). */
let bootUiVersion: string | null = null;

export function noteBootUiVersion(version: string | undefined | null): void {
  const v = version?.trim();
  if (!v || bootUiVersion) return;
  bootUiVersion = v;
}

export function getBootUiVersion(): string | null {
  return bootUiVersion;
}

/** PWA instalada, iOS “Añadir a inicio”, Capacitor o Electron empaquetado. */
export function isInstalledOrStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  if (isPackagedNativeShell()) return true;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  } catch {
    /* ignore */
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function resolveUiConfigUrls(baseUrl: string): string[] {
  const local = `${baseUrl.replace(/\/?$/, "/")}spe-runtime-config.json`;
  const urls = [local];
  const canonical = resolveCanonicalConfigUrl();
  if (canonical !== local) urls.push(canonical);
  if (isPackagedNativeShell()) {
    return [canonical, local];
  }
  return urls;
}

export async function fetchRemoteUiVersion(baseUrl: string): Promise<string | null> {
  for (const url of resolveUiConfigUrls(baseUrl)) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const remote = (await res.json()) as { uiVersion?: string };
      const v = remote.uiVersion?.trim();
      if (v) return v;
    } catch {
      /* siguiente URL */
    }
  }
  return null;
}

export function isUiVersionDismissed(version: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === version;
  } catch {
    return false;
  }
}

export function dismissUiVersion(version: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(DISMISSED_KEY, version);
  } catch {
    /* private mode */
  }
}

/** Recarga forzando a pedir de nuevo el HTML/assets publicados. */
export function applyUiUpdate(remoteVersion?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DISMISSED_KEY);
    sessionStorage.removeItem("spe-build-reloaded");
    sessionStorage.removeItem("spe-live-ui-redirect");
  } catch {
    /* ignore */
  }

  const stamp = remoteVersion?.trim() || String(Date.now());
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("_spe_v", stamp);
    window.location.replace(url.toString());
    return;
  } catch {
    /* fallback */
  }

  try {
    const live = resolveCanonicalAppUrl();
    if (isPackagedNativeShell() && !window.location.href.startsWith(live)) {
      window.location.replace(`${live}?_spe_v=${encodeURIComponent(stamp)}`);
      return;
    }
  } catch {
    /* ignore */
  }

  window.location.reload();
}
