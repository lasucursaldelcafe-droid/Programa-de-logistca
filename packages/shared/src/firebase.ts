import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulators?: boolean;
}

const DEFAULT_CONFIG: FirebaseClientConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-personal-eventos.firebaseapp.com",
  projectId: "demo-personal-eventos",
  storageBucket: "demo-personal-eventos.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demo",
  useEmulators: true,
};

const PLACEHOLDER_API_KEYS = new Set(["", "demo-api-key"]);

const UNCONFIGURED_PRODUCTION: FirebaseClientConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  useEmulators: false,
};

let clientConfig: FirebaseClientConfig = DEFAULT_CONFIG;
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let emulatorsConnected = false;

export function isFirebaseConfigured(): boolean {
  const key = clientConfig.apiKey?.trim() ?? "";
  return !PLACEHOLDER_API_KEYS.has(key);
}

export function configureFirebase(config: Partial<FirebaseClientConfig>): void {
  const cleaned = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<FirebaseClientConfig>;

  const useEmulators = cleaned.useEmulators ?? DEFAULT_CONFIG.useEmulators;
  const hasRealApiKey =
    typeof cleaned.apiKey === "string" && !PLACEHOLDER_API_KEYS.has(cleaned.apiKey.trim());

  if (!hasRealApiKey && useEmulators === false) {
    clientConfig = UNCONFIGURED_PRODUCTION;
    return;
  }

  clientConfig = { ...DEFAULT_CONFIG, ...cleaned };
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase no está configurado en este despliegue.");
  }
  if (!app) {
    const { useEmulators: _u, ...firebaseConfig } = clientConfig;
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  connectEmulatorsIfNeeded();
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  connectEmulatorsIfNeeded();
  return db;
}

function connectEmulatorsIfNeeded(): void {
  if (emulatorsConnected) return;
  if (!clientConfig.useEmulators) return;
  try {
    connectAuthEmulator(getFirebaseAuth(), "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(getFirestoreDb(), "127.0.0.1", 8080);
    emulatorsConnected = true;
  } catch {
    emulatorsConnected = true;
  }
}
