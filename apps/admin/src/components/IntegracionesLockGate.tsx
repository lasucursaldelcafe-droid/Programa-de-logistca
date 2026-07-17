import { FormEvent, useState } from "react";
import { Card } from "./ui";
import {
  claveDesbloqueoIntegraciones,
  integracionesBloqueadasPorDefecto,
} from "../lib/backend";

const UNLOCK_SESSION_KEY = "spe-integraciones-desbloqueadas";

export function integracionesEstanDesbloqueadas(): boolean {
  if (!integracionesBloqueadasPorDefecto()) return true;
  return sessionStorage.getItem(UNLOCK_SESSION_KEY) === "1";
}

export function bloquearIntegraciones(): void {
  sessionStorage.removeItem(UNLOCK_SESSION_KEY);
}

interface Props {
  children: React.ReactNode;
}

/** Evita conectar/probar APIs externas hasta desbloquear (ahorro de tokens). */
export function IntegracionesLockGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(integracionesEstanDesbloqueadas());
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-positive/30 bg-positive/10 px-4 py-2 text-sm">
          <span className="text-positive">Integraciones desbloqueadas en esta sesión</span>
          <button
            type="button"
            className="text-xs text-neutral-400 underline hover:text-neutral-200"
            onClick={() => {
              bloquearIntegraciones();
              setUnlocked(false);
            }}
          >
            Volver a bloquear
          </button>
        </div>
        {children}
      </div>
    );
  }

  function onUnlock(e: FormEvent) {
    e.preventDefault();
    if (clave.trim() === claveDesbloqueoIntegraciones()) {
      sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
      setUnlocked(true);
      setError(null);
      return;
    }
    setError("Clave incorrecta");
  }

  return (
    <Card className="border-accent/30 bg-neutral-900/80">
      <h2 className="font-display text-lg font-semibold">Integraciones bloqueadas</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Las conexiones a Siigo, WhatsApp, Meta y webhooks están bloqueadas por defecto para no
        consumir tokens ni cuotas de API por accidente. Desbloquea solo cuando vayas a configurar
        credenciales reales.
      </p>
      <form onSubmit={onUnlock} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Clave de administrador</span>
          <input
            type="password"
            value={clave}
            onChange={(ev) => setClave(ev.target.value)}
            className="w-64 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            placeholder="Clave de desbloqueo"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          Desbloquear integraciones
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-alert">{error}</p>}
      <p className="mt-3 text-xs text-neutral-500">
        Clave por defecto: <code className="text-neutral-400">spe-desbloquear</code> — cámbiala con{" "}
        <code className="text-neutral-400">VITE_INTEGRACIONES_CLAVE</code> en el entorno.
      </p>
    </Card>
  );
}
