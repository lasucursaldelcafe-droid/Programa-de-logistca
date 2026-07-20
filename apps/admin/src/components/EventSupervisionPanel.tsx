import { useMemo, useState } from "react";
import { ATTENDANCE_LABEL, type Attendance, type Evento, type Sitio } from "@spe/shared";
import { Badge, Card } from "./ui";
import { LiveMap, liveMapUsesGoogle } from "./LiveMap";
import { isGoogleMapsEnabled } from "../lib/googleMaps";

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
  const [view, setView] = useState<SupervisionView>("general");
  const [individualMode, setIndividualMode] = useState<IndividualMode>("sitio");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedAttendanceId, setSelectedAttendanceId] = useState("");

  const activas = useMemo(() => activasDeEvento(attendances), [attendances]);
  const alertas = useMemo(
    () => activas.filter((a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual"),
    [activas],
  );

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
                <LiveMap sites={mapSitesGeneral} attendances={mapAttendancesGeneral} className="h-[28rem]" />
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
                            <Badge
                              label={ATTENDANCE_LABEL[a.estado]}
                              tone={a.estado === "fuera_geocerca" ? "rechazado" : "confirmado"}
                            />
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
                  className="h-[26rem]"
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
                      <Badge
                        label={ATTENDANCE_LABEL[a.estado]}
                        tone={a.estado === "fuera_geocerca" ? "rechazado" : "confirmado"}
                      />
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
            </Card>
          )}
        </>
      )}
    </div>
  );
}
