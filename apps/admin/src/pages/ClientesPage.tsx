import { Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { useClientes } from "../hooks/useBusiness";
import { formatCurrencyCOP } from "@spe/shared";

export function ClientesPage() {
  const clientes = useClientes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cartera y contactos — sincronizable con Siigo Nube (demo)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-bold">{clientes.length}</div>
          <div className="text-sm text-neutral-400">Clientes activos</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-warning">
            {formatCurrencyCOP(clientes.reduce((s, c) => s + c.carteraPendiente, 0))}
          </div>
          <div className="text-sm text-neutral-400">Cartera total</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-positive">
            {clientes.filter((c) => c.carteraPendiente === 0).length}
          </div>
          <div className="text-sm text-neutral-400">Al día</div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        {clientes.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin clientes registrados"
              description="Conecta Siigo u otra integración para importar tu cartera."
              action={{ to: "/integraciones", label: "Ver integraciones" }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-bg/50 text-xs uppercase text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3">
                    NIT
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Ciudad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Contacto
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Cartera
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-bg/30">
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{c.nit}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.ciudad}</td>
                    <td className="px-4 py-3 text-neutral-400">
                      {c.email}
                      <br />
                      <span className="text-xs">{c.telefono}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={c.carteraPendiente > 0 ? "text-warning" : "text-positive"}>
                        {formatCurrencyCOP(c.carteraPendiente)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
