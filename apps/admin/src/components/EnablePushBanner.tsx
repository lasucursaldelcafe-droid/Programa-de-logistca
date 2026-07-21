import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { initPushNotifications, pushAvailable, pushPermissionState } from "../lib/fcm";

const DISMISS_KEY = "spe-push-banner-dismissed:";

/**
 * Banner para activar avisos en el navegador / PWA cuando el permiso aún no está concedido.
 * En nativo el flujo lo cubre NativePermissionsGate.
 */
export function EnablePushBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !pushAvailable()) {
      setVisible(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        if (sessionStorage.getItem(`${DISMISS_KEY}${user.uid}`) === "1") {
          setVisible(false);
          return;
        }
      } catch {
        /* ignore */
      }
      const state = pushPermissionState();
      setVisible(state === "default");
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !visible) return null;

  async function enable() {
    if (!user) return;
    setBusy(true);
    setFeedback(null);
    try {
      const token = await initPushNotifications(user.uid, { requestPermission: true });
      if (token) {
        setFeedback("Avisos activados en este dispositivo.");
        setVisible(false);
      } else if (pushPermissionState() === "denied") {
        setFeedback(
          "Permiso bloqueado. Actívalo en la configuración del navegador o del sistema.",
        );
      } else {
        setFeedback("No se pudo activar ahora. Inténtalo de nuevo más tarde.");
      }
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    if (!user) return;
    try {
      sessionStorage.setItem(`${DISMISS_KEY}${user.uid}`, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div className="border-b border-accent/30 bg-accent/10 px-3 py-2.5">
      <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-2 md:max-w-2xl lg:max-w-3xl">
        <p className="min-w-0 flex-1 text-xs leading-snug text-neutral-200 sm:text-sm">
          Activa avisos para turnos y mensajes, aunque la app esté en segundo plano.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="min-h-10 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
          >
            {busy ? "…" : "Activar"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={dismiss}
            className="min-h-10 rounded-lg px-2 py-2 text-xs text-neutral-400 hover:text-white"
          >
            Ahora no
          </button>
        </div>
      </div>
      {feedback && <p className="mx-auto mt-1.5 max-w-lg text-xs text-neutral-400">{feedback}</p>}
    </div>
  );
}
