import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  attendanceBySiteBars,
  buildDashboardKpis,
  buildSiteBreakdown,
  buildWorkerDashboardKpis,
  formatCurrencyCOP,
  notificationsToActivity,
  payrollStatusBars,
  puedeGestionarConfiguracion,
  puedeVerDashboardOperativo,
  shiftStatusBars,
  workerPath,
  workerStatusBars,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { MetricCard } from "../components/dashboard/MetricCard";
import { BarChart } from "../components/dashboard/BarChart";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { SiteBreakdown } from "../components/dashboard/SiteBreakdown";
import {
  useAttendances,
  useEvents,
  useInvitations,
  useShifts,
  useSites,
  useWorkers,
} from "../hooks/useDataStore";
import { usePayrollEntries } from "../hooks/usePayroll";
import { useNotifications } from "../hooks/useNotifications";
import { SetupBanner } from "../components/SetupBanner";
import { PageHeader } from "../components/nav/PageHeader";

export function HomePage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const shifts = useShifts();
  const events = useEvents();
  const sites = useSites();
  const attendances = useAttendances();
  const payroll = usePayrollEntries();
  const invitations = useInvitations();
  const notifications = useNotifications(user);
  const [filtroEvento, setFiltroEvento] = useState("");

  const esOperativo = user && puedeVerDashboardOperativo(user.role);
  const esTrabajador = user?.role === "trabajador";

  const shiftsScoped = useMemo(
    () => (filtroEvento ? shifts.filter((s) => s.eventId === filtroEvento) : shifts),
    [shifts, filtroEvento],
  );
  const attendancesScoped = useMemo(
    () =>
      filtroEvento ? attendances.filter((a) => a.eventId === filtroEvento) : attendances,
    [attendances, filtroEvento],
  );
  const payrollScoped = useMemo(
    () => (filtroEvento ? payroll.filter((p) => p.eventId === filtroEvento) : payroll),
    [payroll, filtroEvento],
  );
  const workersScoped = useMemo(() => {
    if (!filtroEvento) return workers;
    const ids = new Set(shiftsScoped.map((s) => s.workerId));
    return workers.filter((w) => ids.has(w.id));
  }, [workers, shiftsScoped, filtroEvento]);

  const kpis = useMemo(
    () =>
      buildDashboardKpis({
        workers,
        shifts,
        attendances,
        payroll,
        invitations,
        eventId: filtroEvento || undefined,
      }),
    [workers, shifts, attendances, payroll, invitations, filtroEvento],
  );

  const workerKpis = useMemo(() => {
    if (!user?.workerId) return null;
    return buildWorkerDashboardKpis(user.workerId, shifts, attendances, payroll);
  }, [user?.workerId, shifts, attendances, payroll]);

  const activity = useMemo(
    () => notificationsToActivity(notifications),
    [notifications],
  );

  const siteRows = useMemo(
    () =>
      buildSiteBreakdown(
        sites,
        attendances,
        shifts,
        events,
        filtroEvento || undefined,
      ),
    [sites, attendances, shifts, events, filtroEvento],
  );

  if (!user) return null;

  if (esTrabajador && workerKpis) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Mi panel"
          description="Turnos, jornada y nómina"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            value={workerKpis.turnosPendientes}
            label="Turnos pendientes"
            tone="accent"
          />
          <MetricCard
            value={workerKpis.turnosConfirmados}
            label="Turnos confirmados"
            tone="positive"
          />
          <MetricCard
            value={workerKpis.jornadaActiva ? "Sí" : "No"}
            label="Jornada activa"
            tone={workerKpis.jornadaActiva ? "positive" : "neutral"}
          />
          <MetricCard
            value={formatCurrencyCOP(workerKpis.nominaPendienteMonto)}
            label="Nómina pendiente"
            tone="accent"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-semibold">Accesos rápidos</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <QuickLink to={workerPath("turnos")} label="Mis turnos" />
              <QuickLink to={workerPath("entrada")} label="Marcar entrada" />
              <QuickLink to={workerPath("notificaciones")} label="Notificaciones" />
            </div>
            {workerKpis.alertaGeocerca && (
              <p className="mt-4 rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
                Tienes una alerta de geocerca activa. Revisa tu ubicación.
              </p>
            )}
            <p className="mt-4 text-sm text-neutral-500">
              Horas trabajadas (30 días):{" "}
              <span className="font-mono text-neutral-300">
                {workerKpis.horasTrabajadasMes}h
              </span>
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-lg font-semibold">Actividad reciente</h2>
            <div className="mt-4">
              <ActivityFeed items={activity} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {user && puedeGestionarConfiguracion(user.role) && <SetupBanner />}
      <PageHeader
        title="Resumen"
        description="Personal, turnos, GPS y nómina"
      >
        {esOperativo && events.length > 0 && (
          <label className="text-sm">
            <span className="sr-only">Evento</span>
            <select
              value={filtroEvento}
              onChange={(e) => setFiltroEvento(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            >
              <option value="">Todos los eventos</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard value={kpis.workersTotal} label="Trabajadores" />
        <MetricCard value={kpis.workersEnSitio} label="En sitio" tone="positive" />
        <MetricCard value={kpis.turnosPendientes} label="Turnos pendientes" tone="accent" />
        <MetricCard value={kpis.jornadasActivas} label="Jornadas GPS" tone="positive" />
        <MetricCard value={kpis.alertasGeocerca} label="Alertas geocerca" tone="alert" />
        <MetricCard
          value={kpis.nominaPendienteCount}
          label="Nómina pendiente"
          sublabel={formatCurrencyCOP(kpis.nominaPendienteMonto)}
          tone="accent"
        />
        <MetricCard value={kpis.turnosConfirmados} label="Turnos confirmados" tone="positive" />
        <MetricCard value={kpis.jornadasCerradas} label="Jornadas cerradas" />
        <MetricCard
          value={formatCurrencyCOP(kpis.nominaPagadaMonto)}
          label="Nómina pagada"
          tone="positive"
        />
        <MetricCard
          value={kpis.cuentasSinActivar}
          label="Sin cuenta activa"
          sublabel={`${kpis.invitacionesPendientes} invitaciones`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <BarChart title="Personal por estado" bars={workerStatusBars(workersScoped)} />
        </Card>
        <Card>
          <BarChart title="Turnos por estado" bars={shiftStatusBars(shiftsScoped)} />
        </Card>
        <Card>
          <BarChart
            title="Jornadas activas por sitio"
            bars={attendanceBySiteBars(attendancesScoped, sites)}
          />
        </Card>
        <Card>
          <BarChart title="Nómina por estado" bars={payrollStatusBars(payrollScoped)} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {esOperativo && (
          <Card>
            <h2 className="font-display text-lg font-semibold">Resumen por sitio</h2>
            <div className="mt-4">
              <SiteBreakdown rows={siteRows} />
            </div>
          </Card>
        )}
        <Card>
          <h2 className="font-display text-lg font-semibold">Actividad reciente</h2>
          <div className="mt-4">
            <ActivityFeed items={activity} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/50 hover:text-accent"
    >
      {label}
    </Link>
  );
}
