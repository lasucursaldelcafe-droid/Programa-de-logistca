import { useSyncExternalStore } from "react";
import type { Cliente, Factura, PosicionTrabajador, Producto } from "@spe/shared";
import { demoStore } from "../demo/store";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function useClientes(): Cliente[] {
  return useDemoSnapshot(() => demoStore.clientes);
}

export function useProductos(): Producto[] {
  return useDemoSnapshot(() => demoStore.productos);
}

export function useFacturas(): Factura[] {
  return useDemoSnapshot(() => demoStore.facturas);
}

export function usePosiciones(): PosicionTrabajador[] {
  return useDemoSnapshot(() => demoStore.posiciones);
}

export function useBusinessKpis() {
  const clientes = useClientes();
  const facturas = useFacturas();
  const productos = useProductos();

  const ventasMes = facturas
    .filter((f) => f.estado !== "anulada")
    .reduce((s, f) => s + f.total, 0);
  const cartera = clientes.reduce((s, c) => s + c.carteraPendiente, 0);
  const stockBajo = productos.filter((p) => p.stock < 30).length;

  return { ventasMes, cartera, clientes: clientes.length, stockBajo, facturas: facturas.length };
}

export function addCliente(data: Omit<Cliente, "id" | "creadoEn">): string {
  return demoStore.addCliente(data);
}

export function removeCliente(id: string): void {
  demoStore.removeCliente(id);
}

export function addProducto(data: Omit<Producto, "id">): string {
  return demoStore.addProducto(data);
}

export function removeProducto(id: string): void {
  demoStore.removeProducto(id);
}
