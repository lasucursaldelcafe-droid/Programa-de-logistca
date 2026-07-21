import { FormEvent, useState } from "react";
import {
  REPORTE_TIPO_LABEL,
  puedeReportarASupervisor,
  type ReporteTipo,
} from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { Card } from "@core/components/ui";
import { createReporte, toUserFacingError, useShifts } from "@core/hooks/useDataStore";

const TIPOS: ReporteTipo[] = [
  "retraso",
  "incidente",
  "no_puedo_entrar",
  "equipo",
  "otro",
];

export function ReportarPage() {
  const { user } = useAuth();
  const shifts = useShifts();
  const [tipo, setTipo] = useState<ReporteTipo>("incidente");
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user?.workerId || !puedeReportarASupervisor(user.role)) {
    return <p className="text-neutral-400">Solo trabajadores pueden enviar reportes.</p>;
  }

  const workerId = user.workerId;
  const workerNombre = user.nombre;
  const reporterUid = user.uid;

  const ahora = Date.now();
  const turnoActivo =
    shifts.find(
      (s) =>
        s.workerId === user.workerId &&
        s.estado === "confirmado" &&
        new Date(s.inicio).getTime() <= ahora &&
        new Date(s.fin).getTime() >= ahora,
    ) ??
    shifts.find(
      (s) =>
        s.workerId === user.workerId &&
        (s.estado === "confirmado" || s.estado === "pendiente"),
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) {
      setError("Escribe un mensaje para el supervisor.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReporte({
        workerId,
        workerNombre,
        reporterUid,
        ...(turnoActivo?.id ? { shiftId: turnoActivo.id } : {}),
        ...(turnoActivo?.siteId ? { siteId: turnoActivo.siteId } : {}),
        ...(turnoActivo?.siteNombre ? { siteNombre: turnoActivo.siteNombre } : {}),
        ...(turnoActivo?.eventId ? { eventId: turnoActivo.eventId } : {}),
        tipo,
        mensaje: mensaje.trim(),
      });
      setEnviado(true);
      setMensaje("");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo enviar el reporte.").message);
    } finally {
      setSubmitting(false);
    }
  }

  if (enviado) {
    return (
      <Card className="text-center">
        <p className="font-medium text-positive">Reporte enviado</p>
        <p className="mt-2 text-sm text-neutral-400">
          El supervisor lo verá en Admin Console → Reportes.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Enviar otro
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reportar</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Avisa al supervisor de un problema en sitio
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {turnoActivo ? (
            <p className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-neutral-400">
              Sitio asociado: {turnoActivo.siteNombre ?? turnoActivo.siteId} ·{" "}
              {turnoActivo.eventNombre ?? "evento"}
            </p>
          ) : (
            <p className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-neutral-500">
              Sin turno vinculado: el reporte se enviará igual al supervisor.
            </p>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Tipo</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ReporteTipo)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {REPORTE_TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Mensaje</span>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              placeholder="Describe la situación…"
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitting ? "Enviando…" : "Enviar al supervisor"}
          </button>
        </form>
      </Card>
    </div>
  );
}
