import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** Garantiza Admin SDK listo antes de getFirestore/getAuth (carga de módulos). */
export function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

ensureAdminApp();

export const db = getFirestore();
