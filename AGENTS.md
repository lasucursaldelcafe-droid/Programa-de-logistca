# AGENTS.md

Programa de Logística — app Next.js 16 (App Router, TypeScript) con Drizzle ORM
sobre libSQL/SQLite y Tailwind CSS v4.

## Cursor Cloud specific instructions

- **Servicio único (web app):** todo corre en un solo proceso Next.js. No hay
  backend separado ni servicios externos obligatorios.
- **Base de datos:** en desarrollo se usa SQLite local en `./data/logistica.db`
  (ignorado por git). No requiere credenciales. El `update script` de arranque
  solo instala dependencias; **antes del primer `npm run dev` ejecuta
  `npm run db:init`** para crear el esquema. Es **idempotente**
  (`CREATE TABLE IF NOT EXISTS`), así que puedes ejecutarlo cuantas veces quieras.
  Como `./data` está en `.gitignore`, cada VM nueva empieza sin base de datos:
  ejecuta `npm run db:init` (y opcionalmente `npm run db:seed`).
- **Turso (opcional):** define `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en
  `.env.local` para usar Turso en lugar del archivo local; el resto del código no
  cambia. Con esas variables, `npm run db:init` crea el esquema en Turso.
- **Arrancar la app:** `npm run dev` (puerto 3000, Turbopack). Comandos estándar
  (build/lint/test/seed) están en `README.md` y en los scripts de `package.json`.
- **Scripts con `tsx`:** el proyecto NO usa `"type": "module"`. Por eso los
  scripts en `scripts/*.ts` envuelven el código en una función `main()` async en
  lugar de usar top-level `await` (tsx los transpila a CJS y el top-level await
  falla). Mantén ese patrón al añadir scripts nuevos.
- **Lint (React 19 / Next 16):** la regla `react-hooks/set-state-in-effect`
  prohíbe llamar `setState` de forma síncrona dentro de un `useEffect`. Haz el
  `setState` después de un `await` (o inline la lógica async en el efecto). Ver
  el `useEffect` inicial en `src/app/page.tsx` como referencia.
- **Fuentes:** no se usa `next/font/google` para evitar depender de red durante el
  build. Si añades fuentes de Google, ten en cuenta que el build necesitará red.
- **Sitio estático (`docs/index.html`):** versión HTML autónoma (sin build, sin
  dependencias) de la logística con login de sesión y persistencia en
  `localStorage`. Pruébala con `python3 -m http.server 8080 --directory docs` y
  abre `http://localhost:8080`. OJO: si la app Next.js está corriendo en `:3000`,
  no confundas las URLs — el estático es el `:8080` (empieza con pantalla de
  login; el Next.js no tiene login). Se publica en GitHub Pages vía
  `.github/workflows/pages.yml` (push a `main`, auto-habilita Pages).
- **Sesiones:** el estático usa sesión local (localStorage), no auth real. Para
  OAuth real (Google) habría que registrar el dominio de Pages + Client ID; no hay
  secretos de proyecto inyectados en el entorno del cloud agent.
