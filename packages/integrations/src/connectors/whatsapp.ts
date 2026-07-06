import type { IntegracionConexion, MensajeWhatsApp } from "@spe/shared";
import type { ConnectorResult, IntegrationConnector } from "../types";

export class WhatsAppConnector implements IntegrationConnector {
  id = "whatsapp" as const;
  nombre = "WhatsApp Business";
  descripcion = "Mensajes, plantillas y notificaciones vía Cloud API";
  private status: IntegracionConexion["estado"] = "desconectado";

  getStatus() {
    return this.status;
  }

  async connect(token = "demo-wa-token"): Promise<ConnectorResult<IntegracionConexion>> {
    this.status = "conectando";
    await delay(600);
    if (!token) {
      this.status = "error";
      return { ok: false, error: "Token de WhatsApp requerido" };
    }
    this.status = "conectado";
    return {
      ok: true,
      data: {
        id: "whatsapp",
        nombre: this.nombre,
        descripcion: this.descripcion,
        estado: "conectado",
        ultimaSync: new Date().toISOString(),
        mensaje: "Webhook activo — +57 300 000 0000 (demo)",
      },
    };
  }

  async disconnect(): Promise<ConnectorResult<void>> {
    this.status = "desconectado";
    return { ok: true };
  }

  async test(): Promise<ConnectorResult<string>> {
    if (this.status !== "conectado") return { ok: false, error: "WhatsApp no conectado" };
    return { ok: true, data: "Mensaje de prueba enviado (demo)" };
  }

  async fetchInbox(): Promise<MensajeWhatsApp[]> {
    return [
      {
        id: "wa1",
        de: "+57 300 111 2233",
        texto: "Confirmo turno de hoy en cocina central",
        timestamp: new Date().toISOString(),
        leido: false,
      },
      {
        id: "wa2",
        de: "+57 310 998 8776",
        texto: "¿A qué hora es el cambio de sitio?",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        leido: true,
      },
    ];
  }

  async sendTemplate(to: string, template: string): Promise<ConnectorResult<string>> {
    if (this.status !== "conectado") return { ok: false, error: "No conectado" };
    return { ok: true, data: `Plantilla "${template}" → ${to} (demo)` };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
