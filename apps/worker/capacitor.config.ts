import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App unificada SPE (Android).
 *
 * - Datos: siempre Firebase Firestore (sync en tiempo real con web/Windows).
 * - UI: por defecto carga GitHub Pages (SPE_LIVE_UI ≠ "0") para actualizarse sola
 *   en cada deploy. Bundle embebido queda como fallback offline (SPE_LIVE_UI=0).
 * - Config remota: spe-runtime-config.json en Pages.
 */
const CANONICAL_APP_URL =
  process.env.SPE_REMOTE_URL?.trim() ||
  process.env.VITE_SPE_CANONICAL_URL?.trim() ||
  "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

/** En desarrollo local (`SPE_LIVE_UI=0`) usa solo el bundle embebido. */
const LIVE_UI = process.env.SPE_LIVE_UI !== "0" && process.env.CAPACITOR_DEV !== "1";

const config: CapacitorConfig = {
  appId: "com.spe.personaleventos",
  appName: "SPE Eventos",
  webDir: "../admin/dist",
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: "https",
    ...(LIVE_UI
      ? {
          url: CANONICAL_APP_URL.replace(/\/?$/, "/"),
          cleartext: false,
        }
      : {}),
  },
  plugins: {
    Geolocation: {
      permissions: ["location"],
    },
    Camera: {
      // Solicitud explícita desde NativePermissionsGate / nativePermissions.ts
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
