import { Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { useProductos } from "../hooks/useBusiness";
import { formatCurrencyCOP } from "@spe/shared";

export function InventarioPage() {
  const productos = useProductos();
  const stockBajo = productos.filter((p) => p.stock < 30);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Productos y servicios — stock y precios (demo)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-bold">{productos.length}</div>
          <div className="text-sm text-neutral-400">Referencias</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-warning">{stockBajo.length}</div>
          <div className="text-sm text-neutral-400">Stock bajo</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-accent">
            {formatCurrencyCOP(productos.reduce((s, p) => s + p.precio, 0))}
          </div>
          <div className="text-sm text-neutral-400">Valor catálogo</div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        {productos.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin productos en el catálogo"
              description="Conecta Siigo u otra integración para importar referencias."
              action={{ to: "/integraciones", label: "Ver integraciones" }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-bg/50 text-xs uppercase text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Categoría
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-bg/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-neutral-400">{p.categoria}</td>
                    <td className="px-4 py-3 text-right">{formatCurrencyCOP(p.precio)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.stock < 30 ? "text-warning" : "text-positive"}>
                        {p.stock} {p.unidad}
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
