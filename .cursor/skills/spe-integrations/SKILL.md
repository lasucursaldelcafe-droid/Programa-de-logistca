---
name: spe-integrations
description: Hub de integraciones API — Siigo, WhatsApp, redes sociales, webhooks. Patrones de conectores demo y UI.
---

# SPE Integrations

## Package

```
packages/integrations/
├── src/index.ts          # IntegrationHub + integrationHub singleton
├── src/types.ts          # IntegrationConnector, ConnectorResult
└── src/connectors/
    ├── siigo.ts
    ├── whatsapp.ts
    ├── social.ts         # facebook + instagram
    └── web.ts            # webhooks / formularios
```

## Patrón conector

Cada conector implementa `IntegrationConnector`:

```typescript
interface IntegrationConnector {
  id: TipoIntegracion;
  nombre: string;
  descripcion: string;
  connect(apiKey?: string): Promise<ConnectorResult<IntegracionConexion>>;
  disconnect(): Promise<ConnectorResult<void>>;
  test(): Promise<ConnectorResult<string>>;
  getStatus(): EstadoConexion;
}
```

Métodos extra opcionales: `fetchInvoices`, `fetchInbox`, `fetchActivity`, `fetchEvents`.

## Hub

```typescript
import { integrationHub } from "@spe/integrations";

integrationHub.list();           // todas las conexiones
integrationHub.get("siigo");     // conector específico
```

## UI

- Hook: `apps/web/src/hooks/useIntegrations.ts`
- Página: `IntegracionesPage.tsx` — conectar, probar, desconectar, sincronizar demo

## Tipos en shared

`TipoIntegracion`: `siigo | whatsapp | facebook | instagram | webhook | web_form`

## Modo demo

- Delays simulados (400–800 ms)
- Tokens aceptados: cualquier string no vacío
- Sin llamadas HTTP reales en demo

## Producción (futuro)

1. Variables de entorno por conector en `.env.local`
2. Cloud Functions o backend proxy para secretos
3. OAuth para Meta (Facebook/Instagram)
4. Siigo Nube API con API key por tenant
5. WhatsApp Cloud API con webhook verify token

## Al añadir integración

1. Tipo en `packages/shared/src/business.ts` si es nuevo `TipoIntegracion`
2. Clase en `packages/integrations/src/connectors/`
3. Registrar en `IntegrationHub` constructor
4. Icono en `IntegracionesPage` ICONS map
5. Demo fetch en `DemoFetchButton` si tiene método fetch*
