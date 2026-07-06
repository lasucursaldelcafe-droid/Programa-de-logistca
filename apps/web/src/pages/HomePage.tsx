import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { useShifts, useWorkers } from "../hooks/useDataStore";
import { useBusinessKpis } from "../hooks/useBusiness";
import { usePosiciones } from "../hooks/useBusiness";
import { formatCurrencyCOP } from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import { Link } from "react-router-dom";

export function HomePage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const shifts = useShifts();
  const kpis = useBusinessKpis();
  const posiciones = usePosiciones();

  const activos = workers.filter((w) => w.estado === "en_sitio").length;
  const pendientes = shifts.filter((s) => s.estado === "pendiente").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-neutral-400">
          Hola, {user?.nombre}. Vista tipo Siigo + supervisión de personal
          {DEMO_MODE ? " (demo)" : ""}.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Negocio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="text-2xl font-bold text-accent">{formatCurrencyCOP(kpis.ventasMes)}</div>
            <div className="text-sm text-neutral-400">Ventas / facturación</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold text-warning">{formatCurrencyCOP(kpis.cartera)}</div>
            <div className="text-sm text-neutral-400">Cartera pendiente</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{kpis.clientes}</div>
            <div className="text-sm text-neutral-400">Clientes activos</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{kpis.stockBajo}</div>
            <div className="text-sm text-neutral-400">Productos stock bajo</div>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Personal en vivo
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-3xl font-semibold text-accent">{workers.length}</div>
            <div className="text-sm text-neutral-400">Trabajadores</div>
          </Card>
          <Card>
            <div className="text-3xl font-semibold text-positive">{activos}</div>
            <div className="text-sm text-neutral-400">En sitio ahora</div>
          </Card>
          <Card>
            <div className="text-3xl font-semibold">{pendientes}</div>
            <div className="text-sm text-neutral-400">Turnos pendientes</div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Mapa rápido</h2>
          <Link to="/supervision" className="text-sm text-accent hover:underline">
            Ver supervisión completa →
          </Link>
        </div>
        <ul className="mt-4 space-y-2">
          {posiciones.map((p) => (
            <li
              key={p.workerId}
              className="flex justify-between rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            >
              <span>{p.workerNombre}</span>
              <span className="text-neutral-500">
                {p.sitioNombre} · {p.estado}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/integraciones"
          className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent"
        >
          Conectar Siigo, WhatsApp, redes…
        </Link>
        <Link
          to="/facturacion"
          className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          Facturación
        </Link>
      </div>
    </div>
  );
}
