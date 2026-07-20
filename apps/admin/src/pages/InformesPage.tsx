import {
  downloadTextFile,
  formatCurrencyCOP,
  puedeVerReportesTrabajadores,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import {
  useAttendances,
  useEvents,
  useReportes,
  useShifts,
  useWorkers,
} from "../hooks/useDataStore";
import { usePayrollEntries } from "../hooks/usePayroll";

export function InformesPage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const events = useEvents();
  const shifts = useShifts();
  const attendances = useAttendances();
  const reportes = useReportes();
  const payroll = usePayrollEntries();

  if (!user || !puedeVerReportesTrabajadores(user.role)) {
    return (
      <PermissionDenied
        title="Sin acceso a informes"
        description="Tu rol no puede ver métricas ni exportar informes operativos."
        role={user?.role}
      />
    );
  }

  function exportCsv() {
    const rows = [
      ["Métrica", "Valor"],
      ["Trabajadores", String(workers.length)],
      ["Eventos", String(events.length)],
      ["Turnos", String(shifts.length)],
      ["Marcaciones", String(attendances.length)],
      ["Reportes de incidencias", String(reportes.length)],
      ["Nómina total COP", String(payroll.reduce((s, p) => s + p.total, 0))],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const fecha = new Date().toISOString().slice(0, 10);
    downloadTextFile(`informe-operacion-${fecha}.csv`, csv);
  }

  const nominaTotal = payroll.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes"
        description="Resumen exportable de la operación de tu empresa"
      >
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/90"
        >
          Exportar CSV
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm text-neutral-400">Personal registrado</h2>
          <p className="mt-2 text-3xl font-bold">{workers.length}</p>
        </Card>
        <Card>
          <h2 className="text-sm text-neutral-400">Eventos</h2>
          <p className="mt-2 text-3xl font-bold">{events.length}</p>
        </Card>
        <Card>
          <h2 className="text-sm text-neutral-400">Turnos programados</h2>
          <p className="mt-2 text-3xl font-bold">{shifts.length}</p>
        </Card>
        <Card>
          <h2 className="text-sm text-neutral-400">Marcaciones</h2>
          <p className="mt-2 text-3xl font-bold">{attendances.length}</p>
        </Card>
        <Card>
          <h2 className="text-sm text-neutral-400">Incidencias reportadas</h2>
          <p className="mt-2 text-3xl font-bold">{reportes.length}</p>
        </Card>
        <Card>
          <h2 className="text-sm text-neutral-400">Nómina acumulada</h2>
          <p className="mt-2 text-2xl font-bold text-accent">
            {formatCurrencyCOP(nominaTotal)}
          </p>
        </Card>
      </div>
    </div>
  );
}
