import { buildWorkerActivationUrl } from "@spe/shared";
import { isNativePlatform } from "./platform";
import { isElectron } from "./platform";

/** URL de activación en la App Trabajador (web, Android o enlace compartido). */
export function buildActivationUrl(token: string, workerBaseUrl?: string): string {
  const useHash = isElectron() || isNativePlatform();
  const fallback =
    workerBaseUrl ??
    import.meta.env.VITE_WORKER_APP_URL ??
    (typeof window !== "undefined"
      ? `${window.location.origin}${guessWorkerPathFromAdmin()}`
      : "/worker/");

  return buildWorkerActivationUrl(token, fallback, { useHashRouter: useHash });
}

function guessWorkerPathFromAdmin(): string {
  const base = import.meta.env.BASE_URL || "/";
  if (base.includes("/worker")) return base;
  if (base === "/" || base === "./") return "/worker/";
  return base.endsWith("/") ? `${base}worker/` : `${base}/worker/`;
}
