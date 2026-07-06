import { Card } from "../components/ui";
import { useProductos } from "../hooks/useBusiness";
import { formatCurrencyCOP } from "@spe/shared";

export function InventarioPage() {
  const productos = useProductos();
  const stockBajo = productos.filter((p) => p.stock < 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Inventario</h1>
        <p className="mt-1 text-neutral-400">
          Productos y servicios — stock y precios (demo).
        </p>
      </div>

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
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg/50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
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
      </Card>
    </div>
  );
}
