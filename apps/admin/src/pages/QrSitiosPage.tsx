import { useState } from "react";
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
    eventId: events[0]?.id ?? "",
    siteId: "",
    modo: "por_jornada" as QrModo,
    descripcionDatos: DEFAULT_DESCRIPCION,
    intervaloRotacionSegundos: 300,
  });
  const [busy, setBusy] = useState(false);

  if (!user || !puedeGestionarQr(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar códigos QR.</p>;
  }

  const currentUser = user;
  const sitesFiltrados = sites.filter((s) => !form.eventId || s.eventId === form.eventId);
  const activos = qrCodes.filter((q) => q.activo);

  async function generarQr(e: React.FormEvent) {
    e.preventDefault();
    const event = events.find((ev) => ev.id === form.eventId);
    const site = sites.find((s) => s.id === form.siteId);
    if (!event || !site) return;

    setBusy(true);
    try {
      const inicio = new Date(event.fechaInicio);
      const fin = new Date(event.fechaFin);
      await createQrCode({
        eventId: event.id,
        eventNombre: event.nombre,
        siteId: site.id,
        siteNombre: site.nombre,
        modo: form.modo,
        ventanaInicio: inicio.toISOString(),
        ventanaFin: fin.toISOString(),
        radioGeocerca: site.radioGeocerca,
        descripcionDatos: form.descripcionDatos,
        intervaloRotacionSegundos:
          form.modo === "rotativo" ? form.intervaloRotacionSegundos : undefined,
        creadoPor: currentUser.uid,
      });
      setForm((f) => ({ ...f, siteId: "" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Códigos QR de sitio</h1>
        <p className="mt-1 text-neutral-400">
          Genera QR por sitio para activar GPS y marcar entrada con consentimiento.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Generar QR</h2>
        <form onSubmit={generarQr} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Evento
            <select
              value={form.eventId}
              onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value, siteId: "" }))}
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
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Generando…" : "Generar código QR"}
            </button>
          </div>
        </form>
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
                    onClick={() => deactivateQrCode(qr.id)}
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
                Demo rápido: {formatQrPayload(qr.id, qr.modo === "rotativo" ? token : qr.token)}
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
