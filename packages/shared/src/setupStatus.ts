import { getRuntimeGoogleMapsApiKey } from "./runtimeBootstrap";

export interface SetupCompletadoFlags {
  sheetsBackend?: boolean;
  firebaseSecrets?: boolean;
  googleMaps?: boolean;
  cuentasPlataforma?: boolean;
  fcm?: boolean;
}

export interface SetupStatusInput {
  backend?: "demo" | "firebase" | "sheets";
  demoMode?: boolean;
  setupCompletado?: SetupCompletadoFlags;
  /** Claves Firebase embebidas en build (VITE_*). */
  firebaseApiKey?: string;
  vapidKey?: string;
}

export interface ResolvedSetupStatus {
  backend: "demo" | "firebase" | "sheets";
  sheetsReady: boolean;
  firebaseSecretsReady: boolean;
  mapsReady: boolean;
  fcmReady: boolean;
  productionLive: boolean;
}

const DEMO_FIREBASE_KEYS = new Set(["", "demo-api-key", "demo-personal-eventos"]);

function isRealFirebaseKey(value: string | undefined): boolean {
  const v = value?.trim() ?? "";
  return v.length > 8 && !DEMO_FIREBASE_KEYS.has(v);
}

/** IDs de pasos/checklist que ya no deben mostrarse como pendientes. */
export function isSetupItemDone(
  itemId: string,
  status: ResolvedSetupStatus,
): boolean {
  switch (itemId) {
    case "login-demo":
      return status.productionLive;
    case "sheets-backend":
    case "clasp-push":
      return status.sheetsReady;
    case "firebase-secrets":
      return status.firebaseSecretsReady;
    case "maps":
      return status.mapsReady;
    case "fcm":
      return status.fcmReady;
    case "pendientes-guia":
      return false;
    case "descargas":
    case "releases":
    case "ci-status":
    case "integraciones":
      return false;
    default:
      return false;
  }
}

export function resolveSetupStatus(input: SetupStatusInput = {}): ResolvedSetupStatus {
  const flags = input.setupCompletado ?? {};
  const backend = input.backend ?? (input.demoMode ? "demo" : "sheets");
  const firebaseFromBuild = isRealFirebaseKey(input.firebaseApiKey);
  const mapsFromRuntime = getRuntimeGoogleMapsApiKey().trim().length > 10;

  const sheetsReady =
    flags.sheetsBackend === true || (backend === "sheets" && input.demoMode !== true);
  const firebaseSecretsReady =
    flags.firebaseSecrets === true || firebaseFromBuild || backend === "firebase";
  const mapsReady = flags.googleMaps === true || mapsFromRuntime;
  const fcmReady = flags.fcm === true || isRealFirebaseKey(input.vapidKey);
  const productionLive = sheetsReady || firebaseSecretsReady;

  return {
    backend,
    sheetsReady,
    firebaseSecretsReady,
    mapsReady,
    fcmReady,
    productionLive,
  };
}
