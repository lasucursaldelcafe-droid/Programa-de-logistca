import { useEffect, useState, type ReactNode } from "react";
import { isNativePlatform } from "../lib/platform";
import {
  hasPromptedNativePermissions,
  markNativePermissionsPrompted,
  NATIVE_PERMISSION_ITEMS,
  requestAllNativePermissions,
  type NativePermissionResult,
} from "../lib/nativePermissions";

function statusLabel(status: NativePermissionResult["status"]): string {
  switch (status) {
    case "granted":
      return "Permitido";
    case "denied":
      return "Denegado";
    case "prompt":
      return "Pendiente";
    case "skipped":
      return "Omitido";
    case "unavailable":
      return "No disponible";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusClass(status: NativePermissionResult["status"]): string {
  switch (status) {
    case "granted":
      return "text-emerald-400";
    case "denied":
      return "text-alert";
    case "prompt":
      return "text-accent";
    case "skipped":
    case "unavailable":
      return "text-neutral-500";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * En la APK/app nativa, muestra una sola vez el flujo para conceder
 * GPS, notificaciones, cámara, micrófono, archivos y teléfono.
 */
export function NativePermissionsGate({ children }: { children: ReactNode }) {
  const native = isNativePlatform();
  const [ready, setReady] = useState(!native);
  const [showPrompt, setShowPrompt] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [results, setResults] = useState<NativePermissionResult[] | null>(null);

  useEffect(() => {
    if (!native) return;

    let cancelled = false;
    void (async () => {
      const already = await hasPromptedNativePermissions();
      if (cancelled) return;
      if (!already) {
        setShowPrompt(true);
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [native]);

  const allowAccess = async () => {
    setRequesting(true);
    try {
      const next = await requestAllNativePermissions();
      setResults(next);
    } finally {
      setRequesting(false);
    }
  };

  const dismiss = async () => {
    await markNativePermissionsPrompted();
    setShowPrompt(false);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-neutral-400">
        Preparando permisos…
      </div>
    );
  }

  return (
    <>
      {children}
      {showPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="native-permissions-title"
        >
          <div className="spe-glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 shadow-xl ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">SPE Eventos</p>
            <h2 id="native-permissions-title" className="mt-1 font-display text-xl font-semibold text-white">
              Permisos del teléfono
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Para GPS, chat, voz, cámara, notificaciones, archivos y teléfono, Android pide
              autorización al instalar o al usar la función. Concédelos ahora para que la app
              funcione completa.
            </p>

            <ul className="mt-4 space-y-3">
              {NATIVE_PERMISSION_ITEMS.map((item) => {
                const result = results?.find((r) => r.id === item.id);
                return (
                  <li key={item.id} className="rounded-xl bg-neutral-900/60 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
                      </div>
                      {result && (
                        <span className={`shrink-0 text-xs font-semibold ${statusClass(result.status)}`}>
                          {statusLabel(result.status)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {results && results.some((r) => r.status === "denied") && (
              <p className="mt-3 text-xs text-neutral-500">
                Si denegaste alguno, puedes activarlo después en Ajustes del teléfono → Apps → SPE
                Eventos → Permisos.
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              {!results ? (
                <>
                  <button
                    type="button"
                    disabled={requesting}
                    onClick={() => void allowAccess()}
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-accent/90 disabled:opacity-60"
                  >
                    {requesting ? "Solicitando…" : "Permitir accesos"}
                  </button>
                  <button
                    type="button"
                    disabled={requesting}
                    onClick={() => void dismiss()}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-400 ring-1 ring-white/10 transition hover:bg-white/5"
                  >
                    Más tarde
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPrompt(false)}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-accent/90"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
