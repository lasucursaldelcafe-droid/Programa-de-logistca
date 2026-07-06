import { FormEvent, useRef, useState } from "react";
import { Card } from "../components/ui";
import {
  CAMPOS_POR_INTEGRACION,
  type CredencialesIntegracion,
  type IntegracionConexion,
  type TipoIntegracion,
} from "@spe/shared";
import {
  credencialesCompletas,
  useCredencialesIntegracion,
  useIntegrationConfig,
} from "../hooks/useIntegrationConfig";
import { credencialesToSecret } from "../demo/integrations";
import { integrationHub } from "@spe/integrations";

const ICONS: Record<TipoIntegracion, string> = {
  siigo: "📊",
  whatsapp: "💬",
  facebook: "📘",
  instagram: "📸",
  webhook: "🌐",
  web_form: "📝",
};

interface Props {
  conexion: IntegracionConexion;
  onConnect: (id: TipoIntegracion, secret?: string) => void;
  onDisconnect: (id: TipoIntegracion) => void;
  onTest: (id: TipoIntegracion) => void;
  loading: TipoIntegracion | null;
}

export function AdminIntegracionPanel({
  conexion,
  onConnect,
  onDisconnect,
  onTest,
  loading,
}: Props) {
  const credencialesGuardadas = useCredencialesIntegracion(conexion.id);
  const { save, clear, uploadJsonFile } = useIntegrationConfig();
  const [draft, setDraft] = useState<CredencialesIntegracion>(credencialesGuardadas);
  const [expanded, setExpanded] = useState(conexion.estado === "desconectado");
  const [fileError, setFileError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const campos = CAMPOS_POR_INTEGRACION[conexion.id];
  const completa = credencialesCompletas(conexion.id, credencialesGuardadas);

  function updateField(key: keyof CredencialesIntegracion, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    save({ ...draft, id: conexion.id });
    setSavedMsg("Credenciales guardadas");
    setTimeout(() => setSavedMsg(null), 2500);
  }

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".json") && !ext.endsWith(".env")) {
      setFileError("Solo archivos .json o .env");
      return;
    }
    try {
      if (ext.endsWith(".json")) {
        const updated = await uploadJsonFile(conexion.id, file);
        setDraft(updated);
      } else {
        const text = await file.text();
        const parsed: Record<string, string> = {};
        for (const line of text.split("\n")) {
          const m = line.match(/^([A-Z0-9_]+)=(["']?)(.*)\2$/);
          if (m) parsed[m[1]!.toLowerCase()] = m[3]!;
        }
        const updated: CredencialesIntegracion = {
          ...draft,
          id: conexion.id,
          apiKey: parsed.api_key ?? parsed.siigo_api_key ?? draft.apiKey,
          token: parsed.token ?? parsed.whatsapp_token ?? draft.token,
          apiSecret: parsed.api_secret ?? parsed.app_secret ?? draft.apiSecret,
          usuario: parsed.usuario ?? parsed.email ?? draft.usuario,
          webhookUrl: parsed.webhook_url ?? draft.webhookUrl,
          archivoNombre: file.name,
          actualizadoEn: new Date().toISOString(),
        };
        save(updated);
        setDraft(updated);
      }
      setSavedMsg(`Archivo ${file.name} cargado`);
      setTimeout(() => setSavedMsg(null), 2500);
    } catch {
      setFileError("Archivo inválido. Verifica el formato JSON.");
    }
  }

  function onClearAll() {
    clear(conexion.id);
    setDraft({ id: conexion.id });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card className="border-accent/20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{ICONS[conexion.id]}</span>
          <div>
            <h2 className="font-display text-lg font-semibold">{conexion.nombre}</h2>
            <p className="text-xs text-neutral-500">
              {completa ? "Credenciales configuradas" : "Falta configurar API"}
              {credencialesGuardadas.archivoNombre &&
                ` · ${credencialesGuardadas.archivoNombre}`}
            </p>
          </div>
        </div>
        <span className="text-neutral-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <form onSubmit={onSave} className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="rounded-lg border border-dashed border-border bg-bg/50 p-4">
            <p className="text-sm font-medium text-neutral-300">Subir credenciales</p>
            <p className="mt-1 text-xs text-neutral-500">
              Arrastra o selecciona un archivo <code className="text-accent">.json</code> (service
              account, config Meta) o <code className="text-accent">.env</code> con variables de API.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.env,application/json"
              className="mt-3 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
            {fileError && <p className="mt-2 text-xs text-alert">{fileError}</p>}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            O ingresa manualmente
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {campos.map((campo) => (
              <label key={campo.key} className="block text-sm sm:col-span-1">
                <span className="mb-1 block text-neutral-400">
                  {campo.label}
                  {campo.required && <span className="text-accent"> *</span>}
                </span>
                <input
                  type={campo.type ?? "text"}
                  value={(draft[campo.key] as string | undefined) ?? ""}
                  placeholder={campo.placeholder}
                  onChange={(e) => updateField(campo.key, e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Guardar credenciales
            </button>
            <button
              type="button"
              onClick={() => {
                save({ ...draft, id: conexion.id });
                onConnect(conexion.id, credencialesToSecret({ ...draft, id: conexion.id }));
              }}
              disabled={loading === conexion.id || !credencialesCompletas(conexion.id, draft)}
              className="rounded-lg border border-positive/40 bg-positive/10 px-4 py-2 text-sm text-positive hover:bg-positive/20 disabled:opacity-50"
            >
              {loading === conexion.id ? "Conectando…" : "Guardar y conectar"}
            </button>
            {conexion.estado === "conectado" && (
              <>
                <button
                  type="button"
                  onClick={() => onTest(conexion.id)}
                  disabled={loading === conexion.id}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-neutral-800"
                >
                  Probar conexión
                </button>
                <button
                  type="button"
                  onClick={() => onDisconnect(conexion.id)}
                  className="rounded-lg border border-alert/40 px-4 py-2 text-sm text-alert"
                >
                  Desconectar
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-lg px-4 py-2 text-sm text-neutral-500 hover:text-neutral-300"
            >
              Borrar credenciales
            </button>
            {savedMsg && <span className="text-xs text-positive">{savedMsg}</span>}
          </div>

          {conexion.mensaje && (
            <p className="rounded-lg bg-bg px-3 py-2 text-xs text-neutral-400">{conexion.mensaje}</p>
          )}

          {conexion.estado === "conectado" && (
            <SyncDemoButton id={conexion.id} />
          )}
        </form>
      )}
    </Card>
  );
}

function SyncDemoButton({ id }: { id: TipoIntegracion }) {
  const [result, setResult] = useState<string | null>(null);

  async function sync() {
    const connector = integrationHub.get(id);
    if (!connector) return;
    if (id === "siigo" && "fetchInvoices" in connector) {
      const inv = await (connector as { fetchInvoices: () => Promise<unknown[]> }).fetchInvoices();
      setResult(`${inv.length} facturas sincronizadas`);
    } else if (id === "whatsapp" && "fetchInbox" in connector) {
      const msgs = await (connector as { fetchInbox: () => Promise<unknown[]> }).fetchInbox();
      setResult(`${msgs.length} mensajes`);
    } else if ((id === "facebook" || id === "instagram") && "fetchActivity" in connector) {
      const act = await (connector as { fetchActivity: () => Promise<unknown[]> }).fetchActivity();
      setResult(`${act.length} actividades`);
    } else if (id === "webhook" && "fetchEvents" in connector) {
      const ev = await (connector as { fetchEvents: () => Promise<unknown[]> }).fetchEvents();
      setResult(`${ev.length} eventos`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={sync}
        className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
      >
        Sincronizar datos demo
      </button>
      {result && <span className="text-xs text-neutral-500">{result}</span>}
    </div>
  );
}
