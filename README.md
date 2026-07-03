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

## Versión estática (GitHub Pages)

Además de la app Next.js, hay una versión **estática autónoma** en
[`docs/index.html`](docs/index.html): un único archivo HTML (sin build ni
dependencias) con **inicio de sesión** y gestión de envíos, con persistencia en
`localStorage`. Sirve para probar la interfaz directamente desde GitHub sin
levantar un servidor Node ni credenciales.

- **Probar en local:**
  ```bash
  python3 -m http.server 8080 --directory docs
  # abre http://localhost:8080
  ```
- **Publicación automática:** el workflow
  [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica `docs/` en
  **GitHub Pages** en cada push a `main` (auto-habilita Pages). Tras el primer
  despliegue, el sitio queda disponible en
  `https://<usuario>.github.io/Programa-de-logistca/`.
- **Sesiones:** el login crea una sesión local (nombre de usuario + correo
  opcional) guardada en `localStorage`; "Cerrar sesión" la elimina.
- **Inicio de sesión con Google (opcional):** la pantalla de login integra
  Google Identity Services. Para activarlo, define tu Client ID de OAuth de una
  de estas formas:
  1. Edita `GOOGLE_CLIENT_ID` en `docs/index.html`, o
  2. Añade `?client_id=TU_ID.apps.googleusercontent.com` a la URL (se recuerda en
     `localStorage`).

  Con el Client ID configurado aparece el botón "Iniciar sesión con Google" y la
  sesión se abre con el nombre/correo de la cuenta Google. Requisito: en Google
  Cloud, el **origen JavaScript autorizado** debe incluir el dominio donde se
  sirva (p. ej. `https://<usuario>.github.io` para Pages, o `http://localhost:8080`
  para pruebas locales). El Client ID es un valor público (no es un secreto).

## Configuración (opcional, para Turso)

Crea un archivo `.env.local` (o ejecuta `npm run setup:all`):

```bash
npm run setup:all    # orquesta Turso + DB + config estática
npm run setup:turso    # solo Turso (requiere TURSO_PLATFORM_TOKEN)
npm run setup:google   # guía OAuth Google Cloud
```

Variables en `.env.example`. Para producción, configura estos **secrets en GitHub**
(Settings → Secrets → Actions):

| Secret | Uso |
|--------|-----|
| `TURSO_PLATFORM_TOKEN` | Crea BD `programa-de-logistica` en Turso |
| `TURSO_DATABASE_URL` | URL libsql (generada por setup:turso) |
| `TURSO_AUTH_TOKEN` | JWT de la BD (generado por setup:turso) |
| `GOOGLE_CLIENT_ID` | Login Google (Next.js + estático) |
| `GOOGLE_CLIENT_SECRET` | OAuth servidor (Vercel) |
| `VERCEL_TOKEN` | Despliegue CI en Vercel |
| `VERCEL_ORG_ID` | Organización Vercel |

```bash
TURSO_DATABASE_URL=libsql://<tu-base>.turso.io
TURSO_AUTH_TOKEN=<token>
```

Sin estas variables se usa `file:./data/logistica.db` automáticamente.

## Despliegues conectados

- **Vercel (Next.js):** `.github/workflows/vercel-deploy.yml` — push a `main`
- **GitHub Pages (estático):** `.github/workflows/pages-gh-pages.yml` → rama `gh-pages`
  (Settings → Pages → branch `gh-pages`)
- **Provisionar:** `.github/workflows/provision-integrations.yml` — Turso + Google al tener secrets

## Modelo de estados de un envío

`pendiente → en_transito → entregado`, con `cancelado` disponible desde
`pendiente` o `en_transito`. Los estados `entregado` y `cancelado` son terminales.
