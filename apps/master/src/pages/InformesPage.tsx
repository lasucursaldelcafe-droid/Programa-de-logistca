import { formatCurrencyCOP } from "@spe/shared";
import { Card } from "@core/components/ui";
import {
  useAttendances,
  useEvents,
  useReportes,
  useShifts,
  useWorkers,
} from "@core/hooks/useDataStore";
import { usePayrollEntries } from "@core/hooks/usePayroll";

export function InformesPage() {
  const workers = useWorkers();
  const events = useEvents();
  const shifts = useShifts();
  const attendances = useAttendances();
  const reportes = useReportes();
  const payroll = usePayrollEntries();

  function exportCsv() {
    const rows = [
      ["Métrica", "Valor"],
      ["Trabajadores", String(workers.length)],
      ["Eventos", String(events.length)],
      ["Turnos", String(shifts.length)],
      ["Asistencias", String(attendances.length)],
      ["Reportes", String(reportes.length)],
      ["Nómina total COP", String(payroll.reduce((s, p) => s + p.total, 0))],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-plataforma-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Informes globales</h1>
          <p className="mt-1 text-neutral-400">
            Resumen exportable de toda la operación en la plataforma
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm text-neutral-400">Personal registrado</h2>
          <p className="mt-2 text-3xl font-bold">{workers.length}</p>
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
          <h2 className="text-sm text-neutral-400">Nómina total</h2>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrencyCOP(payroll.reduce((s, p) => s + p.total, 0))}
          </p>
        </Card>
      </div>
    </div>
  );
}
