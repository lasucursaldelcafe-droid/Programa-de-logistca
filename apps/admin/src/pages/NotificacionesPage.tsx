import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BREAK_TIPO_LABEL,
  NOTIFICATION_TIPO_LABEL,
  puedeEnviarEmergencia,
  notificationUnreadFor,
  type BreakTipo,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { pushAvailable } from "../lib/fcm";
import {
  markNotificationRead,
  processDueBreakReminders,
  scheduleBreakReminder,
  sendEmergencyBroadcast,
  useBreaks,
  useNotifications,
} from "../hooks/useNotifications";
import { updateShiftEstado, useAttendances, useEvents, useShifts, useWorkers } from "../hooks/useDataStore";

export function NotificacionesPage() {
  const { user } = useAuth();
  const notifications = useNotifications(user);
  const breaks = useBreaks();
  const workers = useWorkers();
  const events = useEvents();
  const shifts = useShifts();
  const attendances = useAttendances();

  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [emergencyScope, setEmergencyScope] = useState<"todos" | "event" | "site" | "activos">("todos");
  const [emergencyEventId, setEmergencyEventId] = useState("");
  const [emergencySiteId, setEmergencySiteId] = useState("");
  const [breakForm, setBreakForm] = useState({
    shiftId: "",
    tipo: "almuerzo" as BreakTipo,
    inicio: "",
    fin: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void processDueBreakReminders(breaks);
    }, 60_000);
    void processDueBreakReminders(breaks);
    return () => window.clearInterval(timer);
  }, [breaks]);

  if (!user) return null;

  const canEmergency = puedeEnviarEmergencia(user.role);
  const currentUser = user;
  const activos = attendances.filter((a) => a.estado !== "cerrado");

  async function onMarkRead(id: string) {
    await markNotificationRead(id, currentUser.uid);
  }

  async function responderTurno(shiftId: string, estado: "confirmado" | "rechazado") {
    await updateShiftEstado(shiftId, estado);
  }

  async function enviarEmergencia(e: FormEvent) {
    e.preventDefault();
    if (!canEmergency || !emergencyMsg.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendEmergencyBroadcast({
        mensaje: emergencyMsg.trim(),
        scope: emergencyScope,
        eventId: emergencyScope === "event" ? emergencyEventId : undefined,
        siteId: emergencyScope === "site" ? emergencySiteId : undefined,
        workerIdsActivos: emergencyScope === "activos"
          ? activos.map((a) => a.workerId)
          : undefined,
        actorUid: currentUser.uid,
        actorNombre: currentUser.nombre,
      });
      setEmergencyMsg("");
    } catch {
      setError("No se pudo enviar la alerta.");
    } finally {
      setBusy(false);
    }
  }

  async function programarBreak(e: FormEvent) {
    e.preventDefault();
    if (!canEmergency || !breakForm.shiftId) return;
    const shift = shifts.find((s) => s.id === breakForm.shiftId);
    if (!shift) return;
    setBusy(true);
    try {
      await scheduleBreakReminder({
        shiftId: shift.id,
        workerId: shift.workerId,
        workerNombre: shift.workerNombre ?? shift.workerId,
        tipo: breakForm.tipo,
        inicio: new Date(breakForm.inicio).toISOString(),
        fin: new Date(breakForm.fin).toISOString(),
      });
      setBreakForm({ shiftId: "", tipo: "almuerzo", inicio: "", fin: "" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Notificaciones</h1>
        <p className="mt-1 text-neutral-400">
          Bandeja en tiempo real{pushAvailable() ? " + push habilitado" : " (FCM: configura VITE_FIREBASE_VAPID_KEY)"}.
        </p>
      </div>

      {error && <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      {canEmergency && (
        <Card>
          <h2 className="font-display text-lg font-semibold text-alert">Botón de emergencia</h2>
          <form onSubmit={enviarEmergencia} className="mt-4 space-y-3">
            <textarea
              value={emergencyMsg}
              onChange={(e) => setEmergencyMsg(e.target.value)}
              placeholder="Mensaje de emergencia para el personal…"
              className="h-24 w-full rounded-lg border border-alert/40 bg-bg px-3 py-2 text-sm"
              required
            />
            <div className="flex flex-wrap gap-2">
              {(["todos", "event", "site", "activos"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setEmergencyScope(scope)}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    emergencyScope === scope
                      ? "bg-alert/20 text-alert"
                      : "border border-border text-neutral-400"
                  }`}
                >
                  {scope === "todos" ? "Global" : scope === "event" ? "Por evento" : scope === "site" ? "Por sitio" : "Activos GPS"}
                </button>
              ))}
            </div>
            {emergencyScope === "event" && (
              <select
                value={emergencyEventId}
                onChange={(e) => setEmergencyEventId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                required
              >
                <option value="">Evento…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                ))}
              </select>
            )}
            {emergencyScope === "site" && (
              <select
                value={emergencySiteId}
                onChange={(e) => setEmergencySiteId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                required
              >
                <option value="">Sitio…</option>
                {workers.length > 0 &&
                  shifts.map((s) => (
                    <option key={s.siteId} value={s.siteId}>{s.siteNombre}</option>
                  ))}
              </select>
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-alert px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Enviando…" : "Enviar alerta de emergencia"}
            </button>
          </form>
        </Card>
      )}

      {canEmergency && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Programar break / almuerzo</h2>
          <form onSubmit={programarBreak} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Turno
              <select
                value={breakForm.shiftId}
                onChange={(e) => setBreakForm((f) => ({ ...f, shiftId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              >
                <option value="">Seleccionar…</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.workerNombre} — {s.siteNombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Tipo
              <select
                value={breakForm.tipo}
                onChange={(e) => setBreakForm((f) => ({ ...f, tipo: e.target.value as BreakTipo }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                {Object.entries(BREAK_TIPO_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Inicio
              <input
                type="datetime-local"
                value={breakForm.inicio}
                onChange={(e) => setBreakForm((f) => ({ ...f, inicio: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Fin
              <input
                type="datetime-local"
                value={breakForm.fin}
                onChange={(e) => setBreakForm((f) => ({ ...f, fin: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Programar recordatorio
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Bandeja</h2>
        <div className="mt-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin notificaciones.</p>
          ) : (
            notifications.map((n) => {
              const unread = notificationUnreadFor(n, currentUser.uid);
              return (
                <div
                  key={n.id}
                  className={`rounded-lg border px-4 py-3 ${
                    n.urgente ? "border-alert/50 bg-alert/5" : "border-border bg-bg"
                  } ${unread ? "" : "opacity-70"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{n.titulo}</span>
                        {unread && (
                          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-400">{n.mensaje}</p>
                      <p className="mt-1 font-mono text-[10px] text-neutral-500">
                        {NOTIFICATION_TIPO_LABEL[n.tipo]} · {new Date(n.timestamp).toLocaleString("es-CO")}
                      </p>
                    </div>
                    <Badge
                      label={n.urgente ? "Urgente" : "Info"}
                      tone={n.urgente ? "rechazado" : "pendiente"}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unread && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(n.id)}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Marcar leída
                      </button>
                    )}
                    {n.accionTurno && n.shiftId && user.role === "trabajador" && (
                      <>
                        <button
                          type="button"
                          onClick={() => responderTurno(n.shiftId!, "confirmado")}
                          className="rounded-lg bg-positive/20 px-3 py-1 text-xs text-positive"
                        >
                          Aceptar turno
                        </button>
                        <button
                          type="button"
                          onClick={() => responderTurno(n.shiftId!, "rechazado")}
                          className="rounded-lg bg-alert/20 px-3 py-1 text-xs text-alert"
                        >
                          Rechazar
                        </button>
                        <Link to="/turnos" className="text-xs text-accent hover:underline">
                          Ver turnos
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
