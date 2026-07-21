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

function appBasePath(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

function registerForegroundHandler(messagingInstance: Messaging): void {
  if (foregroundHandlerRegistered) return;
  foregroundHandlerRegistered = true;

  onMessage(messagingInstance, (payload) => {
    const title = payload.notification?.title ?? "Personal Eventos";
    const body = payload.notification?.body ?? "";
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: `${appBasePath()}favicon.ico` });
    }
  });
}

export type PushPermissionState = NotificationPermission | "unsupported";

/** Estado del permiso de notificaciones del navegador. */
export function pushPermissionState(): PushPermissionState {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return undefined;
  const base = appBasePath();
  try {
    return await navigator.serviceWorker.register(`${base}firebase-messaging-sw.js`, {
      scope: base,
    });
  } catch {
    return undefined;
  }
}

export async function initPushNotifications(
  uid: string,
  options?: { requestPermission?: boolean },
): Promise<string | null> {
  const vapidKey = resolveVapidKey();
  if (DEMO_MODE || !vapidKey || !uid.trim()) return null;

  const supported = await isSupported();
  if (!supported) return null;

  try {
    if (typeof Notification === "undefined") return null;

    // En login no pedimos permiso automáticamente: el banner «Activar avisos» lo hace.
    if (Notification.permission === "default" && !options?.requestPermission) {
      return null;
    }
    if (Notification.permission === "denied") return null;

    const permitted =
      Notification.permission === "granted" ||
      (options?.requestPermission ? await ensureNotificationPermission() : false);
    if (!permitted) return null;

    messaging = getMessaging(getFirebaseApp());
    registerForegroundHandler(messaging);

    const swRegistration = await ensureMessagingServiceWorker();
    const token = await getToken(messaging, {
      vapidKey,
      ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
    });
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
