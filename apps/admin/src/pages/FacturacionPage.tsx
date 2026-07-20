import { Card, Badge } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { useFacturas } from "../hooks/useBusiness";
import { formatCurrencyCOP } from "@spe/shared";
import type { EstadoFactura } from "@spe/shared";

const estadoLabel: Record<EstadoFactura, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
};

const estadoTone: Record<EstadoFactura, "neutral" | "pendiente" | "confirmado" | "rechazado"> = {
  borrador: "neutral",
  emitida: "pendiente",
  pagada: "confirmado",
  anulada: "rechazado",
};

export function FacturacionPage() {
  const facturas = useFacturas();
  const total = facturas.filter((f) => f.estado !== "anulada").reduce((s, f) => s + f.total, 0);
  const pendientes = facturas.filter((f) => f.estado === "emitida").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación"
        description="Facturas electrónicas y estados de cobro — compatible con Siigo (demo)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-bold text-accent">{formatCurrencyCOP(total)}</div>
          <div className="text-sm text-neutral-400">Total facturado</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold">{facturas.length}</div>
          <div className="text-sm text-neutral-400">Documentos</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-warning">{pendientes}</div>
          <div className="text-sm text-neutral-400">Por cobrar</div>
        </Card>
      </div>

      {facturas.length === 0 ? (
        <EmptyState
          title="Sin facturas registradas"
          description="Las facturas emitidas desde Siigo aparecerán aquí cuando conectes la integración."
          action={{ to: "/integraciones", label: "Configurar Siigo" }}
        />
      ) : (
        <div className="space-y-3">
          {facturas.map((f) => (
            <Card key={f.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{f.numero}</span>
                  <Badge label={estadoLabel[f.estado]} tone={estadoTone[f.estado]} />
                </div>
                <p className="mt-1 text-sm text-neutral-400">{f.clienteNombre}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrencyCOP(f.total)}</div>
                <div className="text-xs text-neutral-500">
                  Emite: {new Date(f.emitidaEn).toLocaleDateString("es-CO")} · Vence:{" "}
                  {new Date(f.venceEn).toLocaleDateString("es-CO")}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
