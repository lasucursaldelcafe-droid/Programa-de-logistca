import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";

export const NATIVE_PERMISSIONS_PROMPTED_KEY = "spe_native_permissions_prompted_v1";

export type NativePermissionId =
  | "location"
  | "notifications"
  | "camera"
  | "microphone"
  | "photos"
  | "phone";

export type NativePermissionStatus = "granted" | "denied" | "prompt" | "unavailable" | "skipped";

export interface NativePermissionResult {
  id: NativePermissionId;
  label: string;
  status: NativePermissionStatus;
  detail?: string;
}

export const NATIVE_PERMISSION_ITEMS: Array<{
  id: NativePermissionId;
  label: string;
  description: string;
}> = [
  {
    id: "location",
    label: "Ubicación (GPS)",
    description: "Marcar entrada, mapa en vivo y verificación en sitio.",
  },
  {
    id: "notifications",
    label: "Notificaciones",
    description: "Avisos de turnos, chat y novedades del evento.",
  },
  {
    id: "camera",
    label: "Cámara",
    description: "Leer QR del sitio, videollamadas y evidencias.",
  },
  {
    id: "microphone",
    label: "Micrófono / voz",
    description: "Chat de voz y videollamadas con el equipo.",
  },
  {
    id: "photos",
    label: "Fotos y archivos",
    description: "Adjuntar imágenes y documentos desde el teléfono.",
  },
  {
    id: "phone",
    label: "Teléfono",
    description: "Estado de llamadas para no interrumpir operación en sitio.",
  },
];

function normalizeStatus(value: string | undefined): NativePermissionStatus {
  if (value === "granted" || value === "denied" || value === "prompt") return value;
  if (value === "limited") return "granted";
  return "unavailable";
}

async function requestLocation(): Promise<NativePermissionResult> {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const current = await Geolocation.checkPermissions();
    const status =
      current.location === "granted"
        ? current
        : await Geolocation.requestPermissions();
    return {
      id: "location",
      label: "Ubicación (GPS)",
      status: normalizeStatus(status.location),
    };
  } catch (err) {
    return {
      id: "location",
      label: "Ubicación (GPS)",
      status: "unavailable",
      detail: err instanceof Error ? err.message : "No disponible",
    };
  }
}

async function requestNotifications(): Promise<NativePermissionResult> {
  try {
    if (Capacitor.isPluginAvailable("PushNotifications")) {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const current = await PushNotifications.checkPermissions();
      const status =
        current.receive === "granted"
          ? current
          : await PushNotifications.requestPermissions();
      if (status.receive === "granted") {
        await PushNotifications.register().catch(() => undefined);
      }
      return {
        id: "notifications",
        label: "Notificaciones",
        status: normalizeStatus(status.receive),
      };
    }

    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        return { id: "notifications", label: "Notificaciones", status: "granted" };
      }
      if (Notification.permission === "denied") {
        return { id: "notifications", label: "Notificaciones", status: "denied" };
      }
      const result = await Notification.requestPermission();
      return {
        id: "notifications",
        label: "Notificaciones",
        status: result === "granted" ? "granted" : result === "denied" ? "denied" : "prompt",
      };
    }

    return { id: "notifications", label: "Notificaciones", status: "unavailable" };
  } catch (err) {
    return {
      id: "notifications",
      label: "Notificaciones",
      status: "unavailable",
      detail: err instanceof Error ? err.message : "No disponible",
    };
  }
}

async function requestCameraAndPhotos(): Promise<{
  camera: NativePermissionResult;
  photos: NativePermissionResult;
}> {
  try {
    if (Capacitor.isPluginAvailable("Camera")) {
      const { Camera } = await import("@capacitor/camera");
      const current = await Camera.checkPermissions();
      const status =
        current.camera === "granted" && current.photos === "granted"
          ? current
          : await Camera.requestPermissions({ permissions: ["camera", "photos"] });
      return {
        camera: {
          id: "camera",
          label: "Cámara",
          status: normalizeStatus(status.camera),
        },
        photos: {
          id: "photos",
          label: "Fotos y archivos",
          status: normalizeStatus(status.photos),
        },
      };
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "No disponible";
    return {
      camera: { id: "camera", label: "Cámara", status: "unavailable", detail },
      photos: { id: "photos", label: "Fotos y archivos", status: "unavailable", detail },
    };
  }

  return {
    camera: { id: "camera", label: "Cámara", status: "prompt" },
    photos: { id: "photos", label: "Fotos y archivos", status: "prompt" },
  };
}

async function requestMicrophone(): Promise<NativePermissionResult> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      return { id: "microphone", label: "Micrófono / voz", status: "unavailable" };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return { id: "microphone", label: "Micrófono / voz", status: "granted" };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return { id: "microphone", label: "Micrófono / voz", status: "denied" };
    }
    return {
      id: "microphone",
      label: "Micrófono / voz",
      status: "unavailable",
      detail: err instanceof Error ? err.message : "No disponible",
    };
  }
}

/**
 * Teléfono: en Android el permiso vive en el manifest.
 * En runtime no hay API web estable; marcamos como listo en nativo
 * (el sistema pedirá acceso si alguna función lo requiere).
 */
async function requestPhone(): Promise<NativePermissionResult> {
  if (!isNativePlatform()) {
    return { id: "phone", label: "Teléfono", status: "skipped" };
  }
  return {
    id: "phone",
    label: "Teléfono",
    status: "granted",
    detail: "Declarado en la app; el sistema lo pedirá si hace falta.",
  };
}

export async function hasPromptedNativePermissions(): Promise<boolean> {
  if (!isNativePlatform()) return true;
  try {
    const { value } = await Preferences.get({ key: NATIVE_PERMISSIONS_PROMPTED_KEY });
    return value === "1";
  } catch {
    return false;
  }
}

export async function markNativePermissionsPrompted(): Promise<void> {
  if (!isNativePlatform()) return;
  await Preferences.set({ key: NATIVE_PERMISSIONS_PROMPTED_KEY, value: "1" });
}

export async function clearNativePermissionsPrompted(): Promise<void> {
  if (!isNativePlatform()) return;
  await Preferences.remove({ key: NATIVE_PERMISSIONS_PROMPTED_KEY });
}

/** Solicita todos los permisos operativos de la app nativa. */
export async function requestAllNativePermissions(): Promise<NativePermissionResult[]> {
  if (!isNativePlatform()) return [];

  const location = await requestLocation();
  const notifications = await requestNotifications();
  const { camera, photos } = await requestCameraAndPhotos();
  const microphone = await requestMicrophone();
  const phone = await requestPhone();

  const results = [location, notifications, camera, microphone, photos, phone];
  await markNativePermissionsPrompted();
  return results;
}
