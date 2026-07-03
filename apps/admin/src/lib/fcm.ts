import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";
import { getFirebaseApp } from "@spe/shared";
import { DEMO_MODE } from "./mode";
import { saveFcmToken } from "../hooks/useNotifications";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let messaging: Messaging | null = null;

export async function initPushNotifications(uid: string): Promise<string | null> {
  if (DEMO_MODE || !VAPID_KEY) return null;

  const supported = await isSupported();
  if (!supported) return null;

  try {
    messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await saveFcmToken(uid, token);
    }
    return token;
  } catch {
    return null;
  }
}

export function pushAvailable(): boolean {
  return !DEMO_MODE && Boolean(VAPID_KEY);
}
