import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ATTENDANCE_LABEL,
  SHIFT_LABEL,
  buildDashboardKpis,
  puedeGestionarTurnos,
  type ShiftEstado,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { MetricCard } from "../components/dashboard/MetricCard";
import {
  createShift,
  deleteShift,
  useAttendances,
  useEvents,
  useQrCodes,
  useShifts,
  useSites,
  useWorkers,
} from "../hooks/useDataStore";
import { useSetupConfig } from "../hooks/useSetup";

const EVENTO_STORAGE_KEY = "spe-evento-operacion";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OperacionEventoPage() {
  const { user } = useAuth();
  const events = useEvents();
  const sites = useSites();
  const shifts = useShifts();
  const workers = useWorkers();
  const attendances = useAttendances();
  const qrCodes = useQrCodes();
  const setupConfig = useSetupConfig();

  const [eventId, setEventId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    workerId: "",
    siteId: "",
    inicio: "",
    fin: "",
  });

  useEffect(() => {
    if (events.length === 0) return;
    const stored = sessionStorage.getItem(EVENTO_STORAGE_KEY);
    const fromSetup = setupConfig?.eventoId;
    const initial =
      (stored && events.some((e) => e.id === stored) ? stored : null) ??
      (fromSetup && events.some((e) => e.id === fromSetup) ? fromSetup : null) ??
      events[0]?.id ??
      "";
    setEventId(initial);
  }, [events, setupConfig?.eventoId]);

  useEffect(() => {
    if (eventId) sessionStorage.setItem(EVENTO_STORAGE_KEY, eventId);
  }, [eventId]);

  const evento = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );

  const sitiosEvento = useMemo(
    () => sites.filter((s) => s.eventId === eventId),
    [sites, eventId],
  );

  const turnosEvento = useMemo(
    () => shifts.filter((s) => s.eventId === eventId),
    [shifts, eventId],
  );

  const asistenciasEvento = useMemo(
    () => attendances.filter((a) => a.eventId === eventId),
    [attendances, eventId],
  );

  const qrEvento = useMemo(
    () => qrCodes.filter((q) => q.eventId === eventId && q.activo),
    [qrCodes, eventId],
  );

  const kpis = useMemo(
    () =>
      buildDashboardKpis({
        workers,
        shifts,
        attendances,
        payroll: [],
        invitations: [],
        eventId: eventId || undefined,
      }),
    [workers, shifts, attendances, eventId],
  );

  const checklist = useMemo(() => {
    const sitiosConQr = sitiosEvento.filter((s) =>
      qrEvento.some((q) => q.siteId === s.id),
    ).length;
    const jornadasActivas = asistenciasEvento.filter((a) => a.estado !== "cerrado");
    const alertas = jornadasActivas.filter(
      (a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual",
    );

    return [
      {
        label: "Sitios del evento",
        ok: sitiosEvento.length > 0,
        detalle: `${sitiosEvento.length} sitio(s)`,
      },
      {
        label: "QR activos",
        ok: sitiosEvento.length > 0 && sitiosConQr === sitiosEvento.length,
        detalle: `${sitiosConQr}/${sitiosEvento.length} sitios con QR`,
      },
      {
        label: "Personal asignado",
        ok: turnosEvento.length > 0,
        detalle: `${new Set(turnosEvento.map((t) => t.workerId)).size} persona(s) · ${turnosEvento.length} turno(s)`,
      },
      {
        label: "Operación en curso",
        ok: jornadasActivas.length > 0,
        detalle: `${jornadasActivas.length} jornada(s) activa(s)`,
      },
      {
        label: "Alertas GPS",
        ok: alertas.length === 0,
        detalle: alertas.length === 0 ? "Sin alertas" : `${alertas.length} alerta(s)`,
      },
    ];
  }, [sitiosEvento, qrEvento, turnosEvento, asistenciasEvento]);

  useEffect(() => {
    if (!evento) return;
    setAddForm((f) => ({
      ...f,
      inicio: f.inicio || toDatetimeLocal(evento.fechaInicio),
      fin: f.fin || toDatetimeLocal(evento.fechaFin),
    }));
  }, [evento]);

  if (!user || !puedeGestionarTurnos(user.role)) {
    return <p className="text-neutral-400">Sin permisos para operar eventos.</p>;
  }

  async function agregarEmpleado(e: React.FormEvent) {
    e.preventDefault();
    if (!evento) return;
    setError(null);
    setMensaje(null);
    const worker = workers.find((w) => w.id === addForm.workerId);
    const site = sitiosEvento.find((s) => s.id === addForm.siteId);
    if (!worker || !site) {
      setError("Selecciona trabajador y sitio.");
      return;
    }
    if (worker.habilitado === false) {
      setError("El trabajador está inhabilitado. Actívalo en Personal.");
      return;
    }
    setBusy(true);
    try {
      await createShift({
        workerId: worker.id,
        workerNombre: worker.nombre,
        eventId: evento.id,
        eventNombre: evento.nombre,
        siteId: site.id,
        siteNombre: site.nombre,
        inicio: new Date(addForm.inicio).toISOString(),
        fin: new Date(addForm.fin).toISOString(),
        estado: "pendiente" satisfies ShiftEstado,
      });
      setMensaje(`${worker.nombre} agregado al evento (${site.nombre}).`);
      setAddForm((f) => ({ ...f, workerId: "", siteId: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar empleado");
    } finally {
      setBusy(false);
    }
  }

  async function quitarDelEvento(shiftId: string, workerNombre?: string) {
    setError(null);
    setMensaje(null);
    if (
      !window.confirm(
        `¿Quitar a ${workerNombre ?? "este empleado"} del evento? Se eliminará su turno asignado.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteShift(shiftId);
      setMensaje(`${workerNombre ?? "Empleado"} quitado del evento.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al quitar empleado");
    } finally {
      setBusy(false);
    }
  }

  function jornadaDeTurno(shiftId: string) {
    return asistenciasEvento.find(
      (a) => a.shiftId === shiftId && a.estado !== "cerrado",
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold">Operación por evento</h1>
        <Card>
          <p className="text-sm text-neutral-400">
            No hay eventos creados.{" "}
            <Link to="/configuracion" className="text-accent hover:underline">
              Crea un evento en Configuración
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Operación por evento</h1>
          <p className="mt-1 max-w-2xl text-neutral-400">
            Selecciona un evento para revisar que todo funcione (sitios, QR, GPS) y agregar o
            quitar empleados del equipo.
          </p>
        </div>
        <label className="text-sm">
          Evento
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 block min-w-[220px] rounded-lg border border-border bg-bg px-3 py-2"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-alert/40 bg-alert/10 px-4 py-3 text-sm text-alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="rounded-lg border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-positive">
          {mensaje}
        </div>
      )}

      {evento && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard value={kpis.workersEnSitio} label="En sitio ahora" tone="positive" />
            <MetricCard value={kpis.jornadasActivas} label="Jornadas GPS" tone="positive" />
            <MetricCard value={kpis.turnosPendientes} label="Turnos pendientes" tone="accent" />
            <MetricCard value={kpis.alertasGeocerca} label="Alertas geocerca" tone="alert" />
            <MetricCard
              value={sitiosEvento.length}
              label="Sitios"
              sublabel={`${qrEvento.length} QR activos`}
            />
          </div>

          <Card>
            <h2 className="font-display text-lg font-semibold">Estado del evento</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {evento.nombre} ·{" "}
              {new Date(evento.fechaInicio).toLocaleString("es-CO")} →{" "}
              {new Date(evento.fechaFin).toLocaleString("es-CO")}
            </p>
            <ul className="mt-4 space-y-2">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm"
                >
                  <span>{item.label}</span>
                  <span className="text-neutral-500">{item.detalle}</span>
                  <span className={item.ok ? "text-positive" : "text-accent"}>
                    {item.ok ? "✓ OK" : "○ Revisar"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link to="/mapa" className="rounded-lg border border-border px-3 py-1.5 hover:border-accent/50">
                Mapa en vivo
              </Link>
              <Link to="/supervision" className="rounded-lg border border-border px-3 py-1.5 hover:border-accent/50">
                Supervisión GPS
              </Link>
              <Link to="/comunicacion" className="rounded-lg border border-border px-3 py-1.5 hover:border-accent/50">
                Comunicación
              </Link>
              <Link to="/qr-sitios" className="rounded-lg border border-border px-3 py-1.5 hover:border-accent/50">
                QR y sitios
              </Link>
              <Link to="/personal" className="rounded-lg border border-border px-3 py-1.5 hover:border-accent/50">
                Registrar personal
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">Agregar empleado al evento</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Asigna un turno en un sitio del evento. El trabajador recibe notificación en la app y
              correo automático con evento, sitio y horario.
            </p>
            {sitiosEvento.length === 0 ? (
              <p className="mt-4 text-sm text-accent">
                Primero agrega sitios en{" "}
                <Link to="/configuracion" className="underline">
                  Configuración
                </Link>
                .
              </p>
            ) : (
              <form onSubmit={agregarEmpleado} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Trabajador
                  <select
                    value={addForm.workerId}
                    onChange={(e) => setAddForm((f) => ({ ...f, workerId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {workers
                      .filter((w) => w.habilitado !== false)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nombre}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm">
                  Sitio
                  <select
                    value={addForm.siteId}
                    onChange={(e) => setAddForm((f) => ({ ...f, siteId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {sitiosEvento.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Inicio turno
                  <input
                    type="datetime-local"
                    value={addForm.inicio}
                    onChange={(e) => setAddForm((f) => ({ ...f, inicio: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                    required
                  />
                </label>
                <label className="text-sm">
                  Fin turno
                  <input
                    type="datetime-local"
                    value={addForm.fin}
                    onChange={(e) => setAddForm((f) => ({ ...f, fin: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                    required
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
                  >
                    {busy ? "Guardando…" : "Agregar al evento"}
                  </button>
                </div>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">Equipo del evento</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {turnosEvento.length === 0
                ? "Aún no hay empleados asignados a este evento."
                : "Turnos, estado de aceptación y jornada GPS en tiempo real."}
            </p>
            <div className="mt-4 space-y-3">
              {turnosEvento.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Usa el formulario de arriba para agregar personal.
                </p>
              ) : (
                turnosEvento.map((t) => {
                  const jornada = jornadaDeTurno(t.id);
                  return (
                    <div
                      key={t.id}
                      className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium">{t.workerNombre ?? t.workerId}</div>
                        <div className="mt-1 text-sm text-neutral-400">
                          {t.siteNombre} ·{" "}
                          {new Date(t.inicio).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}{" "}
                          →{" "}
                          {new Date(t.fin).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                        {jornada && (
                          <div className="mt-1 text-xs text-neutral-500">
                            Jornada: {ATTENDANCE_LABEL[jornada.estado]}
                            {jornada.ubicacionActual && (
                              <span className="ml-2 font-mono">
                                {jornada.ubicacionActual.lat.toFixed(5)},{" "}
                                {jornada.ubicacionActual.lng.toFixed(5)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge label={SHIFT_LABEL[t.estado]} tone={t.estado} />
                        {jornada && (
                          <Badge
                            label={ATTENDANCE_LABEL[jornada.estado]}
                            tone={
                              jornada.estado === "fuera_geocerca" ? "rechazado" : "confirmado"
                            }
                          />
                        )}
                        <button
                          type="button"
                          disabled={busy || Boolean(jornada)}
                          onClick={() => void quitarDelEvento(t.id, t.workerNombre)}
                          className="rounded-lg border border-alert/40 px-3 py-1 text-xs text-alert hover:bg-alert/10 disabled:opacity-40"
                          title={
                            jornada
                              ? "Cierra la jornada antes de quitar del evento"
                              : "Quitar turno del evento"
                          }
                        >
                          Quitar del evento
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
