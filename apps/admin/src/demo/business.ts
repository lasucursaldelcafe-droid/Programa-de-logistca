import type {
  Cliente,
  Factura,
  PosicionTrabajador,
  Producto,
} from "@spe/shared";

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: "cli-1",
    nombre: "Hotel Plaza Bogotá",
    nit: "900123456-1",
    email: "eventos@hotelplaza.co",
    telefono: "6015550100",
    ciudad: "Bogotá",
    carteraPendiente: 2400000,
    creadoEn: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "cli-2",
    nombre: "Catering Andino SAS",
    nit: "901987654-3",
    email: "compras@cateringandino.com",
    telefono: "6017778899",
    ciudad: "Medellín",
    carteraPendiente: 890000,
    creadoEn: "2026-02-20T14:00:00.000Z",
  },
  {
    id: "cli-3",
    nombre: "Festival Gastronómico",
    nit: "800456789-0",
    email: "produccion@festivalgastro.co",
    telefono: "3002223344",
    ciudad: "Cali",
    carteraPendiente: 0,
    creadoEn: "2026-03-01T09:00:00.000Z",
  },
];

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: "prod-1",
    codigo: "SRV-LOG",
    nombre: "Servicio logística evento (hora)",
    categoria: "Servicios",
    precio: 45000,
    stock: 999,
    unidad: "hora",
  },
  {
    id: "prod-2",
    codigo: "SRV-MONT",
    nombre: "Montaje escenario",
    categoria: "Servicios",
    precio: 320000,
    stock: 50,
    unidad: "unidad",
  },
  {
    id: "prod-3",
    codigo: "INS-UNIF",
    nombre: "Uniforme personal",
    categoria: "Inventario",
    precio: 85000,
    stock: 120,
    unidad: "unidad",
  },
];

export const INITIAL_FACTURAS: Factura[] = [
  {
    id: "fac-1",
    numero: "FV-1001",
    clienteId: "cli-1",
    clienteNombre: "Hotel Plaza Bogotá",
    total: 2400000,
    estado: "emitida",
    emitidaEn: "2026-06-28T10:00:00.000Z",
    venceEn: "2026-07-28T10:00:00.000Z",
  },
  {
    id: "fac-2",
    numero: "FV-1002",
    clienteId: "cli-2",
    clienteNombre: "Catering Andino SAS",
    total: 890000,
    estado: "pagada",
    emitidaEn: "2026-06-15T10:00:00.000Z",
    venceEn: "2026-07-15T10:00:00.000Z",
  },
  {
    id: "fac-3",
    numero: "FV-1003",
    clienteId: "cli-3",
    clienteNombre: "Festival Gastronómico",
    total: 5200000,
    estado: "borrador",
    emitidaEn: "2026-07-01T10:00:00.000Z",
    venceEn: "2026-08-01T10:00:00.000Z",
  },
];

export const INITIAL_POSICIONES: PosicionTrabajador[] = [
  {
    workerId: "worker-juan",
    workerNombre: "Juan Pérez",
    lat: 4.654,
    lng: -74.084,
    sitioNombre: "Puerta principal",
    estado: "en_sitio",
    actualizadoEn: new Date().toISOString(),
  },
  {
    workerId: "worker-ana",
    workerNombre: "Ana Gómez",
    lat: 4.6535,
    lng: -74.0838,
    sitioNombre: "Cocina central",
    estado: "descanso",
    actualizadoEn: new Date().toISOString(),
  },
];
