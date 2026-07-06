import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.spe.personaleventos",
  appName: "SPE Negocio",
  webDir: "dist",
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
  },
};

export default config;
