import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
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
let nativeRegistrationBound = false;

function appBasePath(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

function faviconUrl(): string {
  return `${appBasePath()}favicon.ico`;
}

/** Registra el SW de FCM bajo el BASE_URL (GitHub Pages / subruta). */
async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return undefined;
  const base = appBasePath();
  const swUrl = `${base}firebase-messaging-sw.js`;
  try {
    return await navigator.serviceWorker.register(swUrl, { scope: base });
  } catch (err) {
    console.warn("No se pudo registrar el service worker de push:", err);
    return undefined;
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function isSafeNotificationLink(link: string): boolean {
  if (link.startsWith("/") && !link.startsWith("//")) return true;
  try {
    const u = new URL(link, window.location.href);
    if (u.origin === window.location.origin) return true;
    if (u.protocol === "https:" && u.hostname.endsWith(".github.io")) return true;
    return false;
  } catch {
    return false;
  }
}

function registerForegroundHandler(messagingInstance: Messaging): void {
  if (foregroundHandlerRegistered) return;
  foregroundHandlerRegistered = true;

  onMessage(messagingInstance, (payload) => {
    const title = payload.notification?.title ?? "Personal Eventos";
    const body = payload.notification?.body ?? "";
    const dataLink = payload.data?.link;
    const fcmLink = payload.fcmOptions?.link;
    const link = (typeof dataLink === "string" && dataLink) || (typeof fcmLink === "string" && fcmLink) || undefined;

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification(title, {
        body,
        icon: faviconUrl(),
        data: { link, ...(payload.data ?? {}) },
      });
      n.onclick = () => {
        window.focus();
        if (link && isSafeNotificationLink(link)) {
          try {
            window.location.assign(new URL(link, window.location.href).href);
          } catch {
            /* ignore */
          }
        }
        n.close();
      };
    }
  });
}

/** Guarda el token nativo (APK Capacitor) además del web FCM. */
async function bindNativePushRegistration(uid: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!Capacitor.isPluginAvailable("PushNotifications")) return;
  if (nativeRegistrationBound) return;
  nativeRegistrationBound = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    await PushNotifications.addListener("registration", (token) => {
      const value = token.value?.trim();
      if (value) void saveFcmToken(uid, value);
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.warn("Push nativo: error de registro", err);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = action.notification.data as Record<string, unknown> | undefined;
      const link = typeof data?.link === "string" ? data.link : undefined;
      if (link && isSafeNotificationLink(link)) {
        window.location.assign(link);
      }
    });

    const current = await PushNotifications.checkPermissions();
    const status =
      current.receive === "granted"
        ? current
        : await PushNotifications.requestPermissions();
    if (status.receive === "granted") {
      await PushNotifications.register();
    }
  } catch (err) {
    console.warn("Push nativo no disponible:", err);
  }
}

export async function initPushNotifications(uid: string): Promise<string | null> {
  const trimmedUid = uid.trim();
  if (!trimmedUid) return null;

  void bindNativePushRegistration(trimmedUid);

  const vapidKey = resolveVapidKey();
  if (DEMO_MODE || !vapidKey) return null;

  const supported = await isSupported();
  if (!supported) return null;

  try {
    const permitted = await ensureNotificationPermission();
    if (!permitted) return null;

    messaging = getMessaging(getFirebaseApp());
    registerForegroundHandler(messaging);

    const swRegistration = await ensureMessagingServiceWorker();
    const token = await getToken(messaging, {
      vapidKey,
      ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
    });

    if (token) {
      await saveFcmToken(trimmedUid, token);
    }
    return token;
  } catch (err) {
    console.warn("FCM web: no se pudo obtener token", err);
    return null;
  }
}

export function pushAvailable(): boolean {
  return !DEMO_MODE && Boolean(resolveVapidKey());
}
