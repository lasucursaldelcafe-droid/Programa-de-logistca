import { useMemo, useState } from "react";
import {
  buildFullEventInforme,
  exportInformeCsv,
  formatCurrencyCOP,
  puedeVerInformesEvento,
  type InformeTab,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import {
  useAttendances,
  useEvents,
  useInvitations,
  useReportes,
  useShifts,
  useSites,
  useWorkers,
} from "../hooks/useDataStore";
import { usePayrollEntries } from "../hooks/usePayroll";

const TABS: Array<{ id: InformeTab; label: string }> = [
  { id: "operativo", label: "Operativo" },
  { id: "rendimiento", label: "Rendimiento" },
  { id: "costos", label: "Costos" },
  { id: "contactos", label: "Contactos" },
];

export function InformesEventoPage() {
  const { user } = useAuth();
  const events = useEvents();
  const sites = useSites();
  const workers = useWorkers();
  const shifts = useShifts();
  const attendances = useAttendances();
  const reportes = useReportes();
  const payroll = usePayrollEntries();
  const invitations = useInvitations();

  const [eventoId, setEventoId] = useState("");
  const [tab, setTab] = useState<InformeTab>("operativo");

  const evento = useMemo(
    () => events.find((e) => e.id === eventoId) ?? events[0] ?? null,
    [events, eventoId],
  );

  const informe = useMemo(() => {
    if (!evento) return null;
    return buildFullEventInforme({
      evento,
      sites,
      workers,
      shifts,
      attendances,
      reportes,
      payroll,
      invitations,
    });
  }, [evento, sites, workers, shifts, attendances, reportes, payroll, invitations]);

  if (!user || !puedeVerInformesEvento(user.role)) {
    return (
      <PermissionDenied
        title="Sin acceso a informes"
        description="Tu rol no puede ver informes operativos del evento."
        role={user?.role}
      />
    );
  }

  function exportTab() {
    if (!informe) return;
    const csv = exportInformeCsv(informe, tab);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-${tab}-${informe.evento.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Informes por evento"
        description="Operativos, rendimiento, costos y contactos de cada evento"
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm">
          Evento
          <select
            value={evento?.id ?? ""}
            onChange={(e) => setEventoId(e.target.value)}
            className="mt-1 block w-full max-w-full rounded-lg border border-border bg-bg px-3 py-2 sm:min-w-[220px] sm:w-auto"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={exportTab}
          disabled={!informe}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Exportar CSV ({tab})
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-accent/20 text-accent" : "border border-border text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!informe ? (
        <EmptyState
          title="Sin eventos para informar"
          description="Crea un evento en configuración para generar informes operativos."
          action={{ to: "/configuracion", label: "Crear evento" }}
        />
      ) : (
        <>
          {tab === "operativo" && (
            <Card>
              <h2 className="font-display text-lg font-semibold">Informe operativo</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {informe.operativo.map((m) => (
                  <div key={m.label} className="rounded border border-border px-3 py-2">
                    <dt className="text-xs text-neutral-500">{m.label}</dt>
                    <dd className="font-medium">{m.value}</dd>
                    {m.detalle && <dd className="mt-1 text-xs text-neutral-400">{m.detalle}</dd>}
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {tab === "rendimiento" && (
            <Card>
              <h2 className="font-display text-lg font-semibold">Rendimiento por trabajador</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-neutral-500">
                    <tr>
                      <th className="pb-2 pr-3">Trabajador</th>
                      <th className="pb-2 pr-3">Turnos</th>
                      <th className="pb-2 pr-3">Jornadas</th>
                      <th className="pb-2 pr-3">Horas</th>
                      <th className="pb-2 pr-3">Alertas GPS</th>
                      <th className="pb-2 pr-3">Reportes</th>
                      <th className="pb-2 pr-3">Rating</th>
                      <th className="pb-2">Puntualidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.rendimiento.map((r) => (
                      <tr key={r.workerId} className="border-t border-border">
                        <td className="py-2 pr-3">{r.workerNombre}</td>
                        <td className="py-2 pr-3">{r.turnosConfirmados}</td>
                        <td className="py-2 pr-3">{r.jornadasCerradas}</td>
                        <td className="py-2 pr-3">{r.horasTotales}h</td>
                        <td className="py-2 pr-3">{r.alertasGeocerca}</td>
                        <td className="py-2 pr-3">{r.reportesAbiertos}</td>
                        <td className="py-2 pr-3">{r.rating}</td>
                        <td className="py-2">{r.puntualidadPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === "costos" && (
            <Card>
              <h2 className="font-display text-lg font-semibold">Costos del evento</h2>
              <p className="mt-2 text-2xl font-bold text-accent">
                {formatCurrencyCOP(informe.resumenCostoTotal)}
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {informe.costos.map((m) => (
                  <div key={m.label} className="rounded border border-border px-3 py-2">
                    <dt className="text-xs text-neutral-500">{m.label}</dt>
                    <dd className="font-medium">
                      {typeof m.value === "number" && m.label.includes("COP")
                        ? formatCurrencyCOP(m.value)
                        : m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {tab === "contactos" && (
            <Card>
              <h2 className="font-display text-lg font-semibold">Contactos del evento</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-neutral-500">
                    <tr>
                      <th className="pb-2 pr-3">Nombre</th>
                      <th className="pb-2 pr-3">Email</th>
                      <th className="pb-2 pr-3">Teléfono</th>
                      <th className="pb-2 pr-3">Rol</th>
                      <th className="pb-2 pr-3">Cuenta</th>
                      <th className="pb-2">Turnos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.contactos.map((c) => (
                      <tr key={c.workerId} className="border-t border-border">
                        <td className="py-2 pr-3">{c.nombre}</td>
                        <td className="py-2 pr-3">{c.email}</td>
                        <td className="py-2 pr-3">{c.telefono || "—"}</td>
                        <td className="py-2 pr-3">{c.rol}</td>
                        <td className="py-2 pr-3">{c.cuentaActiva ? "Activa" : "Pendiente"}</td>
                        <td className="py-2">{c.turnosEnEvento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
