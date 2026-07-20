import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { getFirebaseApp, getRuntimeVapidKey } from "@spe/shared";
import { DEMO_MODE } from "./mode";
import { saveFcmToken } from "../hooks/useNotifications";

function resolveVapidKey(): string | undefined {
  const fromEnv = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim();
  const fromRuntime = getRuntimeVapidKey();
  return fromRuntime || undefined;
}

let messaging: Messaging | null = null;
let foregroundHandlerRegistered = false;

function registerForegroundHandler(messagingInstance: Messaging): void {
  if (foregroundHandlerRegistered) return;
  foregroundHandlerRegistered = true;

  onMessage(messagingInstance, (payload) => {
    const title = payload.notification?.title ?? "Personal Eventos";
    const body = payload.notification?.body ?? "";
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  });
}

export async function initPushNotifications(uid: string): Promise<string | null> {
  const vapidKey = resolveVapidKey();
  if (DEMO_MODE || !vapidKey) return null;

  const supported = await isSupported();
  if (!supported) return null;

  try {
    messaging = getMessaging(getFirebaseApp());
    registerForegroundHandler(messaging);
    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await saveFcmToken(uid, token);
    }
    return token;
  } catch {
    return null;
  }
}

export function pushAvailable(): boolean {
  return !DEMO_MODE && Boolean(resolveVapidKey());
}
