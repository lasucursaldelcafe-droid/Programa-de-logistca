import { useMemo, useState } from "react";
import {
  ATTENDANCE_LABEL,
  puedeGestionarTurnos,
  type Attendance,
  type Evento,
  type Sitio,
} from "@spe/shared";
import { Badge, Card } from "./ui";
import { LiveMap, liveMapUsesGoogle } from "./LiveMap";
import { isGoogleMapsEnabled } from "../lib/googleMaps";
import { useAuth } from "../contexts/AuthContext";
import {
  adminCloseAttendance,
  adminOpenAttendance,
  toUserFacingError,
  useShifts,
  useWorkers,
} from "../hooks/useDataStore";

type SupervisionView = "general" | "individual";
type IndividualMode = "sitio" | "persona";

interface EventSupervisionPanelProps {
  evento: Evento;
  sites: Sitio[];
  attendances: Attendance[];
}

function activasDeEvento(attendances: Attendance[]): Attendance[] {
  return attendances.filter((a) => a.estado !== "cerrado");
}

export function EventSupervisionPanel({ evento, sites, attendances }: EventSupervisionPanelProps) {
  const { user } = useAuth();
  const shifts = useShifts();
  const workers = useWorkers();
  const canManage = Boolean(user && puedeGestionarTurnos(user.role));

  const [view, setView] = useState<SupervisionView>("general");
  const [individualMode, setIndividualMode] = useState<IndividualMode>("sitio");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedAttendanceId, setSelectedAttendanceId] = useState("");
  const [openShiftId, setOpenShiftId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const activas = useMemo(
    () => activasDeEvento(attendances).filter((a) => a.eventId === evento.id),
    [attendances, evento.id],
  );
  const alertas = useMemo(
    () => activas.filter((a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual"),
    [activas],
  );

  const turnosDisponibles = useMemo(() => {
    const activosWorkerIds = new Set(activas.map((a) => a.workerId));
    return shifts.filter(
      (s) =>
        s.eventId === evento.id &&
        (s.estado === "confirmado" || s.estado === "pendiente") &&
        !activosWorkerIds.has(s.workerId),
    );
  }, [shifts, evento.id, activas]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? sites[0] ?? null;
  const selectedAttendance =
    activas.find((a) => a.id === selectedAttendanceId) ?? activas[0] ?? null;

  const mapSitesGeneral = sites;
  const mapAttendancesGeneral = activas;

  const mapSitesIndividual = useMemo(() => {
    if (individualMode === "sitio" && selectedSite) return [selectedSite];
    if (individualMode === "persona" && selectedAttendance) {
      const site = sites.find((s) => s.id === selectedAttendance.siteId);
      return site ? [site] : [];
    }
    return [];
  }, [individualMode, selectedSite, selectedAttendance, sites]);

  const mapAttendancesIndividual = useMemo(() => {
    if (individualMode === "sitio" && selectedSite) {
      return activas.filter((a) => a.siteId === selectedSite.id);
    }
    if (individualMode === "persona" && selectedAttendance) {
      return [selectedAttendance];
    }
    return [];
  }, [individualMode, selectedSite, selectedAttendance, activas]);

  const porSitio = useMemo(() => {
    return sites.map((site) => {
      const enSitio = activas.filter((a) => a.siteId === site.id);
      const alertasSitio = enSitio.filter(
        (a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual",
      );
      return { site, enSitio, alertasSitio };
    });
  }, [sites, activas]);

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      active ? "bg-accent text-bg" : "border border-border text-neutral-400 hover:border-accent/40"
    }`;

  async function cerrarJornada(attendanceId: string, nombre: string) {
    if (!window.confirm(`¿Cerrar la jornada de ${nombre}?`)) return;
    setBusyId(attendanceId);
    setError(null);
    setMensaje(null);
    try {
      await adminCloseAttendance(attendanceId);
      setMensaje(`Jornada de ${nombre} cerrada.`);
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo cerrar la jornada.").message);
    } finally {
      setBusyId(null);
    }
  }

  async function abrirJornada(e: React.FormEvent) {
    e.preventDefault();
    if (!openShiftId) return;
    const shift = shifts.find((s) => s.id === openShiftId);
    if (!shift) return;
    const worker = workers.find((w) => w.id === shift.workerId);
    setBusyId(`open-${openShiftId}`);
    setError(null);
    setMensaje(null);
    try {
      await adminOpenAttendance({
        workerId: shift.workerId,
        workerNombre: worker?.nombre ?? shift.workerNombre ?? shift.workerId,
        shiftId: shift.id,
        shifts,
      });
      setOpenShiftId("");
      setMensaje(`Jornada abierta para ${worker?.nombre ?? shift.workerNombre}.`);
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo abrir la jornada.").message);
    } finally {
      setBusyId(null);
    }
  }

  function JornadaActions({ a }: { a: Attendance }) {
    if (!canManage) return null;
    return (
      <button
        type="button"
        disabled={busyId === a.id}
        onClick={() => void cerrarJornada(a.id, a.workerNombre ?? a.workerId)}
        className="rounded-lg border border-alert/40 px-2 py-1 text-xs text-alert hover:bg-alert/10 disabled:opacity-50"
      >
        {busyId === a.id ? "…" : "Cerrar jornada"}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Supervisión GPS</p>
          <h2 className="font-display text-xl font-semibold">{evento.nombre}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Mapa exclusivo de este evento — plano general del recinto o seguimiento individual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={tabClass(view === "general")} onClick={() => setView("general")}>
            Plano general
          </button>
          <button
            type="button"
            className={tabClass(view === "individual")}
            onClick={() => setView("individual")}
          >
            Plano individual
          </button>
        </div>
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

      {canManage && (
        <Card className="space-y-3">
          <h3 className="font-display text-lg font-semibold">Gestionar jornadas</h3>
          <p className="text-sm text-neutral-500">
            Dirección y oficina pueden abrir o cerrar jornadas sin estar en la app de campo.
          </p>
          <form onSubmit={(e) => void abrirJornada(e)} className="flex flex-wrap items-end gap-2">
            <label className="min-w-[200px] flex-1 text-sm">
              Abrir jornada (turno del evento)
              <select
                value={openShiftId}
                onChange={(e) => setOpenShiftId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              >
                <option value="">Seleccionar turno…</option>
                {turnosDisponibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.workerNombre} · {s.siteNombre} ({s.estado})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={!openShiftId || busyId?.startsWith("open-")}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busyId?.startsWith("open-") ? "Abriendo…" : "Abrir jornada"}
            </button>
          </form>
          {turnosDisponibles.length === 0 && (
            <p className="text-xs text-neutral-500">
              No hay turnos pendientes/confirmados sin jornada, o ya están todos activos.
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="font-mono text-2xl font-semibold text-positive">{activas.length}</div>
          <div className="text-sm text-neutral-400">Jornadas activas</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono text-2xl font-semibold text-accent">{sites.length}</div>
          <div className="text-sm text-neutral-400">Sitios del evento</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono text-2xl font-semibold text-alert">{alertas.length}</div>
          <div className="text-sm text-neutral-400">Alertas GPS</div>
        </Card>
      </div>

      {view === "general" ? (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold">Plano general del evento</h3>
              <span className="text-xs text-neutral-500">
                {liveMapUsesGoogle() ? "Google Maps" : "Vista esquemática"}
              </span>
            </div>
            {!isGoogleMapsEnabled() && (
              <p className="mt-2 text-xs text-neutral-500">
                Configura la API de Google Maps para mapa satelital en producción.
              </p>
            )}
            <div className="mt-4">
              {sites.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Agrega sitios en el asistente de evento para ver el plano.
                </p>
              ) : (
                <LiveMap sites={mapSitesGeneral} attendances={mapAttendancesGeneral} className="spe-map-frame" />
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-lg font-semibold">Resumen por sitio</h3>
            <div className="mt-4 space-y-3">
              {porSitio.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin sitios configurados.</p>
              ) : (
                porSitio.map(({ site, enSitio, alertasSitio }) => (
                  <div
                    key={site.id}
                    className="rounded-lg border border-border bg-bg px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{site.nombre}</div>
                        <div className="text-xs text-neutral-500">
                          {site.direccion || "Sin dirección"} · radio {site.radioGeocerca} m
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-positive/15 px-2 py-0.5 text-positive">
                          {enSitio.length} activo(s)
                        </span>
                        {alertasSitio.length > 0 && (
                          <span className="rounded-full bg-alert/15 px-2 py-0.5 text-alert">
                            {alertasSitio.length} alerta(s)
                          </span>
                        )}
                      </div>
                    </div>
                    {enSitio.length > 0 && (
                      <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                        {enSitio.map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span>{a.workerNombre}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                label={ATTENDANCE_LABEL[a.estado]}
                                tone={a.estado === "fuera_geocerca" ? "rechazado" : "confirmado"}
                              />
                              <JornadaActions a={a} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={tabClass(individualMode === "sitio")}
                onClick={() => setIndividualMode("sitio")}
              >
                Por sitio
              </button>
              <button
                type="button"
                className={tabClass(individualMode === "persona")}
                onClick={() => setIndividualMode("persona")}
              >
                Por persona
              </button>
            </div>

            {individualMode === "sitio" ? (
              <label className="block text-sm">
                Sitio a supervisar
                <select
                  value={selectedSite?.id ?? ""}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="mt-1 w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm">
                Persona a supervisar
                <select
                  value={selectedAttendance?.id ?? ""}
                  onChange={(e) => setSelectedAttendanceId(e.target.value)}
                  className="mt-1 w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2"
                >
                  {activas.length === 0 ? (
                    <option value="">Sin jornadas activas</option>
                  ) : (
                    activas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.workerNombre} — {a.siteNombre}
                      </option>
                    ))
                  )}
                </select>
              </label>
            )}
          </Card>

          <Card>
            <h3 className="font-display text-lg font-semibold">Plano individual</h3>
            <div className="mt-4">
              {mapSitesIndividual.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  {individualMode === "persona" && activas.length === 0
                    ? "No hay personal con jornada activa en este evento."
                    : "Selecciona un sitio o persona para ver el detalle."}
                </p>
              ) : (
                <LiveMap
                  sites={mapSitesIndividual}
                  attendances={mapAttendancesIndividual}
                  className="spe-map-frame"
                />
              )}
            </div>
          </Card>

          {individualMode === "sitio" && selectedSite && (
            <Card>
              <h3 className="font-display text-lg font-semibold">{selectedSite.nombre}</h3>
              <p className="mt-1 text-sm text-neutral-500">{selectedSite.direccion}</p>
              <ul className="mt-4 space-y-2">
                {mapAttendancesIndividual.length === 0 ? (
                  <li className="text-sm text-neutral-500">Nadie con jornada activa en este sitio.</li>
                ) : (
                  mapAttendancesIndividual.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{a.workerNombre}</div>
                        {a.ubicacionActual && (
                          <div className="font-mono text-xs text-neutral-500">
                            {a.ubicacionActual.lat.toFixed(5)}, {a.ubicacionActual.lng.toFixed(5)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          label={ATTENDANCE_LABEL[a.estado]}
                          tone={a.estado === "fuera_geocerca" ? "rechazado" : "confirmado"}
                        />
                        <JornadaActions a={a} />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          )}

          {individualMode === "persona" && selectedAttendance && (
            <Card>
              <h3 className="font-display text-lg font-semibold">{selectedAttendance.workerNombre}</h3>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">Sitio</dt>
                  <dd>{selectedAttendance.siteNombre}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Estado jornada</dt>
                  <dd>
                    <Badge
                      label={ATTENDANCE_LABEL[selectedAttendance.estado]}
                      tone={
                        selectedAttendance.estado === "fuera_geocerca" ? "rechazado" : "confirmado"
                      }
                    />
                  </dd>
                </div>
                {selectedAttendance.ubicacionActual && (
                  <div className="sm:col-span-2">
                    <dt className="text-neutral-500">Última ubicación</dt>
                    <dd className="font-mono text-xs">
                      {selectedAttendance.ubicacionActual.lat.toFixed(5)},{" "}
                      {selectedAttendance.ubicacionActual.lng.toFixed(5)}
                    </dd>
                  </div>
                )}
              </dl>
              {canManage && (
                <div className="mt-4">
                  <JornadaActions a={selectedAttendance} />
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
