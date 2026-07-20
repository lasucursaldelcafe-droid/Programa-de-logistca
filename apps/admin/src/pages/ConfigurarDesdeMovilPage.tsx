import { useState } from "react";
import { Link } from "react-router-dom";
import {
  parseBootstrapText,
  saveRuntimeConfig,
  isFirebaseConfigured,
} from "@spe/shared";

export function ConfigurarDesdeMovilPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function aplicarTexto(texto: string) {
    const cfg = parseBootstrapText(texto);
    if (!cfg?.firebase?.apiKey || !cfg.firebase.projectId || !cfg.firebase.appId) {
      setStatus(
        "No encontré credenciales Firebase (apiKey, projectId, appId). Copia el JSON del SDK web desde Firebase Console.",
      );
      return;
    }
    setLoading(true);
    setStatus(null);
    saveRuntimeConfig({
      backend: "firebase",
      demoMode: false,
      firebase: cfg.firebase,
    });
    if (!isFirebaseConfigured()) {
      setStatus("Configuración guardada localmente. En producción usa GitHub Secrets VITE_FIREBASE_*.");
    } else {
      setStatus("✓ Firebase configurado. Recargando…");
      window.location.assign(`${import.meta.env.BASE_URL}login`);
    }
    setLoading(false);
  }

  async function pegarDelPortapapeles() {
    try {
      const text = await navigator.clipboard.readText();
      await aplicarTexto(text);
    } catch {
      setStatus("No pude leer el portapapeles. Mantén pulsado en el cuadro y elige Pegar.");
    }
  }

  return (
    <div className="spe-login-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950/90 p-6 shadow-xl">
        <h1 className="font-display text-2xl font-bold text-white">Configurar Firebase</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Pega el JSON del SDK web de Firebase Console. En GitHub Pages la configuración oficial va en
          GitHub Secrets (VITE_FIREBASE_*).
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={() => void pegarDelPortapapeles()}
          className="mt-6 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Aplicando…" : "Pegar credenciales Firebase"}
        </button>

        <label className="mt-4 block text-xs text-neutral-500" htmlFor="cfg-text">
          O pega aquí (mantener pulsado → Pegar)
        </label>
        <textarea
          id="cfg-text"
          rows={8}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-neutral-200"
          placeholder='{"firebase":{"apiKey":"...","authDomain":"...","projectId":"..."}}'
        />

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const el = document.getElementById("cfg-text") as HTMLTextAreaElement | null;
            if (el?.value) void aplicarTexto(el.value);
          }}
          className="mt-3 w-full rounded-lg border border-neutral-600 py-2 text-sm text-neutral-200"
        >
          Aplicar texto pegado
        </button>

        <Link
          to="/login"
          className="mt-3 block w-full rounded-lg border border-neutral-600 py-2 text-center text-sm text-neutral-300"
        >
          Volver al login
        </Link>

        {status && <p className="mt-4 text-sm text-neutral-300">{status}</p>}

        <p className="mt-4 text-xs text-neutral-500">
          Guía completa en /pendientes → Firebase Secrets.
        </p>
      </div>
    </div>
  );
}
