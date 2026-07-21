import { Link } from "react-router-dom";
import {
  formatCurrencyCOP,
  ROLES_PERSONAL_ADMIN,
  rolesCuentaPlataforma,
} from "@spe/shared";
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
import { useCustomRoles } from "@core/hooks/useCustomRoles";
import { PageHeader } from "@core/components/nav/PageHeader";

export function MasterHomePage() {
  const workers = useWorkers();
  const events = useEvents();
  const users = usePlatformUsers();
  const attendances = useAttendances();
  const reportes = useReportes();
  const payroll = usePayrollEntries();
  const customRoles = useCustomRoles();

  const activos = attendances.filter((a) => a.estado !== "cerrado").length;
  const reportesAbiertos = reportes.filter((r) => r.estado !== "resuelto").length;
  const nominaTotal = payroll.reduce((s, p) => s + p.total, 0);
  const equipoAdmin = users.filter((u) => rolesCuentaPlataforma("ceo").includes(u.role));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resumen"
        description="Cuentas raíz (CEO / Master App): crea el equipo administrativo; cada rol verá solo su área"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/master/administradores" className="block transition hover:opacity-90">
          <Card className="h-full border-accent/30 bg-accent/5">
            <h2 className="font-display text-lg font-semibold text-accent">Equipo administrativo</h2>
            <p className="mt-2 text-3xl font-bold">{equipoAdmin.length}</p>
            <p className="mt-1 text-sm text-neutral-400">
              {equipoAdmin.length === 0
                ? "Crea Administrador, Recursos Humanos y Contabilidad"
                : "Administrador · RR. HH. · Contabilidad"}
            </p>
            <span className="mt-3 inline-block text-sm text-accent underline">Crear cuentas →</span>
          </Card>
        </Link>
        <Link to="/master/roles" className="block transition hover:opacity-90">
          <Card className="h-full">
            <h2 className="font-display text-lg font-semibold">Roles y puestos</h2>
            <p className="mt-2 text-3xl font-bold">{customRoles.length}</p>
            <p className="mt-1 text-sm text-neutral-400">
              {customRoles.length === 0
                ? "Importa plantillas para asignar puestos al personal"
                : "Plantillas listas para asignar en Personal"}
            </p>
            <span className="mt-3 inline-block text-sm text-accent underline">Gestionar roles →</span>
          </Card>
        </Link>
        <Link to="/master/trabajadores" className="block transition hover:opacity-90">
          <Card className="h-full border-positive/30 bg-positive/5">
            <h2 className="font-display text-lg font-semibold text-positive">Trabajadores en vivo</h2>
            <p className="mt-2 text-3xl font-bold">{workers.length}</p>
            <p className="mt-1 text-sm text-neutral-400">
              {activos > 0
                ? `${activos} en jornada ahora — ver qué hace cada uno`
                : "Ver personal de campo, jornadas GPS y turnos"}
            </p>
            <span className="mt-3 inline-block text-sm text-positive underline">Ver actividad →</span>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Eventos" value={String(events.length)} />
        <Link to="/master/trabajadores" className="block transition hover:opacity-90">
          <MetricCard label="Trabajadores" value={String(workers.length)} />
        </Link>
        <Link to="/master/trabajadores" className="block transition hover:opacity-90">
          <MetricCard label="Jornadas activas" value={String(activos)} tone="positive" />
        </Link>
        <MetricCard label="Reportes abiertos" value={String(reportesAbiertos)} tone="alert" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-display text-lg font-semibold">Cuentas administrativas</h2>
          <p className="mt-2 text-3xl font-bold">{equipoAdmin.length}</p>
          <p className="text-sm text-neutral-400">
            {ROLES_PERSONAL_ADMIN.map((r) => r.replace("_", " ")).join(", ")}
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Nómina acumulada</h2>
          <p className="mt-2 text-3xl font-bold">{formatCurrencyCOP(nominaTotal)}</p>
          <p className="text-sm text-neutral-400">{payroll.length} registros</p>
        </Card>
        <Link to="/master/comunicacion" className="block transition hover:opacity-90">
          <Card className="h-full border-accent/30 bg-accent/5">
            <h2 className="font-display text-lg font-semibold text-accent">Chat y videollamadas</h2>
            <p className="mt-2 text-sm text-neutral-300">
              Ve y únete a las conversaciones del evento: general, empleados o supervisores.
            </p>
            <span className="mt-3 inline-block text-sm text-accent underline">Abrir chat →</span>
          </Card>
        </Link>
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
              <span className="text-neutral-500">{e.sitioIds.length} sitio(s)</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
