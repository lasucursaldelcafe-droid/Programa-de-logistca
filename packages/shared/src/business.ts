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

/** Credenciales guardadas por el administrador (por integración). */
export interface CredencialesIntegracion {
  id: TipoIntegracion;
  apiKey?: string;
  apiSecret?: string;
  token?: string;
  usuario?: string;
  webhookUrl?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  pageId?: string;
  appId?: string;
  verifyToken?: string;
  /** Nombre del archivo JSON/.env subido */
  archivoNombre?: string;
  /** Contenido del archivo (JSON stringificado) */
  archivoJson?: string;
  actualizadoEn?: string;
}

export interface CampoCredencial {
  key: keyof CredencialesIntegracion;
  label: string;
  placeholder?: string;
  type?: "text" | "password" | "url";
  required?: boolean;
}

export const CAMPOS_POR_INTEGRACION: Record<TipoIntegracion, CampoCredencial[]> = {
  siigo: [
    { key: "usuario", label: "Usuario / email Siigo", placeholder: "contabilidad@tuempresa.com", required: true },
    { key: "apiKey", label: "API Key Siigo Nube", type: "password", required: true },
    { key: "apiSecret", label: "Access Key (opcional)", type: "password" },
  ],
  whatsapp: [
    { key: "token", label: "Token permanente Cloud API", type: "password", required: true },
    { key: "phoneNumberId", label: "Phone Number ID", required: true },
    { key: "businessAccountId", label: "WhatsApp Business Account ID" },
    { key: "webhookUrl", label: "URL webhook (tu servidor)", type: "url" },
    { key: "verifyToken", label: "Verify token webhook", type: "password" },
  ],
  facebook: [
    { key: "appId", label: "App ID Meta", required: true },
    { key: "apiSecret", label: "App Secret", type: "password", required: true },
    { key: "token", label: "Page Access Token", type: "password", required: true },
    { key: "pageId", label: "Page ID", required: true },
  ],
  instagram: [
    { key: "appId", label: "App ID Meta", required: true },
    { key: "apiSecret", label: "App Secret", type: "password", required: true },
    { key: "token", label: "Instagram Access Token", type: "password", required: true },
    { key: "pageId", label: "Instagram Business Account ID", required: true },
  ],
  webhook: [
    { key: "webhookUrl", label: "URL endpoint entrante", type: "url", required: true },
    { key: "apiSecret", label: "Secret / firma HMAC", type: "password" },
    { key: "verifyToken", label: "Token verificación", type: "password" },
  ],
  web_form: [
    { key: "webhookUrl", label: "URL formulario / webhook", type: "url", required: true },
    { key: "apiKey", label: "API Key del sitio web" },
  ],
};

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
