import { useLocation } from "react-router-dom";
import { useUiUpdateAvailable } from "../hooks/useUiUpdateAvailable";

/**
 * Aviso flotante cuando hay una versión nueva en Pages.
 * Prioriza apps instaladas (PWA / APK / Electron); también en web si el stamp cambió.
 */
export function UiUpdateBanner() {
  const { pathname } = useLocation();
  const { available, isInstalled, dismiss, updateNow } = useUiUpdateAvailable(true);

  if (!available) return null;

  // En navegador normal (no instalado) también mostramos, pero con copy más suave.
  const onWorker = pathname.startsWith("/worker");
  const bottom = onWorker ? "bottom-20 sm:bottom-6" : "bottom-4 sm:bottom-6";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 z-[90] flex justify-center px-3 safe-area-px ${bottom}`}
    >
      <div className="flex w-full max-w-lg items-center gap-3 rounded-2xl border border-accent/40 bg-surface/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur-md safe-area-pb">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-accent">Nueva versión disponible</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {isInstalled
              ? "Hay actualizaciones listas. Toca actualizar para cargarlas en la app."
              : "Se publicó una versión nueva. Actualiza para ver los últimos cambios."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={updateNow}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black hover:bg-accent/90"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
