import { ATTENDANCE_LABEL, puedeVerMapaEnVivo } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { LiveMap } from "../components/LiveMap";
import { PageHeader } from "../components/nav/PageHeader";
import { useAttendances, useSites } from "../hooks/useDataStore";

export function SupervisionPage() {
  const { user } = useAuth();
  const sites = useSites();
  const attendances = useAttendances();

  if (!user) return null;

  const activos = attendances.filter((a) => a.estado !== "cerrado");
  const conGps = activos.filter((a) => a.ubicacionActual);
  const alertas = activos.filter(
    (a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Supervisión"
        description="Ubicación GPS en tiempo real de jornadas activas."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="font-mono text-3xl font-semibold text-positive">{activos.length}</div>
          <div className="text-sm text-neutral-400">Jornadas activas</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-accent">{conGps.length}</div>
          <div className="text-sm text-neutral-400">Con GPS reportado</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-alert">{alertas.length}</div>
          <div className="text-sm text-neutral-400">Alertas</div>
        </Card>
      </div>

      {puedeVerMapaEnVivo(user.role) && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Mapa en vivo</h2>
          <div className="mt-4">
            <LiveMap sites={sites} attendances={activos} />
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Personal rastreado</h2>
        <ul className="mt-4 space-y-3">
          {activos.length === 0 ? (
            <li className="text-sm text-neutral-500">Sin jornadas activas.</li>
          ) : (
            activos.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg px-4 py-3"
              >
                <div>
                  <div className="font-medium">{a.workerNombre}</div>
                  <div className="text-xs text-neutral-500">
                    {a.siteNombre}
                    {a.ubicacionActual && (
                      <>
                        {" · "}
                        <span className="font-mono">
                          {a.ubicacionActual.lat.toFixed(5)}, {a.ubicacionActual.lng.toFixed(5)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge
                  label={ATTENDANCE_LABEL[a.estado]}
                  tone={a.estado === "fuera_geocerca" ? "rechazado" : "confirmado"}
                />
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
