export type EstadoFactura = "borrador" | "emitida" | "pagada" | "anulada";
export type TipoIntegracion = "siigo" | "whatsapp" | "facebook" | "instagram" | "webhook" | "web_form";
export type EstadoConexion = "desconectado" | "conectando" | "conectado" | "error";

export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
  ciudad: string;
  carteraPendiente: number;
  creadoEn: string;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  unidad: string;
}

export interface Factura {
  id: string;
  numero: string;
  clienteId: string;
  clienteNombre: string;
  total: number;
  estado: EstadoFactura;
  emitidaEn: string;
  venceEn: string;
}

export interface IntegracionConexion {
  id: TipoIntegracion;
  nombre: string;
  descripcion: string;
  estado: EstadoConexion;
  ultimaSync?: string;
  mensaje?: string;
}

export interface MensajeWhatsApp {
  id: string;
  de: string;
  texto: string;
  timestamp: string;
  leido: boolean;
}

export interface ActividadSocial {
  id: string;
  red: "facebook" | "instagram";
  tipo: "comentario" | "mensaje" | "mencion";
  autor: string;
  contenido: string;
  timestamp: string;
}

export interface WebhookEvento {
  id: string;
  origen: string;
  payload: string;
  recibidoEn: string;
  procesado: boolean;
}

export interface PosicionTrabajador {
  workerId: string;
  workerNombre: string;
  lat: number;
  lng: number;
  sitioNombre: string;
  estado: string;
  actualizadoEn: string;
}

export function formatCurrencyCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
