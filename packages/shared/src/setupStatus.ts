import { getRuntimeGoogleMapsApiKey } from "./runtimeBootstrap";

export interface SetupCompletadoFlags {
  firebaseSecrets?: boolean;
  googleMaps?: boolean;
  cuentasPlataforma?: boolean;
  fcm?: boolean;
}

export interface SetupStatusInput {
  backend?: "firebase";
  demoMode?: boolean;
  setupCompletado?: SetupCompletadoFlags;
  /** Claves Firebase embebidas en build (VITE_*). */
  firebaseApiKey?: string;
  vapidKey?: string;
}

export interface ResolvedSetupStatus {
  backend: "firebase";
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
    case "firebase-secrets":
    case "firebase-login":
      return status.firebaseSecretsReady;
    case "firestore-deploy":
      return false;
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
  const firebaseFromBuild = isRealFirebaseKey(input.firebaseApiKey);
  const mapsFromRuntime = getRuntimeGoogleMapsApiKey().trim().length > 10;

  const firebaseSecretsReady =
    flags.firebaseSecrets === true || firebaseFromBuild || input.backend === "firebase";
  const mapsReady = flags.googleMaps === true || mapsFromRuntime;
  const fcmReady = flags.fcm === true || isRealFirebaseKey(input.vapidKey);
  const productionLive = firebaseSecretsReady;

  return {
    backend: "firebase",
    firebaseSecretsReady,
    mapsReady,
    fcmReady,
    productionLive,
  };
}
