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

## Cuentas de prueba (seed)

| Plataforma | Email | Contraseña |
|------------|-------|------------|
| Master | master@eventos.test | Master123! |
| Admin | admin@eventos.test | Admin123! |
| Supervisor | supervisor@eventos.test | Super123! |
| Trabajador | maria@eventos.test | Trab123! |
| Trabajador | juan@eventos.test | Trab123! |

## Ver en línea (GitHub Pages)

<!-- DEPLOY_LINKS_START -->
| Recurso | URL |
|---------|-----|
| **Admin Console** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| **App Trabajador** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/worker/ |
| **Master Console** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/master/ |
| **Guía (markdown)** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/GUIA.md |
| **Repositorio** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca |
| **Actions (CI)** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions |

> Enlaces generados automáticamente por `npm run sync:links` desde el repo `lasucursaldelcafe-droid/Programa-de-logistca`.
<!-- DEPLOY_LINKS_END -->

GitHub Pages publica las **tres plataformas** en modo demo:

| Plataforma | URL |
|------------|-----|
| Admin Console | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| App Trabajador | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/worker/ |
| Master Console | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/master/ |

Guía completa: `docs-source/GUIA.md` o `/ayuda` dentro de cada app.

## Estructura del monorepo

```
apps/admin/            → Admin Console (antes apps/web)
apps/worker/           → App Trabajador (móvil + Capacitor Android)
apps/master/           → Master Console
apps/desktop/          → Electron (empaqueta App Trabajador)
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
| `npm run cap:android` | Android (App Trabajador) |
| `npm run seed` | Datos y cuentas de prueba |

## Producción Firebase

Variables en `apps/admin/.env.local`, `apps/worker/.env.local`, `apps/master/.env.local`:

```
VITE_USE_FIREBASE_EMULATORS=false
```

Desplegar cada app en su URL/subdominio con HTTPS (GPS requiere HTTPS).

## Apps nativas

- **Android:** `npm run cap:sync` + `npm run cap:android` (proyecto en `apps/worker/android/`)
- **Windows:** `npm run electron` (cliente con App Trabajador)

## Prototipo anterior

CRUD de envíos en `_legacy/envios-next/` — no forma parte del sistema de personal.
