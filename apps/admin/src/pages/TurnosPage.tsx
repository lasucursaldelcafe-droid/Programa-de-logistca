import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  SHIFT_LABEL,
  puedeGestionarTurnos,
  resolveEntradaPath,
  type ShiftEstado,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import {
  createShift,
  updateShiftEstado,
  useEvents,
  useShifts,
  useSites,
  useWorkers,
} from "../hooks/useDataStore";

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

  const esAdmin = user && puedeGestionarTurnos(user.role);
  const misTurnos =
    user?.role === "trabajador" && user.workerId
      ? shifts.filter((s) => s.workerId === user.workerId)
      : shifts;

  async function crearTurno(e: React.FormEvent) {
    e.preventDefault();
    if (!esAdmin) return;
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
  }

  async function responderTurno(id: string, estado: "confirmado" | "rechazado") {
    await updateShiftEstado(id, estado);
  }

  const sitesFiltrados = sites.filter((s) => !form.eventId || s.eventId === form.eventId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Turnos</h1>
        <p className="mt-1 text-neutral-400">
          Asignación por evento/sitio. Los trabajadores pueden aceptar o rechazar.
          {user?.role === "trabajador" && (
            <>
              {" "}
              <Link to={resolveEntradaPath(pathname)} className="text-accent hover:underline">
                Marcar entrada con QR
              </Link>
            </>
          )}
        </p>
      </div>

      {esAdmin && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Asignar turno</h2>
          <form onSubmit={crearTurno} className="mt-4 grid gap-3 sm:grid-cols-2">
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
        {misTurnos.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-display font-semibold">{t.workerNombre ?? t.workerId}</div>
              <div className="mt-1 text-sm text-neutral-400">
                {t.eventNombre} · {t.siteNombre}
              </div>
              <div className="mt-1 font-mono text-xs text-neutral-500">
                {new Date(t.inicio).toLocaleString("es-CO")} →{" "}
                {new Date(t.fin).toLocaleString("es-CO")}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={SHIFT_LABEL[t.estado]} tone={t.estado} />
              {user?.role === "trabajador" && t.estado === "pendiente" && (
                <>
                  <button
                    type="button"
                    onClick={() => responderTurno(t.id, "confirmado")}
                    className="rounded-lg bg-positive/20 px-3 py-1 text-xs text-positive"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => responderTurno(t.id, "rechazado")}
                    className="rounded-lg bg-alert/20 px-3 py-1 text-xs text-alert"
                  >
                    Rechazar
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}
        {misTurnos.length === 0 && (
          <p className="text-sm text-neutral-500">No hay turnos para mostrar.</p>
        )}
      </div>
    </div>
  );
}
