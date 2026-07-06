import {
  buildInvitationLinks,
  buildWorkerActivationUrl,
  buildWorkerJoinUrl,
} from "@spe/shared";
import { isNativePlatform } from "./platform";
import { isElectron } from "./platform";

function resolveWorkerBase(workerBaseUrl?: string): string {
  return (
    workerBaseUrl ??
    import.meta.env.VITE_WORKER_APP_URL ??
    (typeof window !== "undefined"
      ? `${window.location.origin}${guessWorkerPathFromAdmin()}`
      : "/worker/")
  );
}

/** URL de activación en la App Trabajador (web o Android). */
export function buildActivationUrl(token: string, workerBaseUrl?: string): string {
  const base = resolveWorkerBase(workerBaseUrl);
  const useHash = isElectron() || isNativePlatform();
  return buildWorkerActivationUrl(token, base, { useHashRouter: useHash });
}

/** Enlaces completos para invitaciones (web + Android + registro manual). */
export function buildInvitationUrls(token: string, workerBaseUrl?: string) {
  return buildInvitationLinks(token, resolveWorkerBase(workerBaseUrl));
}

export function buildJoinUrl(workerBaseUrl?: string): string {
  const base = resolveWorkerBase(workerBaseUrl);
  const useHash = isElectron() || isNativePlatform();
  return buildWorkerJoinUrl(base, { useHashRouter: useHash });
}

function guessWorkerPathFromAdmin(): string {
  const base = import.meta.env.BASE_URL || "/";
  if (base.includes("/worker")) return base;
  if (base === "/" || base === "./") return "/worker/";
  return base.endsWith("/") ? `${base}worker/` : `${base}/worker/`;
}
