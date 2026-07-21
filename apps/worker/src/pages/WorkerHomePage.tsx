import { useState } from "react";
import { Link } from "react-router-dom";
import {
  SHIFT_LABEL,
  findTurnoConfirmadoVigente,
  workerPath,
} from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { Card } from "@core/components/ui";
import {
  getActiveAttendance,
  toUserFacingError,
  updateShiftEstado,
  useAttendances,
  useShifts,
} from "@core/hooks/useDataStore";

export function WorkerHomePage() {
  const { user } = useAuth();
  const shifts = useShifts();
  const attendances = useAttendances();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (!user?.workerId) {
    return <p className="text-neutral-400">Perfil de trabajador no vinculado.</p>;
  }

  const misTurnos = shifts.filter((s) => s.workerId === user.workerId);
  const pendientes = misTurnos.filter((s) => s.estado === "pendiente");
  const confirmados = misTurnos.filter((s) => s.estado === "confirmado");
  const activo = getActiveAttendance(attendances, user.workerId);
  const turnoVigente = findTurnoConfirmadoVigente(shifts, user.workerId);

  async function responder(id: string, estado: "confirmado" | "rechazado") {
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hola, {user.nombre}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Acepta tu trabajo y, al llegar, confirma que ya estás en el sitio.
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

      {activo ? (
        <Card className="border-positive/30 bg-positive/5">
          <p className="text-sm font-medium text-positive">Jornada activa</p>
          <p className="mt-1 text-neutral-300">{activo.siteNombre}</p>
          {(activo.estado === "revision_manual" || activo.estado === "fuera_geocerca") && (
            <p className="mt-2 text-xs text-neutral-400">
              Aún no está del todo activa. Confirma que ya estás en el sitio.
            </p>
          )}
          <Link
            to={workerPath("entrada")}
            className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            {activo.estado === "activo"
              ? "Ver entrada / marcar salida"
              : "Ya estoy aquí — activar"}
          </Link>
        </Card>
      ) : turnoVigente ? (
        <Card className="border-positive/30 bg-positive/5">
          <p className="text-sm font-medium text-positive">Turno vigente — activa tu llegada</p>
          <p className="mt-1 text-neutral-200">
            {turnoVigente.siteNombre} · {turnoVigente.eventNombre}
          </p>
          <p className="mt-3 text-xs text-neutral-400">
            Si ya llegaste, pulsa para activar la jornada con GPS (debes estar en el sitio).
          </p>
          <Link
            to={workerPath("entrada")}
            className="mt-3 inline-block rounded-lg bg-positive px-4 py-2.5 text-sm font-semibold text-black"
          >
            Ya estoy aquí — activar jornada
          </Link>
        </Card>
      ) : (
        <Card>
          <p className="text-sm font-medium text-neutral-200">Sin jornada activa</p>
          <p className="mt-1 text-sm text-neutral-500">
            {pendientes.length > 0
              ? "Primero acepta el turno abajo. Cuando estés en el sitio, activa la llegada."
              : "Cuando te asignen un turno, aparecerá aquí. Mientras tanto puedes revisar avisos o ayuda."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={workerPath("turnos")}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-neutral-200"
            >
              Mis turnos
            </Link>
            <Link
              to={workerPath("entrada")}
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              Ir a entrada
            </Link>
            <Link
              to={workerPath("notificaciones")}
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-accent hover:underline"
            >
              Ver avisos
            </Link>
          </div>
        </Card>
      )}

      {pendientes.length > 0 && (
        <Card>
          <h2 className="font-display font-semibold">Aceptar trabajo</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Confirma si vas a cubrir estos turnos.
          </p>
          <ul className="mt-3 space-y-3">
            {pendientes.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-border bg-bg/60 px-3 py-3 text-sm"
              >
                <p className="font-medium text-neutral-200">{t.siteNombre}</p>
                <p className="text-xs text-neutral-400">{t.eventNombre}</p>
                <p className="mt-1 font-mono text-[11px] text-neutral-500">
                  {new Date(t.inicio).toLocaleString("es-CO")} →{" "}
                  {new Date(t.fin).toLocaleString("es-CO")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{SHIFT_LABEL[t.estado]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => void responder(t.id, "confirmado")}
                    className="min-h-11 rounded-lg bg-positive/20 px-4 py-2.5 text-sm font-semibold text-positive disabled:opacity-50"
                  >
                    {busyId === t.id ? "…" : "Aceptar trabajo"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => void responder(t.id, "rechazado")}
                    className="min-h-11 rounded-lg bg-alert/20 px-4 py-2.5 text-sm font-semibold text-alert disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Link to={workerPath("turnos")} className="mt-3 inline-block text-sm text-accent hover:underline">
            Ver todos los turnos
          </Link>
        </Card>
      )}

      {confirmados.length > 0 && !turnoVigente && !activo && (
        <Card>
          <h2 className="font-display font-semibold">Trabajos aceptados</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-300">
            {confirmados.slice(0, 3).map((t) => (
              <li key={t.id}>
                {t.siteNombre} — {new Date(t.inicio).toLocaleString("es-CO")}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
