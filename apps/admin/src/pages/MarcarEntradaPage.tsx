import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ATTENDANCE_LABEL,
  findProximoTurnoConfirmado,
  parseQrPayload,
  resolveTurnosPath,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { TematicaEventoCard } from "../components/TematicaEventoCard";
import { getCurrentPosition } from "../lib/geolocation";
import { useGeofenceMonitor } from "../hooks/useGeofenceMonitor";
import {
  checkInWithQr,
  checkOut,
  getActiveAttendance,
  useAttendances,
  useEvents,
  useQrCodes,
  useShifts,
  useSites,
} from "../hooks/useDataStore";

export function MarcarEntradaPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const shifts = useShifts();
  const sites = useSites();
  const events = useEvents();
  const qrCodes = useQrCodes();
  const attendances = useAttendances();
  const [rawQr, setRawQr] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [pendingQr, setPendingQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("qr")?.trim();
    if (!fromQuery) return;
    setRawQr(fromQuery);
    if (parseQrPayload(fromQuery)) {
      setPendingQr(fromQuery);
      setConsentAccepted(false);
    }
  }, [searchParams]);

  const workerId = user?.workerId ?? "";
  const workerNombre = user?.nombre ?? "";
  const active = workerId ? getActiveAttendance(attendances, workerId) : null;
  const activeSite = active ? sites.find((s) => s.id === active.siteId) ?? null : null;
  const { dentroGeocerca, gpsError } = useGeofenceMonitor(active, activeSite, Boolean(active));

  const eventoPorId = useMemo(
    () => new Map(events.map((e) => [e.id, e])),
    [events],
  );

  const proximoTurno = useMemo(
    () => (workerId ? findProximoTurnoConfirmado(shifts, workerId) : null),
    [shifts, workerId],
  );

  const eventoProximoTurno = proximoTurno
    ? eventoPorId.get(proximoTurno.eventId) ?? null
    : null;

  if (
    !user ||
    (user.role !== "trabajador" && user.role !== "supervisor_sitio") ||
    !user.workerId
  ) {
    return <p className="text-neutral-400">Solo personal de campo puede marcar entrada.</p>;
  }

  async function iniciarCheckin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = rawQr.trim();
    const parsed = parseQrPayload(trimmed);
    const qr = parsed
      ? qrCodes.find((q) => q.id === parsed.qrId)
      : qrCodes.find((q) => trimmed.includes(q.id));
    if (qr) {
      setPendingQr(trimmed);
      setConsentAccepted(false);
      return;
    }
    setError("Pega un código QR válido del sitio (o el enlace unirse-qr).");
  }

  async function confirmarEntrada() {
    if (!pendingQr || !consentAccepted) return;
    setSubmitting(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      await checkInWithQr({
        rawQr: pendingQr,
        workerId,
        workerNombre,
        shifts,
        position,
      });
      setPendingQr(null);
      setRawQr("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar entrada");
    } finally {
      setSubmitting(false);
    }
  }

  async function marcarSalida() {
    if (!active) return;
    setSubmitting(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      await checkOut(active.id, position);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar salida");
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    const eventoActivo = eventoPorId.get(active.eventId) ?? null;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Jornada activa</h1>
          <p className="mt-1 text-neutral-400">
            GPS activo solo durante esta jornada.
          </p>
        </div>

        <TematicaEventoCard
          evento={eventoActivo}
          titulo="Recordatorio del evento"
        />

        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Badge label={ATTENDANCE_LABEL[active.estado]} tone={active.estado === "fuera_geocerca" ? "rechazado" : "confirmado"} />
            <span className="text-sm text-neutral-300">
              {active.siteNombre} · {active.eventNombre}
            </span>
          </div>
          <p className="mt-3 text-sm text-neutral-400">
            Entrada: {new Date(active.entrada.timestamp).toLocaleString("es-CO")}
            {active.entrada.dentroGeocerca ? " (dentro de geocerca)" : " (revisión manual)"}
          </p>
          {activeSite && (
            <p className={`mt-2 text-sm ${dentroGeocerca ? "text-positive" : "text-alert"}`}>
              {dentroGeocerca
                ? `Dentro de geocerca (${activeSite.radioGeocerca}m)`
                : "Fuera de geocerca — se notificó al administrador"}
            </p>
          )}
          {active.ubicacionActual && (
            <p className="mt-2 font-mono text-xs text-neutral-500">
              GPS: {active.ubicacionActual.lat.toFixed(5)}, {active.ubicacionActual.lng.toFixed(5)}
            </p>
          )}
          {gpsError && <p className="mt-2 text-xs text-alert">{gpsError}</p>}
          {active.alertasGeocerca.length > 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Alertas de geocerca: {active.alertasGeocerca.length}
            </p>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={marcarSalida}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitting ? "Cerrando…" : "Marcar salida"}
          </button>
        </Card>
      </div>
    );
  }

  if (pendingQr) {
    const qr = qrCodes.find((q) => pendingQr.includes(q.id));
    const eventoQr = qr ? eventoPorId.get(qr.eventId) ?? null : null;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Iniciar jornada</h1>
          <p className="mt-1 text-neutral-400">
            Revisa la temática del evento y acepta el consentimiento GPS.
          </p>
        </div>

        <TematicaEventoCard
          evento={eventoQr}
          titulo="Antes de marcar entrada"
        />

        <Card>
          <p className="text-sm font-medium text-neutral-200">Consentimiento GPS</p>
          <p className="mt-3 rounded-lg border border-border bg-bg p-3 text-sm text-neutral-400">
            {qr?.descripcionDatos ?? "Recopilación de ubicación durante la jornada."}
          </p>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>Acepto el tratamiento de datos descrito para esta jornada.</span>
          </label>
          {error && <p className="mt-3 text-sm text-alert">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!consentAccepted || submitting}
              onClick={confirmarEntrada}
              className="rounded-lg bg-positive/20 px-4 py-2 text-sm font-semibold text-positive disabled:opacity-50"
            >
              {submitting ? "Marcando…" : "Aceptar y marcar entrada"}
            </button>
            <button
              type="button"
              onClick={() => setPendingQr(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-400"
            >
              Cancelar
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Marcar entrada</h1>
        <p className="mt-1 text-neutral-400">
          Escanea o pega el código QR del sitio para iniciar tu jornada y activar GPS.
        </p>
      </div>

      {eventoProximoTurno && (
        <TematicaEventoCard
          evento={eventoProximoTurno}
          titulo="Tu próximo turno"
        />
      )}

      <Card>
        <form onSubmit={iniciarCheckin} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Código QR del sitio</span>
            <input
              value={rawQr}
              onChange={(e) => setRawQr(e.target.value)}
              placeholder="spe:qr:ID_DEL_SITIO:token"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs"
              required
            />
          </label>
          {error && <p className="text-sm text-alert">{error}</p>}
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            Continuar
          </button>
        </form>
        <p className="mt-4 text-xs text-neutral-500">
          Necesitas un turno <strong>confirmado</strong> en el sitio.{" "}
          <Link to={resolveTurnosPath(pathname)} className="text-accent hover:underline">
            Ver mis turnos
          </Link>
        </p>
      </Card>
    </div>
  );
}
