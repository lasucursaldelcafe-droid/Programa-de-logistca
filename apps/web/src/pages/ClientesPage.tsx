import { Card } from "../components/ui";
import { useClientes } from "../hooks/useBusiness";
import { formatCurrencyCOP } from "@spe/shared";

export function ClientesPage() {
  const clientes = useClientes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <p className="mt-1 text-neutral-400">
          Cartera y contactos — sincronizable con Siigo Nube (demo).
        </p>
      </div>

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
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg/50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">NIT</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3 text-right">Cartera</th>
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
      </Card>
    </div>
  );
}
