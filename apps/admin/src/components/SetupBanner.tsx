import { Link } from "react-router-dom";
import { needsSetupAttention } from "@spe/shared";
import { useSetupConfig } from "../hooks/useSetup";
import { useEvents } from "../hooks/useDataStore";

export function SetupBanner() {
  const config = useSetupConfig();
  const events = useEvents();
  const sinEventos = events.length === 0;

  if (sinEventos) {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-accent">Empieza aquí: crear evento</p>
            <p className="text-xs text-neutral-400">
              Paso 1 del flujo — nombre, fechas, sitios y QR antes de asignar personal.
            </p>
          </div>
          <Link
            to="/configuracion"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg hover:bg-accent/90"
          >
            Crear evento →
          </Link>
        </div>
      </div>
    );
  }

  if (!needsSetupAttention(config)) return null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-accent">Asistente de evento incompleto</p>
          <p className="text-xs text-neutral-400">Sitios, tarifas o QR pendientes antes de operar.</p>
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
            Continuar asistente →
          </Link>
        </div>
      </div>
    </div>
  );
}
