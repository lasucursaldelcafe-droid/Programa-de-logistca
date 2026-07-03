import { formatCurrencyCOP } from "@spe/shared";
import { Card } from "@core/components/ui";
import { MetricCard } from "@core/components/dashboard/MetricCard";
import {
  useAttendances,
  useEvents,
  usePlatformUsers,
  useReportes,
  useWorkers,
} from "@core/hooks/useDataStore";
import { usePayrollEntries } from "@core/hooks/usePayroll";

export function MasterHomePage() {
  const workers = useWorkers();
  const events = useEvents();
  const users = usePlatformUsers();
  const attendances = useAttendances();
  const reportes = useReportes();
  const payroll = usePayrollEntries();

  const activos = attendances.filter((a) => a.estado !== "cerrado").length;
  const reportesAbiertos = reportes.filter((r) => r.estado !== "resuelto").length;
  const nominaTotal = payroll.reduce((s, p) => s + p.total, 0);
  const admins = users.filter(
    (u) => u.role === "administrador" || u.role === "supervisor_sitio",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Panel Master</h1>
        <p className="mt-1 text-neutral-400">
          Vista global de la plataforma — todos los eventos y operación
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Eventos" value={String(events.length)} />
        <MetricCard label="Trabajadores" value={String(workers.length)} />
        <MetricCard label="Jornadas activas" value={String(activos)} variant="positive" />
        <MetricCard label="Reportes abiertos" value={String(reportesAbiertos)} variant="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">Equipo operativo</h2>
          <p className="mt-2 text-3xl font-bold">{admins.length}</p>
          <p className="text-sm text-neutral-400">Administradores y supervisores</p>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Nómina acumulada</h2>
          <p className="mt-2 text-3xl font-bold">{formatCurrencyCOP(nominaTotal)}</p>
          <p className="text-sm text-neutral-400">{payroll.length} registros</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Eventos activos</h2>
        <ul className="mt-4 space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex justify-between rounded-lg border border-border bg-bg px-4 py-3 text-sm"
            >
              <span>{e.nombre}</span>
              <span className="text-neutral-500">
                {e.sitioIds.length} sitio(s)
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
