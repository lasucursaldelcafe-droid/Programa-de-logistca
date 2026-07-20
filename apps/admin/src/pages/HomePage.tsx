import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  attendanceBySiteBars,
  buildDashboardKpis,
  buildSiteBreakdown,
  formatCurrencyCOP,
  notificationsToActivity,
  payrollStatusBars,
  puedeGestionarConfiguracion,
  puedeVerDashboardOperativo,
  shiftStatusBars,
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
  useEventsState,
  useInvitations,
  useShiftsState,
  useSites,
  useWorkersState,
} from "../hooks/useDataStore";
import { usePayrollEntries } from "../hooks/usePayroll";
import { useNotifications } from "../hooks/useNotifications";
import { SetupBanner } from "../components/SetupBanner";
import { PageHeader } from "../components/nav/PageHeader";
import { EventFlowGuide, computeEventFlowProgress } from "../components/EventFlowGuide";
import { DataLoadingSkeleton, LoadingScreen } from "../components/FeedbackStates";
import { useSetupConfig } from "../hooks/useSetup";

export function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { workers, loading: workersLoading } = useWorkersState();
  const { shifts, loading: shiftsLoading } = useShiftsState();
  const { events, loading: eventsLoading } = useEventsState();
  const sites = useSites();
  const attendances = useAttendances();
  const payroll = usePayrollEntries();
  const invitations = useInvitations();
  const notifications = useNotifications(user);
  const setupConfig = useSetupConfig();
  const [filtroEvento, setFiltroEvento] = useState("");

  const esOperativo = user && puedeVerDashboardOperativo(user.role);
  const puedeFlujo = user && puedeGestionarConfiguracion(user.role);
  const dataLoading = workersLoading || shiftsLoading || eventsLoading;

  const flowCompletedIds = useMemo(
    () =>
      computeEventFlowProgress({
        hasEvents: events.length > 0,
        setupComplete: setupConfig?.completado === true,
        workersCount: workers.length,
        pendingInvitations: invitations.filter((i) => i.estado === "pendiente").length,
        shiftsForEvent: filtroEvento
          ? shifts.filter((s) => s.eventId === filtroEvento).length
          : shifts.length,
      }),
    [events.length, setupConfig?.completado, workers.length, invitations, shifts, filtroEvento],
  );

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

  if (authLoading) return <LoadingScreen />;
  if (!user) return null;

  if (dataLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Resumen" description="Cargando datos del evento…" />
        <DataLoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {user && puedeGestionarConfiguracion(user.role) && <SetupBanner />}
      <div className="spe-glass overflow-hidden rounded-2xl p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Panel operativo</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
          Hola, {user.nombre.split(" ")[0]}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Sigue el flujo:{" "}
          <Link to="/configuracion" className="text-accent hover:underline">
            crear evento
          </Link>
          , registrar personal, invitar cuentas y asignar turnos. El mapa GPS vive en{" "}
          <Link to="/operacion?tab=supervision" className="text-accent hover:underline">
            Supervisión del evento
          </Link>
          .
        </p>
      </div>
      {puedeFlujo && (
        <EventFlowGuide completedStepIds={flowCompletedIds} title="Tu flujo de trabajo" />
      )}
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
