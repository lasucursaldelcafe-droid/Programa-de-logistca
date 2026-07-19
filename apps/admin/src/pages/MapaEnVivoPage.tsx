import { ATTENDANCE_LABEL, puedeVerMapaEnVivo } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { LiveMap, liveMapUsesGoogle } from "../components/LiveMap";
import { isGoogleMapsEnabled } from "../lib/googleMaps";
import { useAttendances, useSites } from "../hooks/useDataStore";
import { isDemoMode } from "../lib/mode";
import { demoStore } from "../demo/store";
import { useEffect } from "react";

export function MapaEnVivoPage() {
  const { user } = useAuth();
  const sites = useSites();
  const attendances = useAttendances();

  useEffect(() => {
    if (isDemoMode()) demoStore.seedMapPreviewIfEmpty();
  }, []);

  if (!user || !puedeVerMapaEnVivo(user.role)) {
    return <p className="text-neutral-400">Sin permisos para ver el mapa en vivo.</p>;
  }

  const activos = attendances.filter((a) => a.estado !== "cerrado");
  const alertas = activos.filter((a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Mapa en vivo</h1>
        <p className="mt-1 text-neutral-400">
          Personal activo por sitio, geocercas y alertas en tiempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="font-mono text-3xl font-semibold text-positive">{activos.length}</div>
          <div className="text-sm text-neutral-400">Jornadas activas</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-alert">{alertas.length}</div>
          <div className="text-sm text-neutral-400">Alertas geocerca</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-accent">{sites.length}</div>
          <div className="text-sm text-neutral-400">Sitios monitoreados</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Mapa operativo</h2>
          <span className="text-xs text-neutral-500">
            {liveMapUsesGoogle() ? "Google Maps" : "Vista esquemática (sin API key)"}
          </span>
        </div>
        {!isGoogleMapsEnabled() && (
          <p className="mt-2 text-xs text-neutral-500">
            Configura <code className="text-neutral-400">googleMapsApiKey</code> en{" "}
            <code className="text-neutral-400">config/bootstrap.json</code> (GitHub) o{" "}
            <code className="text-neutral-400">VITE_GOOGLE_MAPS_API_KEY</code> en Secrets para
            Google Maps (Maps JavaScript API).
          </p>
        )}
        <div className="mt-4">
          <LiveMap sites={sites} attendances={activos} />
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Jornadas activas</h2>
        <div className="mt-4 space-y-3">
          {activos.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay personal con jornada activa.</p>
          ) : (
            activos.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg px-4 py-3"
              >
                <div>
                  <div className="font-medium">{a.workerNombre}</div>
                  <div className="text-xs text-neutral-500">
                    {a.siteNombre} · {a.eventNombre}
                    {a.ubicacionActual && (
                      <span className="ml-2 font-mono text-neutral-400">
                        {a.ubicacionActual.lat.toFixed(5)}, {a.ubicacionActual.lng.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge label={ATTENDANCE_LABEL[a.estado]} tone={a.estado === "fuera_geocerca" ? "rechazado" : "confirmado"} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
