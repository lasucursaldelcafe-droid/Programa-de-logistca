import type { IntegracionConexion } from "@spe/shared";
import type { ConnectorResult, IntegrationConnector, SiigoInvoice } from "../types";

export class SiigoConnector implements IntegrationConnector {
  id = "siigo" as const;
  nombre = "Siigo";
  descripcion = "Contabilidad, facturación electrónica y cartera (API Siigo Nube)";
  private status: IntegracionConexion["estado"] = "desconectado";

  getStatus() {
    return this.status;
  }

  async connect(apiKey = "demo-siigo-key"): Promise<ConnectorResult<IntegracionConexion>> {
    this.status = "conectando";
    await delay(800);
    if (!apiKey.trim()) {
      this.status = "error";
      return { ok: false, error: "API key requerida" };
    }
    this.status = "conectado";
    return {
      ok: true,
      data: {
        id: "siigo",
        nombre: this.nombre,
        descripcion: this.descripcion,
        estado: "conectado",
        ultimaSync: new Date().toISOString(),
        mensaje: "Sincronización demo: 12 facturas, 8 clientes",
      },
    };
  }

  async disconnect(): Promise<ConnectorResult<void>> {
    this.status = "desconectado";
    return { ok: true };
  }

  async test(): Promise<ConnectorResult<string>> {
    if (this.status !== "conectado") return { ok: false, error: "Siigo no conectado" };
    return { ok: true, data: "Ping OK — API Siigo Nube (demo)" };
  }

  async fetchInvoices(): Promise<SiigoInvoice[]> {
    return [
      { id: "s1", number: "FV-1001", customer: "Hotel Plaza", total: 2400000, status: "emitida" },
      { id: "s2", number: "FV-1002", customer: "Catering Andino", total: 890000, status: "pagada" },
    ];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
