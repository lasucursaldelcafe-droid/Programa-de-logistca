import {
  REPORTE_ESTADO_LABEL,
  REPORTE_TIPO_LABEL,
  puedeVerReportesTrabajadores,
  type ReporteEstado,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import { updateReporteEstado, useReportes } from "../hooks/useDataStore";

export function ReportesPage() {
  const { user } = useAuth();
  const reportes = useReportes();

  if (!user || !puedeVerReportesTrabajadores(user.role)) {
    return (
      <PermissionDenied
        title="Sin acceso a reportes"
        description="Tu rol no puede gestionar incidencias de trabajadores."
        role={user?.role}
      />
    );
  }

  async function cambiarEstado(id: string, estado: ReporteEstado) {
    await updateReporteEstado(id, estado, {
      uid: user!.uid,
      nombre: user!.nombre,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reportes de trabajadores"
        description="Incidencias enviadas desde la app Trabajador. Resuélvelas o márcalas en revisión."
      />

      <Card>
        <div className="space-y-3">
          {reportes.length === 0 ? (
            <EmptyState
              title="No hay reportes pendientes"
              description="Cuando un trabajador envíe una incidencia desde la app, aparecerá aquí."
            />
          ) : (
            reportes.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-bg px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{r.workerNombre}</div>
                    <div className="text-xs text-neutral-500">
                      {REPORTE_TIPO_LABEL[r.tipo]}
                      {r.siteNombre ? ` · ${r.siteNombre}` : ""}
                    </div>
                  </div>
                  <Badge
                    label={REPORTE_ESTADO_LABEL[r.estado]}
                    tone={r.estado === "resuelto" ? "en_sitio" : r.estado === "abierto" ? "sin_asignar" : "neutral"}
                  />
                </div>
                <p className="mt-2 text-sm text-neutral-300">{r.mensaje}</p>
                <p className="mt-1 font-mono text-xs text-neutral-600">
                  {new Date(r.creadoEn).toLocaleString("es-CO")}
                </p>
                {r.estado !== "resuelto" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.estado === "abierto" && (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(r.id, "en_revision")}
                        className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-neutral-800"
                      >
                        En revisión
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cambiarEstado(r.id, "resuelto")}
                      className="rounded-lg bg-positive/20 px-3 py-1 text-xs text-positive hover:bg-positive/30"
                    >
                      Marcar resuelto
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
