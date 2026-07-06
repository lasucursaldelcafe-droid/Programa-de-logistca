import type { IntegracionConexion, TipoIntegracion } from "@spe/shared";
import { SiigoConnector } from "./connectors/siigo";
import { WhatsAppConnector } from "./connectors/whatsapp";
import { SocialConnector } from "./connectors/social";
import { WebConnector } from "./connectors/web";
import type { IntegrationConnector } from "./types";

export * from "./types";
export { SiigoConnector, WhatsAppConnector, SocialConnector, WebConnector };

export class IntegrationHub {
  readonly connectors: Map<TipoIntegracion, IntegrationConnector>;

  constructor() {
    this.connectors = new Map<TipoIntegracion, IntegrationConnector>([
      ["siigo", new SiigoConnector()],
      ["whatsapp", new WhatsAppConnector()],
      ["facebook", new SocialConnector("facebook")],
      ["instagram", new SocialConnector("instagram")],
      ["webhook", new WebConnector()],
    ]);
  }

  get(id: TipoIntegracion): IntegrationConnector | undefined {
    return this.connectors.get(id);
  }

  list(): IntegracionConexion[] {
    return Array.from(this.connectors.values()).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      estado: c.getStatus(),
    }));
  }
}

export const integrationHub = new IntegrationHub();
