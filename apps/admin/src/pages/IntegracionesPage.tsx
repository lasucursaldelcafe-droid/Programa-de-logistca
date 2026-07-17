import { Card } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useIntegrations } from "../hooks/useIntegrations";
import { puedeConfigurarIntegraciones } from "@spe/shared";
import type { TipoIntegracion } from "@spe/shared";
import { AdminIntegracionPanel } from "../components/AdminIntegracionPanel";
import { IntegracionesAyuda } from "../components/IntegracionesAyuda";
import { IntegracionesLockGate } from "../components/IntegracionesLockGate";
import { PageHeader } from "../components/nav/PageHeader";

export function IntegracionesPage() {
  const { user } = useAuth();
  const { conexiones, loading, log, connect, disconnect, test } = useIntegrations();
  const isAdmin = user ? puedeConfigurarIntegraciones(user.role) : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "APIs" : "Integraciones"}
        description={
          isAdmin
            ? "Credenciales y conexiones con servicios externos."
            : "Estado de las conexiones activas."
        }
      />

      {isAdmin ? (
        <IntegracionesLockGate>
          <IntegracionesAyuda />

          <div className="space-y-3">
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
        </IntegracionesLockGate>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {conexiones.map((c) => (
            <ConexionSoloLectura key={c.id} conexion={c} />
          ))}
        </div>
      )}

      {log.length > 0 && (
        <Card>
          <h2 className="font-display text-sm font-semibold text-neutral-300">Actividad</h2>
          <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto font-mono text-xs text-neutral-500">
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
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold">{conexion.nombre}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{conexion.descripcion}</p>
        </div>
        <EstadoBadge estado={conexion.estado} />
      </div>
      {conexion.mensaje && (
        <p className="mt-2 text-xs text-neutral-500">{conexion.mensaje}</p>
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
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${colors[estado] ?? colors.desconectado}`}
    >
      {estado}
    </span>
  );
}
