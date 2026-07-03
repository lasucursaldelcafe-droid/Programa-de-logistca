import { Link } from "react-router-dom";
import { needsSetupAttention } from "@spe/shared";
import { useSetupConfig } from "../hooks/useSetup";

export function SetupBanner() {
  const config = useSetupConfig();
  if (!needsSetupAttention(config)) return null;

  return (
    <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-accent">Configuración inicial pendiente</p>
          <p className="text-sm text-neutral-400">
            Completa el asistente para dejar listo tu evento, sitios, tarifas y QR.
          </p>
        </div>
        <Link
          to="/configuracion"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/90"
        >
          Abrir asistente
        </Link>
      </div>
    </div>
  );
}
