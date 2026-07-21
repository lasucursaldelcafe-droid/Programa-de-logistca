import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  WORKER_ACTIVITY_KIND_LABEL,
  buildWorkerActivityRows,
  resolveDirectChatPath,
  type WorkerActivityKind,
} from "@spe/shared";
import { Badge, Card } from "@core/components/ui";
import { PageHeader } from "@core/components/nav/PageHeader";
import { MetricCard } from "@core/components/dashboard/MetricCard";
import {
  useAttendances,
  usePlatformUsers,
  useReportes,
  useShifts,
  useWorkers,
} from "@core/hooks/useDataStore";

type FilterKind = "todos" | WorkerActivityKind;

const FILTERS: Array<{ id: FilterKind; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "fuera_geocerca", label: "Alertas GPS" },
  { id: "en_jornada", label: "En jornada" },
  { id: "turno_confirmado", label: "Turno listo" },
  { id: "turno_pendiente", label: "Pendientes" },
  { id: "sin_actividad", label: "Sin actividad" },
];

function kindTone(
  kind: WorkerActivityKind,
): "en_sitio" | "descanso" | "inactivo" | "sin_asignar" | "rechazado" | "confirmado" | "pendiente" {
  switch (kind) {
    case "en_jornada":
      return "en_sitio";
    case "fuera_geocerca":
    case "revision_manual":
      return "rechazado";
    case "turno_confirmado":
      return "confirmado";
    case "turno_pendiente":
      return "pendiente";
    case "deshabilitado":
      return "inactivo";
    case "sin_actividad":
      return "sin_asignar";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function formatGps(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function formatEntrada(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Vista CEO / Master: lista de trabajadores de campo y qué están haciendo ahora
 * (jornada GPS, alertas, turnos pendientes o sin actividad).
 */
export function TrabajadoresActividadPage() {
  const { pathname } = useLocation();
  const workers = useWorkers();
  const attendances = useAttendances();
  const shifts = useShifts();
  const reportes = useReportes();
  const platformUsers = usePlatformUsers();
  const [filter, setFilter] = useState<FilterKind>("todos");
  const [query, setQuery] = useState("");

  const uidByWorkerId = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of platformUsers) {
      if (u.workerId) map.set(u.workerId, u.uid);
    }
    return map;
  }, [platformUsers]);

  const rows = useMemo(
    () => buildWorkerActivityRows({ workers, attendances, shifts, reportes }),
    [workers, attendances, shifts, reportes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "fuera_geocerca") {
        if (r.kind !== "fuera_geocerca" && r.kind !== "revision_manual") return false;
      } else if (filter !== "todos" && r.kind !== filter) {
        return false;
      }
      if (!q) return true;
      return (
        r.nombre.toLowerCase().includes(q) ||
        r.documento.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.eventNombre?.toLowerCase().includes(q) ?? false) ||
        (r.siteNombre?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => {
    const enJornada = rows.filter((r) => r.kind === "en_jornada").length;
    const alertas = rows.filter(
      (r) => r.kind === "fuera_geocerca" || r.kind === "revision_manual",
    ).length;
    const conTurno = rows.filter(
      (r) => r.kind === "turno_confirmado" || r.kind === "turno_pendiente",
    ).length;
    return { enJornada, alertas, conTurno, total: rows.length };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trabajadores en vivo"
        description="Qué hace cada persona de campo ahora: jornada GPS, turnos y alertas."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Personal" value={String(counts.total)} />
        <MetricCard label="En jornada" value={String(counts.enJornada)} tone="positive" />
        <MetricCard label="Alertas GPS" value={String(counts.alertas)} tone="alert" />
        <MetricCard label="Con turno (sin marcar)" value={String(counts.conTurno)} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, cédula, evento o sitio…"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm sm:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.id
                    ? "bg-accent text-bg"
                    : "border border-border text-neutral-400 hover:border-accent/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-400">
            {rows.length === 0
              ? "Aún no hay personal de campo registrado. El equipo admin los crea en Personal."
              : "Ningún trabajador coincide con el filtro."}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-900/80 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Trabajador</th>
                <th className="px-4 py-3 font-medium">Qué hace</th>
                <th className="px-4 py-3 font-medium">Evento / sitio</th>
                <th className="px-4 py-3 font-medium">GPS</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
                <th className="px-4 py-3 font-medium">Chat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => {
                const peerUid = uidByWorkerId.get(r.workerId);
                return (
                <tr key={r.workerId} className="bg-bg/40 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-white">{r.nombre}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
                      {r.documento || "sin doc."}
                      {r.rolPlataforma === "supervisor_sitio" ? " · supervisor" : ""}
                    </p>
                    {r.perfiles.length > 0 && (
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {r.perfiles.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge
                      label={WORKER_ACTIVITY_KIND_LABEL[r.kind]}
                      tone={kindTone(r.kind)}
                    />
                    <p className="mt-2 text-neutral-300">{r.actividad}</p>
                    {r.reportesAbiertos > 0 && (
                      <p className="mt-1 text-xs text-alert">
                        {r.reportesAbiertos} reporte(s) abierto(s)
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-neutral-400">
                    {r.contexto || "—"}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-[11px] text-neutral-500">
                    {r.ubicacion
                      ? formatGps(r.ubicacion.lat, r.ubicacion.lng)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-neutral-500">
                    {formatEntrada(r.entradaEn)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {peerUid ? (
                      <Link
                        to={resolveDirectChatPath(pathname, peerUid)}
                        className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent ring-1 ring-accent/30 hover:bg-accent/25"
                      >
                        Abrir chat
                      </Link>
                    ) : (
                      <span className="text-[11px] text-neutral-600">Sin cuenta</span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
