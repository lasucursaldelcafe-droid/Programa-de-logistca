import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Si CAPACITOR_SERVER_URL está definida, la app Android carga la versión web
 * (GitHub Pages) en lugar del bundle embebido. Esto sincroniza invitaciones demo
 * vía localStorage con el Admin web en el mismo dominio.
 */
const remoteUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.spe.personaleventos",
  appName: "Trabajador SPE",
  webDir: "dist",
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
