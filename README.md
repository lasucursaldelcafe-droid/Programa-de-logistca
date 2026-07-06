# Sistema de Personal para Eventos

Plataforma de gestión de personal para empresas de logística y recreación en eventos (200+ trabajadores). **Tres plataformas separadas** + Firebase.

## Las 3 plataformas

| Plataforma | Puerto local | Rol | Para qué |
|------------|--------------|-----|----------|
| **Master Console** | 5175 | `super_admin` | Informes globales, auditoría, administradores |
| **Admin Console** | 5173 | `administrador`, `supervisor_sitio` | Eventos, turnos, personal, QR, mapa, nómina |
| **App Trabajador** | 5174 | `trabajador` | Escanear QR, marcar entrada, reportar al supervisor |

Cada plataforma valida el rol al iniciar sesión (`PlatformGate`). Un trabajador **no puede** entrar al Admin; el admin **no puede** entrar al Master.

## Inicio rápido

```bash
npm run setup    # primera vez: deps + .env.local (×3 apps)
npm start        # emuladores + seed + Admin :5173
```

En otras terminales:

```bash
npm run dev:worker   # App Trabajador → http://localhost:5174
npm run dev:master   # Master Console → http://localhost:5175
```

## Cuentas de plataforma (seed)

Solo cuentas de administración — **sin eventos, personal ni turnos precargados**. Empieza desde **Configuración** en el Admin.

| Plataforma | Email | Contraseña |
|------------|-------|------------|
| Master | master@eventos.test | Master123! |
| Admin | admin@eventos.test | Admin123! |
| Supervisor | supervisor@eventos.test | Super123! |

Los trabajadores se registran mediante **invitación** (Admin → Cuentas → enviar correo con código de un solo uso).

## Ver en línea (GitHub Pages)

<!-- DEPLOY_LINKS_START -->
| Recurso | URL |
|---------|-----|
| **App unificada (web)** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| **Guía (markdown)** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/GUIA.md |
| **Repositorio** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca |
| **Actions (CI)** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions |

> Una sola app: Admin, Master y Trabajador en la misma URL. Enlaces generados por `npm run sync:links`.
<!-- DEPLOY_LINKS_END -->

GitHub Pages publica las **tres plataformas** en modo demo:

| Plataforma | URL |
|------------|-----|
| Admin Console | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| App Trabajador | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/worker/ |
| Master Console | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/master/ |

Guía completa: `docs-source/GUIA.md` o `/ayuda` dentro de cada app.

## Descargar instaladores (Windows + Android)

**https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest**

| Archivo | Plataforma |
|---------|------------|
| `SPE-Admin-*-nsis.exe` | Windows — consola Admin |
| `SPE-Admin-*-portable.exe` | Windows — portable |
| `SPE-Trabajador-*-android.apk` | Android — app Trabajador |

Guía: [docs/DESCARGAS.md](docs/DESCARGAS.md). Se publica automáticamente en cada push a `main`.

## Estructura del monorepo

```
apps/admin/            → Admin Console (antes apps/web)
apps/worker/           → App Trabajador (móvil + Capacitor Android)
apps/master/           → Master Console
apps/desktop/          → Electron (empaqueta Admin Console para Windows)
packages/shared/       → Tipos, permisos, plataformas, geo, nómina
scripts/               → setup, seed, dev-auto
```

## Flujo operativo

1. **Master** — supervisa toda la plataforma, exporta informes, ve auditoría.
2. **Admin** — wizard de evento, sitios GPS, QR, turnos, cuentas de trabajadores.
3. **Trabajador** — acepta turno, escanea QR, GPS, **Reportar** incidencias al supervisor.
4. **Admin** — ve reportes en `/reportes`, mapa en vivo, nómina.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` | Emuladores + seed + Admin |
| `npm run dev:admin` | Solo Admin Console |
| `npm run dev:worker` | Solo App Trabajador |
| `npm run dev:master` | Solo Master Console |
| `npm run build` | Build de las 3 plataformas |
| `npm run electron:build` | Instalador Windows (Admin) |
| `npm run cap:android` | Android (App Trabajador) |
| `npm run seed` | Datos y cuentas de prueba |

## Producción Firebase

Variables en `apps/admin/.env.local`, `apps/worker/.env.local`, `apps/master/.env.local`:

```
VITE_USE_FIREBASE_EMULATORS=false
```

Desplegar cada app en su URL/subdominio con HTTPS (GPS requiere HTTPS).

## Apps nativas

- **Android:** descarga el APK en [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest) o compila con `npm run cap:sync` + `npm run cap:android`
- **Windows:** descarga el `.exe` en [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest) o compila con `npm run electron:build`

## Prototipo anterior

CRUD de envíos en `_legacy/envios-next/` — no forma parte del sistema de personal.
