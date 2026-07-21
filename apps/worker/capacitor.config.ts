import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App unificada SPE (Android): bundle embebido de apps/admin/dist.
 * Los datos se sincronizan con web/Windows vía Firebase Firestore (mismo proyecto).
 * Config remota: spe-runtime-config.json en GitHub Pages.
 */
const config: CapacitorConfig = {
  appId: "com.spe.personaleventos",
  appName: "SPE Eventos",
  webDir: "../admin/dist",
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: "https",
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
