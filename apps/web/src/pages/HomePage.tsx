import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { useShifts, useWorkers, useAttendances } from "../hooks/useDataStore";
import { DEMO_MODE } from "../lib/mode";

export function HomePage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const shifts = useShifts();
  const attendances = useAttendances();

  const activos = workers.filter((w) => w.estado === "en_sitio").length;
  const pendientes = shifts.filter((s) => s.estado === "pendiente").length;
  const jornadasActivas = attendances.filter((a) => a.estado !== "cerrado").length;
  const alertasGeocerca = attendances.filter(
    (a) => a.estado === "fuera_geocerca" || a.estado === "revision_manual",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Panel operativo</h1>
        <p className="mt-1 text-neutral-400">
          Bienvenido, {user?.nombre}. Resumen en tiempo real
          {DEMO_MODE ? " (modo demo)" : " (Firestore)"}.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <div className="font-mono text-3xl font-semibold text-accent">
            {workers.length}
          </div>
          <div className="text-sm text-neutral-400">Trabajadores registrados</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-positive">
            {activos}
          </div>
          <div className="text-sm text-neutral-400">En sitio ahora</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-accent">
            {pendientes}
          </div>
          <div className="text-sm text-neutral-400">Turnos pendientes</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-positive">
            {jornadasActivas}
          </div>
          <div className="text-sm text-neutral-400">Jornadas GPS activas</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-alert">
            {alertasGeocerca}
          </div>
          <div className="text-sm text-neutral-400">Alertas geocerca</div>
        </Card>
      </div>
    </div>
  );
}
