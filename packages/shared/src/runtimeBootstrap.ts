import { configureFirebase, isFirebaseConfigured, type FirebaseClientConfig } from "./firebase";
import {
  clearSheetsClient,
  configureSheetsClient,
  isSheetsBackendConfigured,
  sheetsHealth,
} from "./sheetsClient";

export type EffectiveBackend = "demo" | "firebase" | "sheets";

export interface RuntimeBootstrapConfig {
  backend?: EffectiveBackend;
  demoMode?: boolean;
  sheetsWebAppUrl?: string;
  sheetsApiToken?: string;
  googleMapsApiKey?: string;
  firebase?: Partial<FirebaseClientConfig>;
}

const STORAGE_KEY = "spe-runtime-config-v1";

interface RuntimeState {
  backend: EffectiveBackend | null;
  demoMode: boolean | null;
}

const runtime: RuntimeState = {
  backend: null,
  demoMode: null,
};

let runtimeGoogleMapsApiKey: string | null = null;

function setGoogleMapsApiKey(value: string | undefined): void {
  const trimmed = value?.trim() ?? "";
  runtimeGoogleMapsApiKey = trimmed.length > 0 ? trimmed : null;
}

export function getRuntimeGoogleMapsApiKey(): string {
  return runtimeGoogleMapsApiKey ?? "";
}

function normalizeBackend(value: string | undefined): EffectiveBackend | null {
  if (value === "demo" || value === "firebase" || value === "sheets") return value;
  return null;
}

function applyConfig(config: RuntimeBootstrapConfig): void {
  if (config.googleMapsApiKey) setGoogleMapsApiKey(config.googleMapsApiKey);

  if (config.backend === "demo" || config.demoMode === true) {
    runtime.backend = "demo";
    runtime.demoMode = true;
    return;
  }

  if (typeof config.demoMode === "boolean") runtime.demoMode = config.demoMode;

  const hasFirebase =
    !!config.firebase && Object.keys(config.firebase).filter((k) => config.firebase?.[k as keyof FirebaseClientConfig]).length > 0;

  if (hasFirebase) {
    configureFirebase({ ...config.firebase, useEmulators: false });
    runtime.backend = "firebase";
    runtime.demoMode = false;
  }

  const sheetsUrl = config.sheetsWebAppUrl?.trim() ?? "";
  const sheetsToken = config.sheetsApiToken?.trim() ?? "";
  if (sheetsUrl && sheetsToken) {
    configureSheetsClient(sheetsUrl, sheetsToken);
    runtime.backend = "sheets";
    runtime.demoMode = false;
  } else if (config.backend === "firebase" && !hasFirebase) {
    /* Config guardada incompleta — no forzar Firebase sin credenciales */
  } else if (config.backend && hasFirebase) {
    runtime.backend = config.backend;
  } else if (config.backend === "sheets" && sheetsUrl && sheetsToken) {
    runtime.backend = "sheets";
  }
}

function parseFromUrl(): RuntimeBootstrapConfig | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.includes("?")
    ? window.location.hash.slice(window.location.hash.indexOf("?") + 1)
    : "";
  const hashParams = new URLSearchParams(hashQuery);

  const backend = normalizeBackend(params.get("spe_backend") ?? hashParams.get("spe_backend") ?? undefined);
  const sheetsUrl =
    params.get("spe_url") ?? hashParams.get("spe_url") ?? params.get("u") ?? hashParams.get("u") ?? undefined;
  const sheetsToken =
    params.get("spe_token") ?? hashParams.get("spe_token") ?? params.get("t") ?? hashParams.get("t") ?? undefined;

  if (!backend && !sheetsUrl && !sheetsToken) return null;

  return {
    backend: backend ?? (sheetsUrl && sheetsToken ? "sheets" : undefined),
    demoMode: backend === "demo" ? true : sheetsUrl && sheetsToken ? false : undefined,
    sheetsWebAppUrl: sheetsUrl,
    sheetsApiToken: sheetsToken,
  };
}

function loadStored(): RuntimeBootstrapConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RuntimeBootstrapConfig;
  } catch {
    return null;
  }
}

export function saveRuntimeConfig(config: RuntimeBootstrapConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  applyConfig(config);
}

export function clearRuntimeConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  runtime.backend = null;
  runtime.demoMode = null;
  clearSheetsClient();
}

function persistDemoMode(): void {
  runtime.backend = "demo";
  runtime.demoMode = true;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ backend: "demo", demoMode: true }));
  }
  clearSheetsClient();
}

/** Vuelve al modo demo (GitHub Pages sin backend real). */
export function resetToDemoMode(): void {
  persistDemoMode();
}

function reconcileBuildDemoFallback(buildEnv: { demoMode?: boolean }): void {
  if (buildEnv.demoMode !== true) return;

  if (runtime.backend === "firebase" && !isFirebaseConfigured()) {
    persistDemoMode();
    return;
  }

  if (runtime.backend === "sheets" && !isSheetsBackendConfigured()) {
    persistDemoMode();
    return;
  }

  if (runtime.backend === null) {
    persistDemoMode();
  }
}

export function getRuntimeBackendLabel(
  buildEnv: { demoMode?: boolean; dataBackend?: string } = {},
): string {
  const b = getEffectiveBackend(buildEnv);
  if (b === "demo") return "demo (navegador)";
  if (b === "sheets") return "Google Sheets";
  return "Firebase";
}

/** Parsea texto pegado desde correo / CREDENCIALES-SHEETS-AUTO.txt */
export function parseBootstrapText(text: string): RuntimeBootstrapConfig | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const json = JSON.parse(trimmed) as RuntimeBootstrapConfig & {
      webAppUrl?: string;
      apiToken?: string;
      VITE_SHEETS_WEB_APP_URL?: string;
      VITE_SHEETS_API_TOKEN?: string;
      VITE_DATA_BACKEND?: string;
    };
    return {
      backend: normalizeBackend(json.backend ?? json.VITE_DATA_BACKEND) ?? undefined,
      demoMode: json.demoMode,
      sheetsWebAppUrl: json.sheetsWebAppUrl ?? json.webAppUrl ?? json.VITE_SHEETS_WEB_APP_URL,
      sheetsApiToken: json.sheetsApiToken ?? json.apiToken ?? json.VITE_SHEETS_API_TOKEN,
      firebase: json.firebase,
    };
  } catch {
    /* texto libre */
  }

  const urlMatch = trimmed.match(/(?:Web App URL|VITE_SHEETS_WEB_APP_URL)[=:\s]*?(https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec)/i);
  const tokenMatch = trimmed.match(/(?:API Token|VITE_SHEETS_API_TOKEN|Token)[=:\s]*([a-f0-9]{16,})/i);
  if (!urlMatch?.[1] || !tokenMatch?.[1]) return null;

  return {
    backend: "sheets",
    demoMode: false,
    sheetsWebAppUrl: urlMatch[1],
    sheetsApiToken: tokenMatch[1],
  };
}

export async function bootstrapRuntimeConfig(
  baseUrl: string,
  buildEnv: {
    demoMode?: boolean;
    dataBackend?: string;
    sheetsUrl?: string;
    sheetsToken?: string;
  } = {},
): Promise<void> {
  const buildBackend = buildEnv.dataBackend?.trim();
  const buildSheetsUrl = buildEnv.sheetsUrl?.trim() ?? "";
  const buildSheetsToken = buildEnv.sheetsToken?.trim() ?? "";

  if (buildBackend === "sheets" && buildSheetsUrl && buildSheetsToken) {
    configureSheetsClient(buildSheetsUrl, buildSheetsToken);
    runtime.backend = "sheets";
    runtime.demoMode = false;
    return;
  }

  const fromUrl = parseFromUrl();
  if (fromUrl) {
    applyConfig(fromUrl);
    saveRuntimeConfig(fromUrl);
  } else {
    const stored = loadStored();
    if (stored) applyConfig(stored);
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/?$/, "/")}spe-runtime-config.json`, {
      cache: "no-store",
    });
    if (res.ok) {
      const remote = (await res.json()) as RuntimeBootstrapConfig;
      if (remote.googleMapsApiKey) setGoogleMapsApiKey(remote.googleMapsApiKey);
      if (remote.backend === "demo" || remote.demoMode === true) {
        persistDemoMode();
      } else if (remote.sheetsWebAppUrl && remote.sheetsApiToken) {
        applyConfig(remote);
      } else if (remote.backend === "firebase" && remote.firebase) {
        applyConfig(remote);
      } else if (remote.googleMapsApiKey) {
        applyConfig(remote);
      }
    }
  } catch {
    /* sin archivo remoto */
  }

  if (runtime.backend === "sheets" && isSheetsBackendConfigured()) {
    try {
      const health = await sheetsHealth();
      if (!health.ok) {
        if (buildEnv.demoMode === true) {
          persistDemoMode();
        } else {
          clearRuntimeConfig();
        }
      }
    } catch {
      if (buildEnv.demoMode === true) {
        persistDemoMode();
      } else {
        clearRuntimeConfig();
      }
    }
  }

  reconcileBuildDemoFallback(buildEnv);
}

export function getEffectiveBackend(
  buildEnv: { demoMode?: boolean; dataBackend?: string } = {},
): EffectiveBackend {
  if (runtime.backend === "sheets" && !isSheetsBackendConfigured()) {
    return buildEnv.demoMode === true ? "demo" : "firebase";
  }
  if (runtime.backend === "firebase" && !isFirebaseConfigured()) {
    return buildEnv.demoMode === true ? "demo" : "firebase";
  }
  if (runtime.backend) return runtime.backend;
  if (buildEnv.demoMode === true || buildEnv.dataBackend === "demo") return "demo";
  if (buildEnv.dataBackend === "sheets" && isSheetsBackendConfigured()) return "sheets";
  if (buildEnv.dataBackend === "sheets") return "firebase";
  if (!isFirebaseConfigured()) return "demo";
  return "firebase";
}

export function isEffectiveDemoMode(
  buildEnv: { demoMode?: boolean; dataBackend?: string } = {},
): boolean {
  if (getEffectiveBackend(buildEnv) === "demo") return true;
  if (runtime.demoMode !== null) return runtime.demoMode;
  return false;
}

export function isEffectiveSheetsBackend(
  buildEnv: { dataBackend?: string } = {},
): boolean {
  return getEffectiveBackend(buildEnv) === "sheets" && isSheetsBackendConfigured();
}
