# Sistema de Personal para Eventos

Plataforma de gestión de personal para empresas de logística y recreación en eventos (200+ trabajadores). **Una sola app** — el panel se abre según el rol tras iniciar sesión.

## App unificada

| Rol | Panel tras login |
|-----|------------------|
| `super_admin` | Master (`/master`) |
| `administrador`, `supervisor_sitio` | Operativo (`/panel`) |
| `trabajador` | Trabajador (`/worker`) |

## Inicio rápido

```bash
npm run setup    # primera vez: deps + plantilla .env.local
# Edita apps/admin/.env.local con credenciales Firebase (ver docs-source/PRODUCCION-FIREBASE.md)
npm start        # desarrollo local :5173
```

Para desarrollo con emuladores (opcional): `npm run dev:full`

## Producción

La app usa **Firebase Auth + Firestore**. Configura credenciales en GitHub Secrets para CI y en `apps/admin/.env.local` para desarrollo.

Guía: `docs-source/PRODUCCION-FIREBASE.md`

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

GitHub Pages publica la **app unificada** con Firebase en producción:

| Plataforma | URL |
|------------|-----|
| Admin Console | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| App Trabajador | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/worker/ |
| Master Console | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/master/ |

Guía completa: `docs-source/GUIA.md` o `/ayuda` dentro de cada app.

**Informe de revisión técnica:** `docs-source/INFORME-REVISION.md` — documento para entrega a revisión (arquitectura, módulos, flujos, despliegue).

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
