import { useCallback, useEffect, useState } from "react";
import {
  applyUiUpdate,
  dismissUiVersion,
  fetchRemoteUiVersion,
  getBootUiVersion,
  isInstalledOrStandaloneApp,
  isUiVersionDismissed,
} from "@spe/shared";

const POLL_MS = 60_000;

/**
 * Detecta si Pages publicó una UI más nueva que la de esta sesión.
 * Pensado para PWA / APK / Electron con la app abierta mucho tiempo.
 */
export function useUiUpdateAvailable(enabled = true) {
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);

  const check = useCallback(async () => {
    if (!enabled) return;
    // En Vite local no molestar (no hay deploys de Pages).
    if (import.meta.env.DEV) return;

    const boot = getBootUiVersion();
    const remote = await fetchRemoteUiVersion(import.meta.env.BASE_URL);
    if (!remote) return;

    // Primera vez sin stamp de boot: anclar a lo remoto.
    if (!boot) {
      setAvailable(false);
      return;
    }

    if (remote === boot || isUiVersionDismissed(remote)) {
      setAvailable(false);
      setRemoteVersion(null);
      return;
    }

    setRemoteVersion(remote);
    setAvailable(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void check();
    const id = window.setInterval(() => {
      void check();
    }, POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void check();
    }
    function onFocus() {
      void check();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [check, enabled]);

  function dismiss() {
    if (remoteVersion) dismissUiVersion(remoteVersion);
    setAvailable(false);
  }

  function updateNow() {
    applyUiUpdate(remoteVersion);
  }

  return {
    available,
    remoteVersion,
    isInstalled: isInstalledOrStandaloneApp(),
    dismiss,
    updateNow,
    recheck: check,
  };
}
