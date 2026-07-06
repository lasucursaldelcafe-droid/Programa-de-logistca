# SPE Negocio — Sistema de Personal + ERP (estilo Siigo)

Plataforma unificada: gestión empresarial (clientes, facturación, inventario), integraciones API (Siigo, WhatsApp, redes, web) y supervisión de personal en vivo para eventos.

**Incluye:** app web, cliente Windows (Electron), app Android (Capacitor).

## Requisitos

- Node.js 22+
- npm
- Java (Firebase Emulators)

## Inicio rápido (automático)

```bash
npm run setup    # primera vez: deps + .env.local
npm start        # todo en uno → http://localhost:5173
```

## Demos multiplataforma

Ver guía completa en [docs/DEMOS.md](docs/DEMOS.md) y **descargas** en [docs/DESCARGAS.md](docs/DESCARGAS.md).

### Descargar instaladores (automático)

**https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest**

| Plataforma | Archivo |
|------------|---------|
| Windows (instalador) | `SPENegocio-0.1.0-nsis.exe` |
| Windows (portable) | `SPENegocio-0.1.0-portable.exe` |
| Android | `SPE-Negocio-0.1.0-android.apk` |
| Web | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |

Cada push a `main` publica un release nuevo vía GitHub Actions.

| Plataforma | Comando local |
|------------|---------|
| Web | `npm start` → http://localhost:5173 |
| Windows | `npm run electron` / `npm run electron:build` |
| Android | `npm run cap:sync` → `npm run cap:android` |

El comando `npm start` hace automáticamente:
1. Setup si falta `.env.local` o `node_modules`
2. Firebase Emulators (Auth + Firestore)
3. Seed con cuentas y datos de prueba
4. Servidor Vite en puerto 5173

## Manual (opcional)

```bash
npm run emulators    # Terminal A
npm run seed         # Terminal B
npm run dev:web      # Terminal C
```

## Cuentas de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@eventos.test | Admin123! |
| Supervisor | supervisor@eventos.test | Super123! |
| Trabajador | maria@eventos.test | Trab123! |
| Trabajador | juan@eventos.test | Trab123! |

## Estructura del monorepo

```
apps/web/              → React + Vite + Tailwind (SPE Negocio)
apps/desktop/          → Electron Windows/Linux
packages/shared/       → Tipos, permisos, negocio, Firebase
packages/integrations/ → Hub Siigo, WhatsApp, redes, webhooks
functions/             → Cloud Functions (Fase 2+)
scripts/               → setup, seed, prepare-pages
.cursor/skills/        → Skills Cursor (spe-negocio-siigo, spe-integrations)
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` | **Automático:** emuladores + seed + app web |
| `npm run setup` | Instala deps y crea `.env.local` para emuladores |
| `npm run emulators` | Solo emuladores Firebase |
| `npm run seed` | Carga usuarios, trabajadores, eventos y turnos |
| `npm run dev:web` | Solo servidor Vite |
| `npm run build` | Build producción (shared + integrations + web) |
| `npm run build:native` | Build para Electron/Capacitor |
| `npm run electron` | App Windows (Electron) |
| `npm run electron:build` | Instalador Windows |
| `npm run cap:sync` | Sync Capacitor Android |
| `npm run cap:android` | Abrir Android Studio |
| `npm run test:smoke` | CI: emuladores + seed + verificación |

## Roles y permisos

- **super_admin / administrador:** gestión completa de personal y turnos
- **supervisor_sitio:** supervisión en sitio (Fase 2+)
- **trabajador:** ver y aceptar/rechazar sus turnos

## Diseño

Paleta del prompt maestro: fondo `#0A0A0A`, acento `#E8823C`, positivo `#3DDC97`, alerta `#D9455F`.

## Módulos

- **Negocio:** clientes, facturación, inventario (demo ERP tipo Siigo)
- **Integraciones:** Siigo, WhatsApp, Facebook, Instagram, webhooks
- **Personal:** trabajadores, turnos, supervisión en vivo (mapa GPS demo)

## Fases

1. ✅ Auth + Personal + Turnos + ERP demo + Integraciones + Supervisión
2. Cuentas de trabajadores + invitaciones
3. QR + GPS + geocercas (producción)
4. Notificaciones push (FCM)
5. Nómina
6. Dashboard avanzado
7. Wizard de configuración
8. ✅ Capacitor (Android) + Electron (Windows)

## Prototipo anterior

El CRUD de envíos (Next.js + Turso) quedó en `_legacy/envios-next/` y la versión estática en `docs/`. No forma parte del sistema de personal.
