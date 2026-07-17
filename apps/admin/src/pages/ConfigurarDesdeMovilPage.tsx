import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  parseBootstrapText,
  saveRuntimeConfig,
  sheetsHealth,
} from "@spe/shared";

export function ConfigurarDesdeMovilPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function aplicarTexto(texto: string) {
    const cfg = parseBootstrapText(texto);
    if (!cfg?.sheetsWebAppUrl || !cfg.sheetsApiToken) {
      setStatus("No encontré URL /exec ni token. Copia todo el bloque de CREDENCIALES-SHEETS-AUTO.txt o del correo.");
      return;
    }
    setLoading(true);
    setStatus(null);
    saveRuntimeConfig({
      backend: "sheets",
      demoMode: false,
      sheetsWebAppUrl: cfg.sheetsWebAppUrl,
      sheetsApiToken: cfg.sheetsApiToken,
    });
    try {
      const health = await sheetsHealth();
      if (!health.ok) throw new Error("Backend no responde");
      setStatus("✓ Configuración aplicada. Entrando al login…");
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch {
      setStatus("Guardado localmente. Si el backend tarda, espera 1 min y vuelve a iniciar sesión.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } finally {
      setLoading(false);
    }
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
        <h1 className="font-display text-2xl font-bold text-white">Configurar desde celular</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Un toque: abre el correo con las credenciales, copia todo el texto y pulsa el botón.
          No necesitas escribir nada a mano.
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={() => void pegarDelPortapapeles()}
          className="mt-6 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Aplicando…" : "Pegar credenciales del correo"}
        </button>

        <label className="mt-4 block text-xs text-neutral-500" htmlFor="cfg-text">
          O pega aquí (mantener pulsado → Pegar)
        </label>
        <textarea
          id="cfg-text"
          rows={6}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-200"
          placeholder="Web App URL: https://script.google.com/.../exec&#10;API Token: abc123..."
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

        {status && <p className="mt-4 text-sm text-neutral-300">{status}</p>}

        <p className="mt-6 text-xs text-neutral-500">
          Cuentas: admin@eventos.test / Admin123! — La config queda guardada en este dispositivo.
        </p>
      </div>
    </div>
  );
}
