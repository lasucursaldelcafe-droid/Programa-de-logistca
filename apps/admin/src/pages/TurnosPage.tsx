import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  SHIFT_LABEL,
  findTurnoConfirmadoVigente,
  puedeGestionarTurnos,
  resolveEntradaPath,
  type ShiftEstado,
  type Turno,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import {
  createShift,
  deleteShift,
  toUserFacingError,
  updateShift,
  updateShiftEstado,
  useEvents,
  useShifts,
  useSites,
  useWorkers,
} from "../hooks/useDataStore";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TurnosPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const shifts = useShifts();
  const workers = useWorkers();
  const events = useEvents();
  const sites = useSites();
  const [form, setForm] = useState({
    workerId: "",
    eventId: "",
    siteId: "",
    inicio: "",
    fin: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    siteId: "",
    inicio: "",
    fin: "",
    estado: "pendiente" as ShiftEstado,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const esAdmin = user && puedeGestionarTurnos(user.role);
  const misTurnos =
    user?.role === "trabajador" && user.workerId
      ? shifts.filter((s) => s.workerId === user.workerId)
      : shifts;

  const turnoVigente =
    user?.role === "trabajador" && user.workerId
      ? findTurnoConfirmadoVigente(shifts, user.workerId)
      : null;

  const sitesFiltrados = useMemo(
    () => sites.filter((s) => !form.eventId || s.eventId === form.eventId),
    [sites, form.eventId],
  );

  const entradaPath = resolveEntradaPath(pathname);

  async function crearTurno(e: React.FormEvent) {
    e.preventDefault();
    if (!esAdmin) return;
    setError(null);
    setMensaje(null);
    try {
      const worker = workers.find((w) => w.id === form.workerId);
      const event = events.find((ev) => ev.id === form.eventId);
      const site = sites.find((s) => s.id === form.siteId);
      await createShift({
        workerId: form.workerId,
        workerNombre: worker?.nombre ?? "",
        eventId: form.eventId,
        eventNombre: event?.nombre ?? "",
        siteId: form.siteId,
        siteNombre: site?.nombre ?? "",
        inicio: new Date(form.inicio).toISOString(),
        fin: new Date(form.fin).toISOString(),
        estado: "pendiente" satisfies ShiftEstado,
      });
      setForm({ workerId: "", eventId: "", siteId: "", inicio: "", fin: "" });
      setMensaje("Turno creado.");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo crear el turno.").message);
    }
  }

  function empezarEdicion(t: Turno) {
    setEditingId(t.id);
    setEditForm({
      siteId: t.siteId,
      inicio: toLocalInput(t.inicio),
      fin: toLocalInput(t.fin),
      estado: t.estado,
    });
    setError(null);
    setMensaje(null);
  }

  async function guardarEdicion(t: Turno) {
    setBusyId(t.id);
    setError(null);
    setMensaje(null);
    try {
      const site = sites.find((s) => s.id === editForm.siteId);
      await updateShift(t.id, {
        siteId: editForm.siteId,
        siteNombre: site?.nombre ?? t.siteNombre,
        inicio: new Date(editForm.inicio).toISOString(),
        fin: new Date(editForm.fin).toISOString(),
        estado: editForm.estado,
      });
      setEditingId(null);
      setMensaje("Turno actualizado.");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo modificar el turno.").message);
    } finally {
      setBusyId(null);
    }
  }

  async function eliminarTurno(id: string) {
    if (!window.confirm("¿Eliminar este turno?")) return;
    setBusyId(id);
    setError(null);
    setMensaje(null);
    try {
      await deleteShift(id);
      if (editingId === id) setEditingId(null);
      setMensaje("Turno eliminado.");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo eliminar el turno.").message);
    } finally {
      setBusyId(null);
    }
  }

  async function responderTurno(id: string, estado: "confirmado" | "rechazado") {
    setBusyId(id);
    setError(null);
    setMensaje(null);
    try {
      await updateShiftEstado(id, estado);
      setMensaje(
        estado === "confirmado"
          ? "Trabajo aceptado. Cuando llegues al sitio, activa la jornada."
          : "Turno rechazado.",
      );
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo responder al turno.").message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Turnos</h1>
        <p className="mt-1 text-neutral-400">
          Asignación por evento/sitio. Los trabajadores pueden aceptar o rechazar.
          {user?.role === "trabajador" && (
            <>
              {" "}
              <Link to={entradaPath} className="text-accent hover:underline">
                Marcar entrada / ya estoy aquí
              </Link>
            </>
          )}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
          {error}
        </p>
      )}
      {mensaje && (
        <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
          {mensaje}
        </p>
      )}

      {user?.role === "trabajador" && turnoVigente && (
        <Card className="border-positive/30 bg-positive/5">
          <p className="text-sm font-medium text-positive">Turno vigente ahora</p>
          <p className="mt-1 text-neutral-200">
            {turnoVigente.siteNombre} · {turnoVigente.eventNombre}
          </p>
          <Link
            to={entradaPath}
            className="mt-3 inline-block rounded-lg bg-positive px-4 py-2 text-sm font-semibold text-black"
          >
            Ya estoy aquí — activar jornada
          </Link>
        </Card>
      )}

      {esAdmin && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Asignar turno</h2>
          <form onSubmit={(e) => void crearTurno(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Trabajador
              <select
                value={form.workerId}
                onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              >
                <option value="">Seleccionar…</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Evento
              <select
                value={form.eventId}
                onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value, siteId: "" }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              >
                <option value="">Seleccionar…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Sitio
              <select
                value={form.siteId}
                onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              >
                <option value="">Seleccionar…</option>
                {sitesFiltrados.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Inicio
              <input
                type="datetime-local"
                value={form.inicio}
                onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Fin
              <input
                type="datetime-local"
                value={form.fin}
                onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
              >
                Crear turno
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {misTurnos.map((t) => {
          const sitesDelEvento = sites.filter((s) => s.eventId === t.eventId);
          const editing = editingId === t.id;
          return (
            <Card
              key={t.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold">{t.workerNombre ?? t.workerId}</div>
                <div className="mt-1 text-sm text-neutral-400">
                  {t.eventNombre} · {t.siteNombre}
                </div>
                <div className="mt-1 font-mono text-xs text-neutral-500">
                  {new Date(t.inicio).toLocaleString("es-CO")} →{" "}
                  {new Date(t.fin).toLocaleString("es-CO")}
                </div>
                {esAdmin && editing && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-neutral-400">
                      Sitio
                      <select
                        value={editForm.siteId}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, siteId: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-neutral-200"
                      >
                        {sitesDelEvento.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-neutral-400">
                      Estado
                      <select
                        value={editForm.estado}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            estado: e.target.value as ShiftEstado,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-neutral-200"
                      >
                        {(Object.keys(SHIFT_LABEL) as ShiftEstado[]).map((k) => (
                          <option key={k} value={k}>
                            {SHIFT_LABEL[k]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-neutral-400">
                      Inicio
                      <input
                        type="datetime-local"
                        value={editForm.inicio}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, inicio: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-neutral-200"
                      />
                    </label>
                    <label className="text-xs text-neutral-400">
                      Fin
                      <input
                        type="datetime-local"
                        value={editForm.fin}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, fin: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-neutral-200"
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={SHIFT_LABEL[t.estado]} tone={t.estado} />
                {user?.role === "trabajador" && t.estado === "pendiente" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void responderTurno(t.id, "confirmado")}
                      className="rounded-lg bg-positive/20 px-3 py-1 text-xs text-positive disabled:opacity-50"
                    >
                      {busyId === t.id ? "…" : "Aceptar trabajo"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void responderTurno(t.id, "rechazado")}
                      className="rounded-lg bg-alert/20 px-3 py-1 text-xs text-alert disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {user?.role === "trabajador" &&
                  t.estado === "confirmado" &&
                  turnoVigente?.id === t.id && (
                    <Link
                      to={entradaPath}
                      className="rounded-lg bg-positive/20 px-3 py-1 text-xs font-semibold text-positive"
                    >
                      Ya estoy aquí
                    </Link>
                  )}
                {esAdmin && !editing && (
                  <>
                    <button
                      type="button"
                      onClick={() => empezarEdicion(t)}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-neutral-300 hover:border-accent/40"
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void eliminarTurno(t.id)}
                      className="rounded-lg border border-alert/40 px-3 py-1 text-xs text-alert hover:bg-alert/10 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </>
                )}
                {esAdmin && editing && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void guardarEdicion(t)}
                      className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {busyId === t.id ? "…" : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-border px-3 py-1 text-xs"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        {misTurnos.length === 0 && (
          <p className="text-sm text-neutral-500">No hay turnos para mostrar.</p>
        )}
      </div>
    </div>
  );
}
