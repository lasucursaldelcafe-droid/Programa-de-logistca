import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  formatCurrencyCOP,
  puedeGestionarClientes,
  puedeGestionarFacturacion,
  puedeVerInventario,
  type EstadoFactura,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import {
  addCliente,
  addProducto,
  removeCliente,
  removeProducto,
  useBusinessKpis,
  useClientes,
  useFacturas,
  useProductos,
} from "../hooks/useBusiness";

type NegocioTab = "clientes" | "inventario" | "facturacion";

function parseNegocioTab(value: string | null): NegocioTab {
  if (value === "inventario" || value === "facturacion") return value;
  return "clientes";
}

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

export function NegocioPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseNegocioTab(searchParams.get("tab"));

  const clientes = useClientes();
  const productos = useProductos();
  const facturas = useFacturas();
  const kpis = useBusinessKpis();

  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [clienteForm, setClienteForm] = useState({
    nombre: "",
    nit: "",
    email: "",
    telefono: "",
    ciudad: "",
    carteraPendiente: "0",
  });

  const [productoForm, setProductoForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    precio: "",
    stock: "",
    unidad: "und",
  });

  if (
    !user ||
    (!puedeGestionarClientes(user.role) &&
      !puedeGestionarFacturacion(user.role) &&
      !puedeVerInventario(user.role))
  ) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso para negocio"
        description="Solo administradores y supervisores pueden gestionar clientes e inventario."
      />
    );
  }

  function setActiveTab(tab: NegocioTab) {
    setSearchParams(tab === "clientes" ? {} : { tab }, { replace: true });
  }

  const tabClass = (tab: NegocioTab) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-accent text-bg"
        : "border border-border text-neutral-400 hover:border-accent/40"
    }`;

  function crearCliente(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    if (!clienteForm.nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    const nombreGuardado = clienteForm.nombre.trim();
    addCliente({
      nombre: nombreGuardado,
      nit: clienteForm.nit.trim(),
      email: clienteForm.email.trim(),
      telefono: clienteForm.telefono.trim(),
      ciudad: clienteForm.ciudad.trim(),
      carteraPendiente: Number(clienteForm.carteraPendiente) || 0,
    });
    setClienteForm({
      nombre: "",
      nit: "",
      email: "",
      telefono: "",
      ciudad: "",
      carteraPendiente: "0",
    });
    setMensaje(`Cliente «${nombreGuardado}» registrado.`);
  }

  function crearProducto(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    if (!productoForm.nombre.trim() || !productoForm.codigo.trim()) {
      setError("Código y nombre del producto son obligatorios.");
      return;
    }
    const nombreGuardado = productoForm.nombre.trim();
    addProducto({
      codigo: productoForm.codigo.trim(),
      nombre: nombreGuardado,
      categoria: productoForm.categoria.trim() || "General",
      precio: Number(productoForm.precio) || 0,
      stock: Number(productoForm.stock) || 0,
      unidad: productoForm.unidad.trim() || "und",
    });
    setProductoForm({
      codigo: "",
      nombre: "",
      categoria: "",
      precio: "",
      stock: "",
      unidad: "und",
    });
    setMensaje(`Producto «${nombreGuardado}» agregado al inventario.`);
  }

  function eliminarCliente(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar al cliente «${nombre}»?`)) return;
    removeCliente(id);
    setMensaje(`Cliente «${nombre}» eliminado.`);
  }

  function eliminarProducto(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar «${nombre}» del inventario?`)) return;
    removeProducto(id);
    setMensaje(`Producto «${nombre}» eliminado.`);
  }

  const stockBajo = productos.filter((p) => p.stock < 30);
  const totalFacturado = facturas
    .filter((f) => f.estado !== "anulada")
    .reduce((s, f) => s + f.total, 0);
  const pendientes = facturas.filter((f) => f.estado === "emitida").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negocio"
        description="Clientes, inventario y facturación en un solo lugar. También puedes sincronizar con Siigo desde Integraciones."
      />

      <Card className="border-accent/20 bg-accent/5">
        <p className="text-sm text-neutral-300">
          <strong className="text-accent">¿Dónde hago qué?</strong> Registra clientes en la pestaña{" "}
          <button type="button" onClick={() => setActiveTab("clientes")} className="text-accent underline">
            Clientes
          </button>
          , agrega productos en{" "}
          <button type="button" onClick={() => setActiveTab("inventario")} className="text-accent underline">
            Inventario
          </button>
          , y revisa facturas en{" "}
          <button type="button" onClick={() => setActiveTab("facturacion")} className="text-accent underline">
            Facturación
          </button>
          . Para importar desde Siigo, ve a{" "}
          <Link to="/integraciones" className="text-accent underline">
            Integraciones
          </Link>
          .
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-2xl font-bold">{kpis.clientes}</div>
          <div className="text-sm text-neutral-400">Clientes</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold">{productos.length}</div>
          <div className="text-sm text-neutral-400">Productos</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-accent">{formatCurrencyCOP(kpis.ventasMes)}</div>
          <div className="text-sm text-neutral-400">Facturado</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-warning">{kpis.stockBajo}</div>
          <div className="text-sm text-neutral-400">Stock bajo</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabClass("clientes")} onClick={() => setActiveTab("clientes")}>
          Clientes ({clientes.length})
        </button>
        <button type="button" className={tabClass("inventario")} onClick={() => setActiveTab("inventario")}>
          Inventario ({productos.length})
        </button>
        <button type="button" className={tabClass("facturacion")} onClick={() => setActiveTab("facturacion")}>
          Facturación ({facturas.length})
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}
      {mensaje && (
        <p className="rounded-lg bg-positive/10 px-3 py-2 text-sm text-positive">{mensaje}</p>
      )}

      {activeTab === "clientes" && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-lg font-semibold">Nuevo cliente</h2>
            <form onSubmit={crearCliente} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-neutral-300">Nombre o razón social *</span>
                <input
                  value={clienteForm.nombre}
                  onChange={(e) => setClienteForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">NIT</span>
                <input
                  value={clienteForm.nit}
                  onChange={(e) => setClienteForm((f) => ({ ...f, nit: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                  placeholder="900123456-1"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Correo</span>
                <input
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => setClienteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Teléfono</span>
                <input
                  value={clienteForm.telefono}
                  onChange={(e) => setClienteForm((f) => ({ ...f, telefono: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Ciudad</span>
                <input
                  value={clienteForm.ciudad}
                  onChange={(e) => setClienteForm((f) => ({ ...f, ciudad: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Cartera pendiente (COP)</span>
                <input
                  type="number"
                  min="0"
                  value={clienteForm.carteraPendiente}
                  onChange={(e) => setClienteForm((f) => ({ ...f, carteraPendiente: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
                >
                  Crear cliente
                </button>
              </div>
            </form>
          </Card>

          <Card className="overflow-hidden p-0">
            {clientes.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Sin clientes registrados"
                  description="Usa el formulario de arriba o conecta Siigo para importar tu cartera."
                  action={{ to: "/integraciones", label: "Ver integraciones" }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-bg/50 text-xs uppercase text-neutral-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Cliente</th>
                      <th scope="col" className="px-4 py-3">NIT</th>
                      <th scope="col" className="px-4 py-3">Ciudad</th>
                      <th scope="col" className="px-4 py-3">Contacto</th>
                      <th scope="col" className="px-4 py-3 text-right">Cartera</th>
                      <th scope="col" className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-bg/30">
                        <td className="px-4 py-3 font-medium">{c.nombre}</td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-400">{c.nit || "—"}</td>
                        <td className="px-4 py-3 text-neutral-400">{c.ciudad || "—"}</td>
                        <td className="px-4 py-3 text-neutral-400">
                          {c.email || "—"}
                          {c.telefono && (
                            <>
                              <br />
                              <span className="text-xs">{c.telefono}</span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={c.carteraPendiente > 0 ? "text-warning" : "text-positive"}>
                            {formatCurrencyCOP(c.carteraPendiente)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => eliminarCliente(c.id, c.nombre)}
                            className="text-xs text-alert hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "inventario" && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-lg font-semibold">Nuevo producto</h2>
            <form onSubmit={crearProducto} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Código *</span>
                <input
                  value={productoForm.codigo}
                  onChange={(e) => setProductoForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                  placeholder="SKU-001"
                  required
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-neutral-300">Nombre *</span>
                <input
                  value={productoForm.nombre}
                  onChange={(e) => setProductoForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Categoría</span>
                <input
                  value={productoForm.categoria}
                  onChange={(e) => setProductoForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                  placeholder="Bebidas, insumos…"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Precio (COP)</span>
                <input
                  type="number"
                  min="0"
                  value={productoForm.precio}
                  onChange={(e) => setProductoForm((f) => ({ ...f, precio: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Stock inicial</span>
                <input
                  type="number"
                  min="0"
                  value={productoForm.stock}
                  onChange={(e) => setProductoForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-neutral-300">Unidad</span>
                <input
                  value={productoForm.unidad}
                  onChange={(e) => setProductoForm((f) => ({ ...f, unidad: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                  placeholder="und, kg, lt…"
                />
              </label>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
                >
                  Agregar al inventario
                </button>
              </div>
            </form>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <div className="text-2xl font-bold text-warning">{stockBajo.length}</div>
              <div className="text-sm text-neutral-400">Referencias con stock bajo (&lt;30)</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-accent">
                {formatCurrencyCOP(productos.reduce((s, p) => s + p.precio, 0))}
              </div>
              <div className="text-sm text-neutral-400">Valor catálogo (precio unitario)</div>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            {productos.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Sin productos en el catálogo"
                  description="Usa el formulario de arriba o conecta Siigo para importar referencias."
                  action={{ to: "/integraciones", label: "Ver integraciones" }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-bg/50 text-xs uppercase text-neutral-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Código</th>
                      <th scope="col" className="px-4 py-3">Producto</th>
                      <th scope="col" className="px-4 py-3">Categoría</th>
                      <th scope="col" className="px-4 py-3 text-right">Precio</th>
                      <th scope="col" className="px-4 py-3 text-right">Stock</th>
                      <th scope="col" className="px-4 py-3" />
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
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => eliminarProducto(p.id, p.nombre)}
                            className="text-xs text-alert hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "facturacion" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="text-2xl font-bold text-accent">{formatCurrencyCOP(totalFacturado)}</div>
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
      )}
    </div>
  );
}
