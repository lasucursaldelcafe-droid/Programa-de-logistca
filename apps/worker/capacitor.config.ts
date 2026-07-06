import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App unificada SPE: Android carga la versión web (GitHub Pages) o el bundle
 * embebido de apps/admin/dist. Tras login, el panel se elige según el rol.
 */
const remoteUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.spe.personaleventos",
  appName: "SPE Eventos",
  webDir: "../admin/dist",
  android: {
    allowMixedContent: true,
  },
  server: remoteUrl
    ? {
        url: remoteUrl,
        cleartext: false,
        androidScheme: "https",
      }
    : {
        androidScheme: "https",
      },
  plugins: {
    Geolocation: {
      permissions: ["location"],
    },
  },
};

export default config;
