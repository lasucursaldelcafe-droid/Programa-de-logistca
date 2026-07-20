import { Link } from "react-router-dom";
import { needsSetupAttention } from "@spe/shared";
import { useSetupConfig } from "../hooks/useSetup";

export function SetupBanner() {
  const config = useSetupConfig();
  if (!needsSetupAttention(config)) return null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-accent">Configuración pendiente</p>
          <p className="text-xs text-neutral-400">Evento, sitios, tarifas y QR.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/pendientes"
            className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
          >
            Ver guía
          </Link>
          <Link
            to="/configuracion"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg hover:bg-accent/90"
          >
            Abrir asistente
          </Link>
        </div>
      </div>
    </div>
  );
}
