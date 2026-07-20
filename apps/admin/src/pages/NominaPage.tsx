import { useMemo, useState } from "react";
import {
  PAYROLL_ESTADO_LABEL,
  PERFILES_LABEL,
  REFRIGERIO_TIPO_LABEL,
  downloadTextFile,
  exportPayrollCsv,
  formatCurrencyCOP,
  puedeGestionarNomina,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { useAttendances, useEvents, useWorkers } from "../hooks/useDataStore";
import {
  calculatePayrollFromAttendances,
  markPayrollPaid,
  recordPayrollExport,
  usePayrollAudit,
  usePayrollEntries,
  usePayrollRates,
  upsertPayrollRate,
} from "../hooks/usePayroll";

export function NominaPage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const events = useEvents();
  const attendances = useAttendances();
  const rates = usePayrollRates();
  const entries = usePayrollEntries();
  const audit = usePayrollAudit();

  const esAdmin = user && puedeGestionarNomina(user.role);
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroTrabajador, setFiltroTrabajador] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"" | "pendiente" | "pagado">("");
  const [calculando, setCalculando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const misEntradas = useMemo(() => {
    let list = entries;
    if (user?.role === "trabajador" && user.workerId) {
      list = list.filter((e) => e.workerId === user.workerId);
    }
    if (filtroEvento) list = list.filter((e) => e.eventId === filtroEvento);
    if (filtroTrabajador) list = list.filter((e) => e.workerId === filtroTrabajador);
    if (filtroEstado) list = list.filter((e) => e.estado === filtroEstado);
    return list;
  }, [entries, user, filtroEvento, filtroTrabajador, filtroEstado]);

  const totales = useMemo(() => {
    const pendiente = misEntradas
      .filter((e) => e.estado === "pendiente")
      .reduce((s, e) => s + e.total, 0);
    const pagado = misEntradas
      .filter((e) => e.estado === "pagado")
      .reduce((s, e) => s + e.total, 0);
    const horas = misEntradas.reduce((s, e) => s + e.horasTrabajadas, 0);
    return { pendiente, pagado, horas };
  }, [misEntradas]);

  const jornadasPendientes = useMemo(() => {
    const usadas = new Set(entries.map((e) => e.attendanceId));
    return attendances.filter(
      (a) =>
        a.estado === "cerrado" &&
        a.salida &&
        !usadas.has(a.id) &&
        (!filtroEvento || a.eventId === filtroEvento) &&
        (!filtroTrabajador || a.workerId === filtroTrabajador),
    ).length;
  }, [attendances, entries, filtroEvento, filtroTrabajador]);

  async function calcularNomina() {
    if (!esAdmin || !user) return;
    setCalculando(true);
    setMensaje(null);
    try {
      const creados = await calculatePayrollFromAttendances({
        attendances,
        workers,
        rates,
        existingEntries: entries,
        actorUid: user.uid,
        actorNombre: user.nombre,
        eventId: filtroEvento || undefined,
        workerId: filtroTrabajador || undefined,
      });
      setMensaje(
        creados > 0
          ? `Se calcularon ${creados} registro(s) de nómina.`
          : "No hay jornadas cerradas nuevas para calcular.",
      );
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Error al calcular nómina");
    } finally {
      setCalculando(false);
    }
  }

  async function marcarPagado(id: string) {
    if (!esAdmin || !user) return;
    await markPayrollPaid(id, { uid: user.uid, nombre: user.nombre });
  }

  async function exportarCsv() {
    if (!user || misEntradas.length === 0) return;
    const csv = exportPayrollCsv(misEntradas);
    const fecha = new Date().toISOString().slice(0, 10);
    downloadTextFile(`nomina-${fecha}.csv`, csv);
    if (esAdmin) {
      await recordPayrollExport(
        misEntradas.map((e) => e.id),
        { uid: user.uid, nombre: user.nombre },
        `Exportación CSV (${misEntradas.length} registros)`,
      );
    }
  }

  async function guardarTarifa(perfil: string, tarifa: number) {
    if (!esAdmin) return;
    await upsertPayrollRate({
      id: `rate-${perfil}`,
      perfil,
      tarifaPorHora: tarifa,
      costoRefrigerioAlmuerzo: 12_000,
      costoRefrigerioSnack: 5_000,
      costoRefrigerioCena: 10_000,
    });
    setMensaje(`Tarifa actualizada para ${PERFILES_LABEL[perfil] ?? perfil}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nómina"
        description={
          esAdmin
            ? "Cálculo automático desde jornadas cerradas, refrigerios y exportación contable."
            : "Historial de horas trabajadas y pagos de tus jornadas."
        }
      />

      {mensaje && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {mensaje}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="font-mono text-2xl font-semibold text-accent">
            {totales.horas.toFixed(1)}h
          </div>
          <div className="text-sm text-neutral-400">Horas en el filtro</div>
        </Card>
        <Card>
          <div className="font-mono text-2xl font-semibold text-accent">
            {formatCurrencyCOP(totales.pendiente)}
          </div>
          <div className="text-sm text-neutral-400">Pendiente de pago</div>
        </Card>
        <Card>
          <div className="font-mono text-2xl font-semibold text-positive">
            {formatCurrencyCOP(totales.pagado)}
          </div>
          <div className="text-sm text-neutral-400">Ya pagado</div>
        </Card>
        {esAdmin && (
          <Card>
            <div className="font-mono text-2xl font-semibold text-alert">
              {jornadasPendientes}
            </div>
            <div className="text-sm text-neutral-400">Jornadas sin calcular</div>
          </Card>
        )}
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Filtros</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {esAdmin && (
            <label className="text-sm">
              Evento
              <select
                value={filtroEvento}
                onChange={(e) => setFiltroEvento(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                <option value="">Todos</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          {esAdmin && (
            <label className="text-sm">
              Trabajador
              <select
                value={filtroTrabajador}
                onChange={(e) => setFiltroTrabajador(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                <option value="">Todos</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm">
            Estado
            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value as "" | "pendiente" | "pagado")
              }
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {esAdmin && (
            <button
              type="button"
              onClick={calcularNomina}
              disabled={calculando}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/90 disabled:opacity-50"
            >
              {calculando ? "Calculando…" : "Calcular nómina"}
            </button>
          )}
          <button
            type="button"
            onClick={exportarCsv}
            disabled={misEntradas.length === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/50 disabled:opacity-50"
          >
            Exportar CSV
          </button>
        </div>
      </Card>

      {esAdmin && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Tarifas por perfil</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Se aplica la tarifa más alta entre los perfiles del trabajador.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-neutral-500">
                  <th className="py-2 pr-4">Perfil</th>
                  <th className="py-2 pr-4">Tarifa/hora (COP)</th>
                  <th className="py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <TarifaRow key={rate.id} rate={rate} onSave={guardarTarifa} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">
          Registros ({misEntradas.length})
        </h2>
        {misEntradas.length === 0 ? (
          <EmptyState
            title="Sin registros de nómina"
            description={
              esAdmin
                ? "Calcula la nómina desde jornadas cerradas o ajusta los filtros."
                : "Aún no hay pagos registrados para tus jornadas."
            }
            action={
              esAdmin && jornadasPendientes > 0
                ? undefined
                : esAdmin
                  ? { to: "/operacion", label: "Ir al evento" }
                  : undefined
            }
          />
        ) : (
          <div className="mt-4 space-y-3">
            {misEntradas.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border bg-bg/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{entry.workerNombre}</div>
                    <div className="text-sm text-neutral-400">
                      {entry.eventNombre} · {entry.siteNombre}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      label={PAYROLL_ESTADO_LABEL[entry.estado]}
                      tone={entry.estado === "pagado" ? "confirmado" : "pendiente"}
                    />
                    <span className="font-mono text-lg font-semibold text-accent">
                      {formatCurrencyCOP(entry.total)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-neutral-500">Horas: </span>
                    {entry.horasTrabajadas}h
                  </div>
                  <div>
                    <span className="text-neutral-500">Perfil: </span>
                    {PERFILES_LABEL[entry.perfilAplicado] ?? entry.perfilAplicado}
                  </div>
                  <div>
                    <span className="text-neutral-500">Tarifa: </span>
                    {formatCurrencyCOP(entry.tarifaAplicada)}/h
                  </div>
                  <div>
                    <span className="text-neutral-500">Subtotal horas: </span>
                    {formatCurrencyCOP(entry.subtotalHoras)}
                  </div>
                </div>
                {entry.refrigerios.length > 0 && (
                  <div className="mt-2 text-sm text-neutral-400">
                    Refrigerios:{" "}
                    {entry.refrigerios
                      .map(
                        (r) =>
                          `${REFRIGERIO_TIPO_LABEL[r.tipo]} (${formatCurrencyCOP(r.costo)})`,
                      )
                      .join(", ")}
                    {" · "}
                    Total: {formatCurrencyCOP(entry.totalRefrigerios)}
                  </div>
                )}
                <div className="mt-2 text-xs text-neutral-500">
                  {new Date(entry.periodoInicio).toLocaleString("es-CO")} →{" "}
                  {new Date(entry.periodoFin).toLocaleString("es-CO")}
                </div>
                {esAdmin && entry.estado === "pendiente" && (
                  <button
                    type="button"
                    onClick={() => marcarPagado(entry.id)}
                    className="mt-3 rounded-lg border border-positive/40 px-3 py-1.5 text-xs text-positive hover:bg-positive/10"
                  >
                    Marcar como pagado
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {esAdmin && audit.length > 0 && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Historial contable</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {audit.slice(0, 15).map((a) => (
              <li key={a.id} className="flex flex-wrap gap-2 text-neutral-400">
                <span className="text-neutral-300">{a.actorNombre}</span>
                <span>·</span>
                <span>{a.accion}</span>
                <span>·</span>
                <span>{new Date(a.timestamp).toLocaleString("es-CO")}</span>
                {a.detalle && (
                  <>
                    <span>·</span>
                    <span>{a.detalle}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function TarifaRow({
  rate,
  onSave,
}: {
  rate: { id: string; perfil: string; tarifaPorHora: number };
  onSave: (perfil: string, tarifa: number) => Promise<void>;
}) {
  const [valor, setValor] = useState(String(rate.tarifaPorHora));
  return (
    <tr className="border-b border-border/50">
      <td className="py-2 pr-4">
        {PERFILES_LABEL[rate.perfil] ?? rate.perfil}
      </td>
      <td className="py-2 pr-4">
        <input
          type="number"
          min={0}
          step={1000}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-32 rounded border border-border bg-bg px-2 py-1"
        />
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={() => onSave(rate.perfil, Number(valor))}
          className="text-xs text-accent hover:underline"
        >
          Guardar
        </button>
      </td>
    </tr>
  );
}
