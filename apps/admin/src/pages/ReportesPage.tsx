import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  REPORTE_ESTADO_LABEL,
  REPORTE_TIPO_LABEL,
  canStartDirectChat,
  puedeVerReportesTrabajadores,
  resolveDirectChatPath,
  type Reporte,
  type ReporteEstado,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import {
  updateReporteEstado,
  usePlatformUsers,
  useReportes,
} from "../hooks/useDataStore";

export function ReportesPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const reportes = useReportes();
  const platformUsers = usePlatformUsers();

  const uidPorWorkerId = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of platformUsers) {
      if (u.workerId) map.set(u.workerId, u.uid);
    }
    return map;
  }, [platformUsers]);

  function chatUidDelReporte(r: Reporte): string | null {
    if (r.reporterUid && r.reporterUid !== user?.uid) return r.reporterUid;
    const fromWorker = uidPorWorkerId.get(r.workerId);
    if (fromWorker && fromWorker !== user?.uid) return fromWorker;
    return null;
  }

  if (!user || !puedeVerReportesTrabajadores(user.role)) {
    return (
      <PermissionDenied
        title="Sin acceso a reportes"
        description="Tu rol no puede gestionar incidencias de trabajadores."
        role={user?.role}
      />
    );
  }

  const puedeChatear = canStartDirectChat(user.role);

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
        description="Incidencias enviadas desde la app. Puedes responder por chat a quien reportó."
      />

      <Card>
        <div className="space-y-3">
          {reportes.length === 0 ? (
            <EmptyState
              title="No hay reportes pendientes"
              description="Cuando un trabajador envíe una incidencia desde la app, aparecerá aquí."
            />
          ) : (
            reportes.map((r) => {
              const peerUid = chatUidDelReporte(r);
              const chatTo =
                puedeChatear && peerUid
                  ? resolveDirectChatPath(pathname, peerUid)
                  : null;

              return (
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
                      tone={
                        r.estado === "resuelto"
                          ? "en_sitio"
                          : r.estado === "abierto"
                            ? "sin_asignar"
                            : "neutral"
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm text-neutral-300">{r.mensaje}</p>
                  <p className="mt-1 font-mono text-xs text-neutral-600">
                    {new Date(r.creadoEn).toLocaleString("es-CO")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chatTo ? (
                      <Link
                        to={chatTo}
                        className="rounded-lg bg-accent/20 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/30"
                      >
                        Chatear con {r.workerNombre.split(" ")[0] || "quien reportó"}
                      </Link>
                    ) : puedeChatear ? (
                      <span className="rounded-lg border border-border px-3 py-1 text-xs text-neutral-500">
                        Sin cuenta de chat vinculada
                      </span>
                    ) : null}
                    {r.estado !== "resuelto" && (
                      <>
                        {r.estado === "abierto" && (
                          <button
                            type="button"
                            onClick={() => void cambiarEstado(r.id, "en_revision")}
                            className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-neutral-800"
                          >
                            En revisión
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void cambiarEstado(r.id, "resuelto")}
                          className="rounded-lg bg-positive/20 px-3 py-1 text-xs text-positive hover:bg-positive/30"
                        >
                          Marcar resuelto
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
