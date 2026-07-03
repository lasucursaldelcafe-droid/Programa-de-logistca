import { Card } from "@core/components/ui";
import { usePayrollAudit } from "@core/hooks/usePayroll";

export function AuditoriaPage() {
  const audit = usePayrollAudit();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Auditoría</h1>
        <p className="mt-1 text-neutral-400">
          Historial de acciones en nómina y operación financiera
        </p>
      </div>
      <Card>
        <div className="space-y-3">
          {audit.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin registros de auditoría.</p>
          ) : (
            audit.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-border bg-bg px-4 py-3 text-sm"
              >
                <div className="font-medium">{a.accion}</div>
                <div className="text-neutral-400">
                  {a.actorNombre} · {new Date(a.timestamp).toLocaleString("es-CO")}
                </div>
                {a.detalle && (
                  <p className="mt-1 text-neutral-500">{a.detalle}</p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
