import { Card } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useIntegrations } from "../hooks/useIntegrations";
import { puedeConfigurarIntegraciones } from "@spe/shared";
import type { TipoIntegracion } from "@spe/shared";
import { AdminIntegracionPanel } from "../components/AdminIntegracionPanel";
import { IntegracionesAyuda } from "../components/IntegracionesAyuda";

export function IntegracionesPage() {
  const { user } = useAuth();
  const { conexiones, loading, log, connect, disconnect, test } = useIntegrations();
  const isAdmin = user ? puedeConfigurarIntegraciones(user.role) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">APIs e integraciones</h1>
        <p className="mt-1 text-neutral-400">
          {isAdmin
            ? "Configura y sube las credenciales de Siigo, WhatsApp, redes sociales y webhooks."
            : "Estado de las conexiones activas. Solo el administrador puede modificar credenciales."}
        </p>
      </div>

      {isAdmin ? (
        <>
          <Card className="border-accent/30 bg-accent/5">
            <h2 className="font-display text-lg font-semibold text-accent">
              Panel de administrador — Configurar APIs
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Guarda tus API keys, tokens y archivos JSON/.env. Las credenciales se almacenan en este
              navegador (demo). En producción irían cifradas en el servidor.
            </p>
          </Card>

          <IntegracionesAyuda />

          <div className="space-y-4">
            {conexiones.map((c) => (
              <AdminIntegracionPanel
                key={c.id}
                conexion={c}
                onConnect={connect}
                onDisconnect={disconnect}
                onTest={test}
                loading={loading}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {conexiones.map((c) => (
            <ConexionSoloLectura key={c.id} conexion={c} />
          ))}
        </div>
      )}

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

function ConexionSoloLectura({
  conexion,
}: {
  conexion: {
    id: TipoIntegracion;
    nombre: string;
    descripcion: string;
    estado: string;
    mensaje?: string;
  };
}) {
  const ICONS: Record<string, string> = {
    siigo: "📊",
    whatsapp: "💬",
    facebook: "📘",
    instagram: "📸",
    webhook: "🌐",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ICONS[conexion.id] ?? "🔌"}</span>
          <div>
            <h2 className="font-display font-semibold">{conexion.nombre}</h2>
            <p className="text-sm text-neutral-400">{conexion.descripcion}</p>
          </div>
        </div>
        <EstadoBadge estado={conexion.estado} />
      </div>
      {conexion.mensaje && (
        <p className="mt-3 text-xs text-neutral-500">{conexion.mensaje}</p>
      )}
    </Card>
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
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[estado] ?? colors.desconectado}`}
    >
      {estado}
    </span>
  );
}
