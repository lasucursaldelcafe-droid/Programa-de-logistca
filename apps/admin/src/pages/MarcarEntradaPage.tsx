import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ATTENDANCE_LABEL,
  GPS_CHECKIN_CONSENT,
  findProximoTurnoConfirmado,
  findTurnoConfirmadoVigente,
  isInsideGeofence,
  parseQrPayload,
  resolveTurnosPath,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { ScanQrButton } from "../components/ScanQrButton";
import { TematicaEventoCard } from "../components/TematicaEventoCard";
import { getCurrentPosition } from "../lib/geolocation";
import { normalizeScannedQr } from "../lib/qrScanner";
import { useGeofenceMonitor } from "../hooks/useGeofenceMonitor";
import {
  checkInAtSite,
  checkInWithQr,
  checkOut,
  confirmArrivalAtSite,
  getActiveAttendance,
  toUserFacingError,
  useAttendances,
  useEvents,
  useQrCodes,
  useShifts,
  useSites,
} from "../hooks/useDataStore";

type PendingMode = { kind: "qr"; raw: string } | { kind: "gps"; shiftId: string };

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
  const [pending, setPending] = useState<PendingMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("qr")?.trim();
    if (!fromQuery) return;
    setRawQr(fromQuery);
    if (parseQrPayload(fromQuery)) {
      setPending({ kind: "qr", raw: fromQuery });
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

  const turnoVigente = useMemo(
    () => (workerId ? findTurnoConfirmadoVigente(shifts, workerId) : null),
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
    const normalized = normalizeScannedQr(trimmed) ?? (parseQrPayload(trimmed) ? trimmed : null);
    const parsed = normalized ? parseQrPayload(normalized) : parseQrPayload(trimmed);
    const qr = parsed
      ? qrCodes.find((q) => q.id === parsed.qrId)
      : qrCodes.find((q) => trimmed.includes(q.id));
    if (qr && (normalized || trimmed)) {
      setPending({ kind: "qr", raw: normalized ?? trimmed });
      setConsentAccepted(false);
      return;
    }
    setError("Escanea o pega un código QR válido del sitio (o el enlace unirse-qr).");
  }

  function iniciarLlegadaGps() {
    if (!turnoVigente) {
      setError(
        "No hay un turno confirmado vigente ahora. Acepta el trabajo en Mis turnos e inténtalo en el horario asignado.",
      );
      return;
    }
    setError(null);
    setMensaje(null);
    setPending({ kind: "gps", shiftId: turnoVigente.id });
    setConsentAccepted(false);
  }

  async function confirmarEntrada() {
    if (!pending || !consentAccepted) return;
    setSubmitting(true);
    setError(null);
    setMensaje(null);
    try {
      const position = await getCurrentPosition();
      if (pending.kind === "qr") {
        await checkInWithQr({
          rawQr: pending.raw,
          workerId,
          workerNombre,
          shifts,
          position,
        });
      } else {
        await checkInAtSite({
          workerId,
          workerNombre,
          shifts,
          position,
          shiftId: pending.shiftId,
        });
      }
      setPending(null);
      setRawQr("");
      setMensaje("Jornada activada. Ya estás registrado en el sitio.");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo marcar entrada").message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmarEstoyAqui() {
    if (!active || !activeSite) return;
    setSubmitting(true);
    setError(null);
    setMensaje(null);
    try {
      const position = await getCurrentPosition();
      const dentro = isInsideGeofence(
        position,
        { lat: activeSite.lat, lng: activeSite.lng },
        activeSite.radioGeocerca,
      );
      if (!dentro) {
        throw new Error(
          `Aún no estás dentro del radio del sitio (${activeSite.radioGeocerca}m). Acércate e inténtalo de nuevo.`,
        );
      }
      await confirmArrivalAtSite(active.id);
      setMensaje("Llegada confirmada. Tu jornada quedó activa.");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo confirmar la llegada").message);
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
      setError(toUserFacingError(err, "No se pudo marcar salida").message);
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    const eventoActivo = eventoPorId.get(active.eventId) ?? null;
    const necesitaConfirmar =
      active.estado === "revision_manual" || active.estado === "fuera_geocerca";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Jornada activa</h1>
          <p className="mt-1 text-neutral-400">GPS activo solo durante esta jornada.</p>
        </div>

        <TematicaEventoCard evento={eventoActivo} titulo="Recordatorio del evento" />

        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              label={ATTENDANCE_LABEL[active.estado]}
              tone={active.estado === "fuera_geocerca" ? "rechazado" : "confirmado"}
            />
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
          {mensaje && <p className="mt-3 text-sm text-positive">{mensaje}</p>}
          {error && <p className="mt-3 text-sm text-alert">{error}</p>}
          {necesitaConfirmar && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void confirmarEstoyAqui()}
              className="mt-4 mr-2 rounded-lg bg-positive/20 px-4 py-2 text-sm font-semibold text-positive disabled:opacity-50"
            >
              {submitting ? "Confirmando…" : "Ya estoy aquí — activar jornada"}
            </button>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void marcarSalida()}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitting ? "Cerrando…" : "Marcar salida"}
          </button>
        </Card>
      </div>
    );
  }

  if (pending) {
    const qr =
      pending.kind === "qr" ? qrCodes.find((q) => pending.raw.includes(q.id)) : undefined;
    const shiftGps =
      pending.kind === "gps" ? shifts.find((s) => s.id === pending.shiftId) : undefined;
    const eventoConsent =
      (qr ? eventoPorId.get(qr.eventId) : null) ??
      (shiftGps ? eventoPorId.get(shiftGps.eventId) : null);
    const descripcion =
      pending.kind === "qr"
        ? (qr?.descripcionDatos ?? "Recopilación de ubicación durante la jornada.")
        : GPS_CHECKIN_CONSENT;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {pending.kind === "gps" ? "Confirmar llegada" : "Iniciar jornada"}
          </h1>
          <p className="mt-1 text-neutral-400">
            {pending.kind === "gps"
              ? "Acepta el GPS para activar tu asistencia en el sitio del turno."
              : "Revisa la temática del evento y acepta el consentimiento GPS."}
          </p>
        </div>

        <TematicaEventoCard evento={eventoConsent} titulo="Antes de marcar entrada" />

        {shiftGps && (
          <Card>
            <p className="text-sm font-medium text-neutral-200">Turno</p>
            <p className="mt-1 text-sm text-neutral-300">
              {shiftGps.siteNombre} · {shiftGps.eventNombre}
            </p>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {new Date(shiftGps.inicio).toLocaleString("es-CO")} →{" "}
              {new Date(shiftGps.fin).toLocaleString("es-CO")}
            </p>
          </Card>
        )}

        <Card>
          <p className="text-sm font-medium text-neutral-200">Consentimiento GPS</p>
          <p className="mt-3 rounded-lg border border-border bg-bg p-3 text-sm text-neutral-400">
            {descripcion}
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
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!consentAccepted || submitting}
              onClick={() => void confirmarEntrada()}
              className="rounded-lg bg-positive/20 px-4 py-2 text-sm font-semibold text-positive disabled:opacity-50"
            >
              {submitting
                ? "Activando…"
                : pending.kind === "gps"
                  ? "Ya estoy aquí — activar"
                  : "Aceptar y marcar entrada"}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
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
          Acepta tu turno, llega al sitio y activa la jornada con GPS o escaneando el QR.
        </p>
      </div>

      {eventoProximoTurno && (
        <TematicaEventoCard evento={eventoProximoTurno} titulo="Tu próximo turno" />
      )}

      {turnoVigente && (
        <Card className="border-positive/30 bg-positive/5">
          <p className="text-sm font-medium text-positive">Turno vigente ahora</p>
          <p className="mt-1 text-neutral-200">
            {turnoVigente.siteNombre} · {turnoVigente.eventNombre}
          </p>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            {new Date(turnoVigente.inicio).toLocaleString("es-CO")} →{" "}
            {new Date(turnoVigente.fin).toLocaleString("es-CO")}
          </p>
          <p className="mt-3 text-xs text-neutral-400">
            Si ya llegaste al sitio, activa tu asistencia con GPS (debes estar dentro del radio).
          </p>
          {error && <p className="mt-2 text-sm text-alert">{error}</p>}
          {mensaje && <p className="mt-2 text-sm text-positive">{mensaje}</p>}
          <button
            type="button"
            onClick={iniciarLlegadaGps}
            className="mt-4 rounded-lg bg-positive px-4 py-2.5 text-sm font-semibold text-black"
          >
            Ya estoy aquí — activar jornada
          </button>
        </Card>
      )}

      {!turnoVigente && proximoTurno && (
        <Card>
          <p className="text-sm text-neutral-300">
            Tienes un turno confirmado en {proximoTurno.siteNombre}. Podrás activar la jornada
            cuando empiece el horario (
            {new Date(proximoTurno.inicio).toLocaleString("es-CO")}).
          </p>
        </Card>
      )}

      <Card>
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-200">Escanear QR del sitio</p>
          <p className="text-xs text-neutral-500">
            Alternativa al GPS: usa la cámara para leer el QR del sitio.
          </p>
          <ScanQrButton
            label="Escanear QR del sitio"
            onScanned={(normalized) => {
              setError(null);
              setRawQr(normalized);
              setPending({ kind: "qr", raw: normalized });
              setConsentAccepted(false);
            }}
            onError={(message) => setError(message)}
          />
        </div>

        <div className="my-5 border-t border-border" />

        <form onSubmit={iniciarCheckin} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">O pega el código / enlace</span>
            <input
              value={rawQr}
              onChange={(e) => setRawQr(e.target.value)}
              placeholder="spe:qr:… o enlace unirse-qr"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs"
              required
            />
          </label>
          {error && !turnoVigente && <p className="text-sm text-alert">{error}</p>}
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-white/5"
          >
            Continuar con texto
          </button>
        </form>
        <p className="mt-4 text-xs text-neutral-500">
          Necesitas un turno <strong>aceptado (confirmado)</strong> en el sitio.{" "}
          <Link to={resolveTurnosPath(pathname)} className="text-accent hover:underline">
            Ver mis turnos
          </Link>
        </p>
      </Card>
    </div>
  );
}
