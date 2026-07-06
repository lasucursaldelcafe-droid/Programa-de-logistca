import type { IntegracionConexion } from "@spe/shared";
import type { ConnectorResult, IntegrationConnector, SiigoInvoice } from "../types";

/**
 * Mapeo objetivo Siigo API → módulos SPE (producción).
 * Ver docs-source/INTEGRACIONES-APIS.md
 */
export const SIIGO_SYNC_MAP = {
  customers: { endpoint: "GET /v1/customers", speModule: "Clientes", speType: "Cliente" },
  products: { endpoint: "GET /v1/products", speModule: "Inventario", speType: "Producto" },
  invoices: { endpoint: "GET /v1/invoices", speModule: "Facturación", speType: "Factura" },
  creditNotes: { endpoint: "GET /v1/credit-notes", speModule: "Facturación", speType: "Nota crédito" },
  vouchers: { endpoint: "GET /v1/vouchers", speModule: "Facturación", speType: "Recibo de caja" },
} as const;

/** Auth: POST https://api.siigo.com/auth { username, access_key } + header Partner-Id */
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
      return { ok: false, error: "Access Key requerida" };
    }
    this.status = "conectado";
    const recursos = Object.values(SIIGO_SYNC_MAP).map((r) => r.speModule).join(", ");
    return {
      ok: true,
      data: {
        id: "siigo",
        nombre: this.nombre,
        descripcion: this.descripcion,
        estado: "conectado",
        ultimaSync: new Date().toISOString(),
        mensaje: `Demo conectado — en producción sincroniza: ${recursos}`,
      },
    };
  }

  async disconnect(): Promise<ConnectorResult<void>> {
    this.status = "desconectado";
    return { ok: true };
  }

  async test(): Promise<ConnectorResult<string>> {
    if (this.status !== "conectado") return { ok: false, error: "Siigo no conectado" };
    return {
      ok: true,
      data: "Ping OK — auth POST /auth + Partner-Id (demo; ver INTEGRACIONES-APIS.md)",
    };
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
