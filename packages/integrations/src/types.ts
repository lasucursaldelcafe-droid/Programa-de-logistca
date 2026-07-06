import type {
  ActividadSocial,
  EstadoConexion,
  IntegracionConexion,
  MensajeWhatsApp,
  TipoIntegracion,
  WebhookEvento,
} from "@spe/shared";

export interface ConnectorResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SiigoInvoice {
  id: string;
  number: string;
  customer: string;
  total: number;
  status: string;
}

export interface IntegrationConnector {
  id: TipoIntegracion;
  nombre: string;
  descripcion: string;
  connect(apiKey?: string): Promise<ConnectorResult<IntegracionConexion>>;
  disconnect(): Promise<ConnectorResult<void>>;
  test(): Promise<ConnectorResult<string>>;
  getStatus(): EstadoConexion;
}

export type {
  ActividadSocial,
  MensajeWhatsApp,
  WebhookEvento,
};
