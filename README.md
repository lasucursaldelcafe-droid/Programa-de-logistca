# Programa de Logística

Aplicación web para registrar envíos y hacer seguimiento de su estado de entrega.
Construida con **Next.js 16 (App Router) + TypeScript**, **Drizzle ORM** sobre
**libSQL/SQLite** y **Tailwind CSS v4**.

En desarrollo usa una base de datos SQLite local (sin servicios externos). El mismo
código funciona contra **Turso** definiendo `TURSO_DATABASE_URL` (y `TURSO_AUTH_TOKEN`).

## Requisitos

- Node.js 22+
- npm

## Puesta en marcha

```bash
npm install        # instalar dependencias
npm run db:init    # crear el esquema (idempotente) en ./data/logistica.db
npm run db:seed    # (opcional) datos de ejemplo
npm run dev        # servidor de desarrollo en http://localhost:3000
```

## Scripts

| Script            | Descripción                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo (Turbopack) en el puerto 3000.   |
| `npm run build`   | Build de producción.                                    |
| `npm start`       | Sirve el build de producción.                           |
| `npm run lint`    | ESLint (config `eslint-config-next`).                   |
| `npm test`        | Tests unitarios con Vitest.                             |
| `npm run db:init` | Crea el esquema de la base de datos (idempotente).      |
| `npm run db:seed` | Inserta envíos de ejemplo.                              |
| `npm run db:studio` | Abre Drizzle Studio para inspeccionar la base de datos. |

## Estructura

```
src/
  app/
    page.tsx                 # Panel: crear/listar envíos y cambiar estado
    layout.tsx
    api/envios/route.ts      # GET (listar) y POST (crear)
    api/envios/[id]/route.ts # PATCH (cambiar estado) y DELETE
  db/
    schema.ts                # Esquema Drizzle de `envios`
    index.ts                 # Cliente libSQL/Drizzle (local o Turso)
  lib/
    logistica.ts             # Dominio: validación, códigos, transiciones de estado
scripts/
  db-init.ts                 # Crea el esquema
  db-seed.ts                 # Datos de ejemplo
tests/
  logistica.test.ts          # Tests del dominio
```

## Configuración (opcional, para Turso)

Crea un archivo `.env.local`:

```bash
TURSO_DATABASE_URL=libsql://<tu-base>.turso.io
TURSO_AUTH_TOKEN=<token>
```

Sin estas variables se usa `file:./data/logistica.db` automáticamente.

## Modelo de estados de un envío

`pendiente → en_transito → entregado`, con `cancelado` disponible desde
`pendiente` o `en_transito`. Los estados `entregado` y `cancelado` son terminales.
