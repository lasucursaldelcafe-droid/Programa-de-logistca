---
name: spe-negocio-siigo
description: Guía para el módulo ERP tipo Siigo en SPE Negocio — clientes, facturación, inventario, KPIs y UX.
---

# SPE Negocio — módulo Siigo

## Propósito

Extender el monorepo `Programa-de-logistca` con capacidades de gestión empresarial al estilo Siigo, manteniendo la supervisión de personal en vivo.

## Estructura

```
packages/shared/src/business.ts   # Tipos Cliente, Producto, Factura, PosicionTrabajador
apps/web/src/demo/business.ts     # Datos demo iniciales
apps/web/src/demo/store.ts        # DemoStore reactivo (useSyncExternalStore)
apps/web/src/hooks/useBusiness.ts # useClientes, useFacturas, useProductos, usePosiciones, useBusinessKpis
```

## Páginas web

| Ruta | Componente | Acceso |
|------|------------|--------|
| `/` | HomePage | Todos |
| `/clientes` | ClientesPage | Admin/supervisor |
| `/facturacion` | FacturacionPage | Admin/supervisor |
| `/inventario` | InventarioPage | Admin/supervisor |
| `/supervision` | SupervisionPage | Todos |
| `/integraciones` | IntegracionesPage | Todos |

## Convenciones

- Moneda: `formatCurrencyCOP()` de `@spe/shared`
- Estados factura: `borrador | emitida | pagada | anulada`
- Sidebar: secciones Negocio / Personal / Conexiones en `AppLayout.tsx`
- Demo: no persistir en Firestore; usar `demoStore` cuando `DEMO_MODE`

## Supervisión en vivo

- `INITIAL_POSICIONES` en `demo/business.ts`
- `demoStore.tickPosiciones()` — jitter GPS cada 5 s en SupervisionPage
- Mapa CSS demo (sin Google Maps en fase demo)

## Al añadir features ERP

1. Tipos en `packages/shared/src/business.ts`
2. Seed en `apps/web/src/demo/business.ts`
3. Estado en `DemoStore` + método mutación si aplica
4. Hook en `useBusiness.ts`
5. Página en `apps/web/src/pages/`
6. Ruta en `App.tsx` + nav en `AppLayout.tsx`

## Cuentas demo

`admin@eventos.test` / `Admin123!` — acceso completo a módulos negocio.
