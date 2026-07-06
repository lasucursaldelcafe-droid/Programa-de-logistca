import type { IntegracionConexion, WebhookEvento } from "@spe/shared";
import type { ConnectorResult, IntegrationConnector } from "../types";

export class WebConnector implements IntegrationConnector {
  id = "webhook" as const;
  nombre = "Web y formularios";
  descripcion = "Webhooks entrantes, formularios web y leads del sitio";
  private status: IntegracionConexion["estado"] = "desconectado";

  getStatus() {
    return this.status;
  }

  async connect(endpoint = "https://api.tu-dominio.com/webhooks/spe"): Promise<ConnectorResult<IntegracionConexion>> {
    this.status = "conectando";
    await delay(400);
    this.status = "conectado";
    return {
      ok: true,
      data: {
        id: "webhook",
        nombre: this.nombre,
        descripcion: this.descripcion,
        estado: "conectado",
        ultimaSync: new Date().toISOString(),
        mensaje: `Endpoint: ${endpoint}`,
      },
    };
  }

  async disconnect(): Promise<ConnectorResult<void>> {
    this.status = "desconectado";
    return { ok: true };
  }

  async test(): Promise<ConnectorResult<string>> {
    if (this.status !== "conectado") return { ok: false, error: "Webhook no configurado" };
    return { ok: true, data: "POST de prueba recibido 200 OK (demo)" };
  }

  async fetchEvents(): Promise<WebhookEvento[]> {
    return [
      {
        id: "wh1",
        origen: "formulario-contacto",
        payload: '{"nombre":"Laura","servicio":"catering"}',
        recibidoEn: new Date().toISOString(),
        procesado: true,
      },
    ];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
