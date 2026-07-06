import type { ActividadSocial, IntegracionConexion } from "@spe/shared";
import type { ConnectorResult, IntegrationConnector } from "../types";

export class SocialConnector implements IntegrationConnector {
  id: "facebook" | "instagram";
  nombre: string;
  descripcion: string;
  private status: IntegracionConexion["estado"] = "desconectado";

  constructor(red: "facebook" | "instagram") {
    this.id = red;
    this.nombre = red === "facebook" ? "Facebook" : "Instagram";
    this.descripcion = `Mensajes, comentarios y leads desde ${this.nombre} Graph API`;
  }

  getStatus() {
    return this.status;
  }

  async connect(token = "demo-social"): Promise<ConnectorResult<IntegracionConexion>> {
    this.status = "conectando";
    await delay(500);
    this.status = "conectado";
    return {
      ok: true,
      data: {
        id: this.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        estado: "conectado",
        ultimaSync: new Date().toISOString(),
        mensaje: "Página vinculada (demo)",
      },
    };
  }

  async disconnect(): Promise<ConnectorResult<void>> {
    this.status = "desconectado";
    return { ok: true };
  }

  async test(): Promise<ConnectorResult<string>> {
    if (this.status !== "conectado") return { ok: false, error: `${this.nombre} no conectado` };
    return { ok: true, data: `Feed ${this.nombre} accesible (demo)` };
  }

  async fetchActivity(): Promise<ActividadSocial[]> {
    return [
      {
        id: `${this.id}-1`,
        red: this.id,
        tipo: "comentario",
        autor: "cliente_demo",
        contenido: "¿Tienen disponibilidad para evento del 15?",
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
