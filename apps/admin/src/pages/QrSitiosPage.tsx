import { useEffect, useState } from "react";
import {
  QR_MODO_LABEL,
  formatQrPayload,
  puedeGestionarQr,
  type QrModo,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { QrDisplay, resolveEffectiveToken } from "../components/QrDisplay";
import {
  createQrCode,
  deactivateQrCode,
  toUserFacingError,
  useEvents,
  useQrCodes,
  useSites,
} from "../hooks/useDataStore";

const DEFAULT_DESCRIPCION =
  "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar presencia en el sitio asignado.";

export function QrSitiosPage() {
  const { user } = useAuth();
  const events = useEvents();
  const sites = useSites();
  const qrCodes = useQrCodes();
  const [form, setForm] = useState({
    eventId: "",
    siteId: "",
    modo: "por_jornada" as QrModo,
    descripcionDatos: DEFAULT_DESCRIPCION,
    intervaloRotacionSegundos: 300,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Al cargar eventos (async), sincronizar el select — si queda vacío el submit fallaba en silencio.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled || events.length === 0) return;
      setForm((f) => {
        if (f.eventId && events.some((ev) => ev.id === f.eventId)) return f;
        return { ...f, eventId: events[0]!.id, siteId: "" };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [events]);

  if (!user || !puedeGestionarQr(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar códigos QR.</p>;
  }

  const currentUser = user;
  const sitesFiltrados = sites.filter((s) => !form.eventId || s.eventId === form.eventId);
  const activos = qrCodes.filter((q) => q.activo);

  async function generarQr(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (events.length === 0) {
      setError("No hay eventos. Crea un evento antes de generar QR.");
      return;
    }
    if (sitesFiltrados.length === 0) {
      setError("No hay sitios para este evento. Añade un sitio en Configuración.");
      return;
    }

    const event = events.find((ev) => ev.id === form.eventId);
    const site = sites.find((s) => s.id === form.siteId);
    if (!event) {
      setError("Selecciona un evento válido.");
      return;
    }
    if (!site) {
      setError("Selecciona un sitio.");
      return;
    }
    if (!form.descripcionDatos.trim()) {
      setError("La descripción de datos (consentimiento) es obligatoria.");
      return;
    }

    setBusy(true);
    try {
      const inicio = new Date(event.fechaInicio);
      const fin = new Date(event.fechaFin);
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
        throw new Error("Las fechas del evento no son válidas. Revisa el evento.");
      }
      await createQrCode({
        eventId: event.id,
        eventNombre: event.nombre,
        siteId: site.id,
        siteNombre: site.nombre,
        modo: form.modo,
        ventanaInicio: inicio.toISOString(),
        ventanaFin: fin.toISOString(),
        radioGeocerca: site.radioGeocerca,
        descripcionDatos: form.descripcionDatos.trim(),
        intervaloRotacionSegundos:
          form.modo === "rotativo" ? form.intervaloRotacionSegundos : undefined,
        creadoPor: currentUser.uid,
      });
      setForm((f) => ({ ...f, siteId: "" }));
      setMensaje(`QR generado para «${site.nombre}». Ya puedes escanearlo o imprimirlo.`);
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo generar el código QR.").message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Códigos QR de sitio</h1>
        <p className="mt-1 text-neutral-400">
          El QR abre el registro en el teléfono: la persona configura su usuario, se le habilita el
          puesto en el sitio y administración/CEO reciben aviso para configurar perfiles.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Generar QR</h2>
        {error && (
          <p className="mt-3 rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}
        {mensaje && (
          <p className="mt-3 rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
            {mensaje}
          </p>
        )}
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">
            Aún no hay eventos. Crea uno en Configuración para poder generar códigos QR.
          </p>
        ) : (
          <form onSubmit={generarQr} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Evento
              <select
                value={form.eventId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, eventId: e.target.value, siteId: "" }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              >
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
                    {s.nombre} (radio {s.radioGeocerca}m)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Modo
              <select
                value={form.modo}
                onChange={(e) => setForm((f) => ({ ...f, modo: e.target.value as QrModo }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                {Object.entries(QR_MODO_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            {form.modo === "rotativo" && (
              <label className="text-sm">
                Rotación (segundos)
                <input
                  type="number"
                  min={60}
                  value={form.intervaloRotacionSegundos}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      intervaloRotacionSegundos: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
            )}
            <label className="text-sm sm:col-span-2">
              Descripción de datos (consentimiento)
              <textarea
                value={form.descripcionDatos}
                onChange={(e) => setForm((f) => ({ ...f, descripcionDatos: e.target.value }))}
                className="mt-1 h-24 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy || !form.eventId || sitesFiltrados.length === 0}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {busy ? "Generando…" : "Generar código QR"}
              </button>
              {form.eventId && sitesFiltrados.length === 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  Este evento no tiene sitios. Añádelos en el asistente de Configuración.
                </p>
              )}
            </div>
          </form>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {activos.map((qr) => {
          const token = resolveEffectiveToken(qr);
          return (
            <Card key={qr.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display font-semibold">{qr.siteNombre}</h3>
                  <p className="text-sm text-neutral-400">{qr.eventNombre}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {QR_MODO_LABEL[qr.modo]} · Radio {qr.radioGeocerca}m
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Vigente: {new Date(qr.ventanaInicio).toLocaleString("es-CO")} →{" "}
                    {new Date(qr.ventanaFin).toLocaleString("es-CO")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void deactivateQrCode(qr.id).catch((err) => {
                        setError(
                          toUserFacingError(err, "No se pudo desactivar el QR.").message,
                        );
                      });
                    }}
                    className="mt-3 text-xs text-alert hover:underline"
                  >
                    Desactivar QR
                  </button>
                </div>
                <QrDisplay qr={qr} effectiveToken={token} />
              </div>
              <p className="mt-3 rounded-lg border border-border bg-bg p-2 text-xs text-neutral-400">
                {qr.descripcionDatos}
              </p>
              <code className="mt-2 block font-mono text-[10px] text-neutral-500">
                Payload app: {formatQrPayload(qr.id, qr.modo === "rotativo" ? token : qr.token)}
              </code>
            </Card>
          );
        })}
        {activos.length === 0 && (
          <p className="text-sm text-neutral-500">No hay códigos QR activos.</p>
        )}
      </div>
    </div>
  );
}
