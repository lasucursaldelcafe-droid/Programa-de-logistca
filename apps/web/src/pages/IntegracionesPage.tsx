import { useState } from "react";
import { Card } from "../components/ui";
import { useIntegrations } from "../hooks/useIntegrations";
import type { TipoIntegracion } from "@spe/shared";
import { integrationHub } from "@spe/integrations";

const ICONS: Record<TipoIntegracion, string> = {
  siigo: "📊",
  whatsapp: "💬",
  facebook: "📘",
  instagram: "📸",
  webhook: "🌐",
  web_form: "📝",
};

export function IntegracionesPage() {
  const { conexiones, loading, log, connect, disconnect, test } = useIntegrations();
  const [secrets, setSecrets] = useState<Partial<Record<TipoIntegracion, string>>>({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">APIs e integraciones</h1>
        <p className="mt-1 text-neutral-400">
          Conecta Siigo, WhatsApp Business, redes sociales y webhooks. Modo demo — sin credenciales reales.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {conexiones.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ICONS[c.id] ?? "🔌"}</span>
                  <h2 className="font-display text-lg font-semibold">{c.nombre}</h2>
                </div>
                <p className="mt-1 text-sm text-neutral-400">{c.descripcion}</p>
              </div>
              <EstadoBadge estado={c.estado} />
            </div>

            {c.estado === "desconectado" && (
              <label className="mt-4 block text-sm">
                <span className="mb-1 block text-neutral-500">Token / API key (demo)</span>
                <input
                  type="text"
                  placeholder={`demo-${c.id}-key`}
                  value={secrets[c.id] ?? ""}
                  onChange={(e) => setSecrets((s) => ({ ...s, [c.id]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
            )}

            {c.mensaje && (
              <p className="mt-3 rounded-lg bg-bg px-3 py-2 text-xs text-neutral-400">{c.mensaje}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {c.estado === "desconectado" || c.estado === "error" ? (
                <button
                  type="button"
                  disabled={loading === c.id}
                  onClick={() => connect(c.id, secrets[c.id])}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {loading === c.id ? "Conectando…" : "Conectar"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={loading === c.id}
                    onClick={() => test(c.id)}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Probar
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnect(c.id)}
                    className="rounded-lg border border-alert/40 px-4 py-2 text-sm text-alert hover:bg-alert/10"
                  >
                    Desconectar
                  </button>
                  <DemoFetchButton id={c.id} />
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {log.length > 0 && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Registro de actividad</h2>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-neutral-400">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    conectado: "bg-positive/15 text-positive",
    desconectado: "bg-neutral-700/40 text-neutral-400",
    conectando: "bg-accent/15 text-accent",
    error: "bg-alert/15 text-alert",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[estado] ?? colors.desconectado}`}>
      {estado}
    </span>
  );
}

function DemoFetchButton({ id }: { id: TipoIntegracion }) {
  const [result, setResult] = useState<string | null>(null);

  async function fetchDemo() {
    const connector = integrationHub.get(id);
    if (!connector) return;

    if (id === "siigo" && "fetchInvoices" in connector) {
      const inv = await (connector as { fetchInvoices: () => Promise<unknown[]> }).fetchInvoices();
      setResult(`${inv.length} facturas desde Siigo`);
    } else if (id === "whatsapp" && "fetchInbox" in connector) {
      const msgs = await (connector as { fetchInbox: () => Promise<unknown[]> }).fetchInbox();
      setResult(`${msgs.length} mensajes en bandeja`);
    } else if ((id === "facebook" || id === "instagram") && "fetchActivity" in connector) {
      const act = await (connector as { fetchActivity: () => Promise<unknown[]> }).fetchActivity();
      setResult(`${act.length} actividades en ${id}`);
    } else if (id === "webhook" && "fetchEvents" in connector) {
      const ev = await (connector as { fetchEvents: () => Promise<unknown[]> }).fetchEvents();
      setResult(`${ev.length} eventos webhook`);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={fetchDemo}
        className="rounded-lg border border-accent/40 px-4 py-2 text-sm text-accent hover:bg-accent/10"
      >
        Sincronizar demo
      </button>
      {result && <span className="self-center text-xs text-neutral-500">{result}</span>}
    </>
  );
}
