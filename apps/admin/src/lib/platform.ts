import { Capacitor } from "@capacitor/core";

export type AppPlatform = "web" | "android" | "electron";

declare global {
  interface Window {
    electron?: { platform: "desktop" };
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && window.electron?.platform === "desktop";
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getAppPlatform(): AppPlatform {
  if (isElectron()) return "electron";
  if (Capacitor.getPlatform() === "android") return "android";
  return "web";
}

export const PLATFORM_LABEL: Record<AppPlatform, string> = {
  web: "Web",
  android: "Android",
  electron: "Windows",
};
