import { configureFirebase, isFirebaseConfigured, type FirebaseClientConfig } from "./firebase";
import {
  isEmbeddedAppShell,
  resolveCanonicalConfigUrl,
} from "./platformShell";

export type EffectiveBackend = "firebase";

export interface RuntimeBootstrapConfig {
  backend?: EffectiveBackend;
  demoMode?: boolean;
  googleMapsApiKey?: string;
  canonicalAppUrl?: string;
  firebase?: Partial<FirebaseClientConfig>;
  setupCompletado?: {
    firebaseSecrets?: boolean;
    googleMaps?: boolean;
    cuentasPlataforma?: boolean;
    fcm?: boolean;
  };
}

const STORAGE_KEY = "spe-runtime-config-v2";
const LEGACY_STORAGE_KEYS = [
  "spe-runtime-config-v1",
  "spe-demo-store-v1",
  "spe-demo-integrations-v1",
  "spe-sidebar-sections-v1",
] as const;

const LEGACY_SESSION_KEYS = ["spe-sheets-session"] as const;

/** Elimina config Sheets/demo guardada en navegadores con builds anteriores. */
export function purgeLegacyClientStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    for (const key of LEGACY_SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { backend?: string; demoMode?: boolean };
      if (parsed.backend === "sheets" || parsed.backend === "demo" || parsed.demoMode === true) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    /* ignore */
  }
}

interface RuntimeState {
  backend: EffectiveBackend | null;
}

const runtime: RuntimeState = {
  backend: null,
};

let runtimeGoogleMapsApiKey: string | null = null;

interface SetupCompletadoRuntime {
  firebaseSecrets?: boolean;
  googleMaps?: boolean;
  cuentasPlataforma?: boolean;
  fcm?: boolean;
}

let runtimeSetupCompletado: SetupCompletadoRuntime = {};

export function getRuntimeSetupCompletado(): SetupCompletadoRuntime {
  return runtimeSetupCompletado;
}

function setGoogleMapsApiKey(value: string | undefined): void {
  const trimmed = value?.trim() ?? "";
  runtimeGoogleMapsApiKey = trimmed.length > 0 ? trimmed : null;
}

export function getRuntimeGoogleMapsApiKey(): string {
  return runtimeGoogleMapsApiKey ?? "";
}

function applyConfig(config: RuntimeBootstrapConfig): void {
  if (config.setupCompletado) {
    runtimeSetupCompletado = { ...runtimeSetupCompletado, ...config.setupCompletado };
  }
  if (config.googleMapsApiKey) setGoogleMapsApiKey(config.googleMapsApiKey);

  const hasFirebase =
    !!config.firebase &&
    Object.keys(config.firebase).filter((k) => config.firebase?.[k as keyof FirebaseClientConfig]).length > 0;

  if (hasFirebase) {
    configureFirebase({ ...config.firebase, useEmulators: false });
  }

  runtime.backend = "firebase";
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, backend: "firebase", demoMode: false }));
  applyConfig(config);
}

export function clearRuntimeConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  runtime.backend = null;
}

/** @deprecated Modo demo eliminado — limpia config runtime guardada. */
export function resetToDemoMode(): void {
  clearRuntimeConfig();
}

export function getRuntimeBackendLabel(
  _buildEnv: { demoMode?: boolean; dataBackend?: string } = {},
): string {
  return isFirebaseConfigured() ? "Firebase" : "Firebase (sin credenciales)";
}

/** Parsea texto pegado con credenciales Firebase (JSON). */
export function parseBootstrapText(text: string): RuntimeBootstrapConfig | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const json = JSON.parse(trimmed) as RuntimeBootstrapConfig & {
      VITE_FIREBASE_API_KEY?: string;
      VITE_FIREBASE_AUTH_DOMAIN?: string;
      VITE_FIREBASE_PROJECT_ID?: string;
      VITE_FIREBASE_STORAGE_BUCKET?: string;
      VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
      VITE_FIREBASE_APP_ID?: string;
    };
    const fb = json.firebase ?? {};
    return {
      backend: "firebase",
      demoMode: false,
      firebase: {
        apiKey: fb.apiKey ?? json.VITE_FIREBASE_API_KEY,
        authDomain: fb.authDomain ?? json.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: fb.projectId ?? json.VITE_FIREBASE_PROJECT_ID,
        storageBucket: fb.storageBucket ?? json.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: fb.messagingSenderId ?? json.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: fb.appId ?? json.VITE_FIREBASE_APP_ID,
      },
    };
  } catch {
    return null;
  }
}

export async function bootstrapRuntimeConfig(
  baseUrl: string,
  buildEnv: {
    demoMode?: boolean;
    dataBackend?: string;
  } = {},
): Promise<void> {
  void buildEnv;
  purgeLegacyClientStorage();
  runtime.backend = "firebase";

  const stored = loadStored();
  if (stored) applyConfig({ ...stored, backend: "firebase", demoMode: false });

  const configUrls = [
    `${baseUrl.replace(/\/?$/, "/")}spe-runtime-config.json`,
  ];
  if (isEmbeddedAppShell()) {
    configUrls.push(resolveCanonicalConfigUrl());
  }

  let remoteCanonical: string | undefined;

  for (const url of configUrls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const remote = (await res.json()) as RuntimeBootstrapConfig;
      if (remote.canonicalAppUrl) remoteCanonical = remote.canonicalAppUrl;
      applyConfig({ ...remote, backend: "firebase", demoMode: false });
      if (isFirebaseConfigured()) break;
    } catch {
      /* intentar siguiente URL */
    }
  }

  if (!isFirebaseConfigured() && isEmbeddedAppShell() && remoteCanonical) {
    try {
      const res = await fetch(
        `${remoteCanonical.replace(/\/?$/, "/")}spe-runtime-config.json`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const remote = (await res.json()) as RuntimeBootstrapConfig;
        applyConfig({ ...remote, backend: "firebase", demoMode: false });
      }
    } catch {
      /* sin config remota */
    }
  }
}

export function getEffectiveBackend(
  _buildEnv: { demoMode?: boolean; dataBackend?: string } = {},
): EffectiveBackend {
  void _buildEnv;
  return "firebase";
}

export function isEffectiveDemoMode(
  _buildEnv: { demoMode?: boolean; dataBackend?: string } = {},
): boolean {
  void _buildEnv;
  return false;
}

export function isEffectiveSheetsBackend(
  _buildEnv: { dataBackend?: string } = {},
): boolean {
  void _buildEnv;
  return false;
}
