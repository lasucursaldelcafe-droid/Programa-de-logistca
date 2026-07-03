# Sistema de Personal para Eventos

Plataforma de gestión de personal para empresas de logística y recreación en eventos (200+ trabajadores). Web + Firebase con emuladores locales para desarrollo.

**Fase 8 (actual):** Apps nativas — Capacitor (Android) y Electron (Windows) con GPS nativo y modo demo.

## Requisitos

- Node.js 22+
- npm
- Java (Firebase Emulators)
- **Android:** Android Studio + SDK (para compilar APK)
- **Windows:** Windows 10+ (para empaquetar con electron-builder)

## Inicio rápido (automático)

```bash
npm run setup    # primera vez: deps + .env.local
npm start        # todo en uno → http://localhost:5173
```

## Ver en línea (GitHub Pages)

<!-- DEPLOY_LINKS_START -->
| Recurso | URL |
|---------|-----|
| **App en línea** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| **Repositorio** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca |
| **Actions (CI)** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions |

> Enlaces generados automáticamente por `npm run sync:links` desde el repo `lasucursaldelcafe-droid/Programa-de-logistca`.
<!-- DEPLOY_LINKS_END -->

**URL pública:** https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/

Cada push a `main` despliega automáticamente la app en modo demo (datos en memoria del navegador). Usa las mismas cuentas de prueba.

Si la URL muestra la versión antigua, en GitHub ve a **Settings → Pages** y confirma que la fuente sea rama `gh-pages` y carpeta `/docs` (o `main` / `docs`). El workflow publica en `gh-pages/docs/`. Si el despliegue falla por reglas de entorno, desactiva la protección en **Settings → Environments → github-pages**.

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
apps/web/              → React + Vite + Tailwind (app principal)
apps/desktop/          → Cliente Windows (Electron)
apps/web/android/      → Proyecto Capacitor Android
packages/shared/       → Tipos, permisos, cliente Firebase
functions/             → Cloud Functions (Fase 2+)
scripts/               → setup-phase1.ts, seed-emulators.ts
_legacy/envios-next/   → Prototipo anterior (envíos/logística)
firebase.json          → Emuladores Auth + Firestore
firestore.rules        → Permisos por rol
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` | **Automático:** emuladores + seed + app web |
| `npm run setup` | Instala deps y crea `.env.local` para emuladores |
| `npm run emulators` | Solo emuladores Firebase |
| `npm run seed` | Carga usuarios, trabajadores, eventos y turnos |
| `npm run dev:web` | Solo servidor Vite |
| `npm run build` | Build de producción (shared + web) |
| `npm run build:native` | Build para apps nativas (`base: ./`, modo demo) |
| `npm run cap:sync` | Sincroniza `dist` → proyecto Android |
| `npm run cap:android` | Abre Android Studio |
| `npm run electron` | Lanza cliente Windows (Electron) |
| `npm run electron:build` | Empaqueta instalador `.exe` (Windows) |
| `npm run test:smoke` | CI: emuladores + seed + verificación |

## Apps nativas (Fase 8)

Las apps Android y Windows usan **modo demo** (datos en memoria) — ideal para supervisores en campo sin backend propio.

### Android (Capacitor)

```bash
npm run cap:add:android   # primera vez (ya incluido en el repo)
npm run cap:sync          # build nativo + copia a android/
npm run cap:android       # abre Android Studio → Run
```

GPS en Android usa `@capacitor/geolocation` con permisos en `AndroidManifest.xml`.

### Windows (Electron)

```bash
npm run electron          # ventana de escritorio con build nativo
npm run electron:build    # genera instalador en apps/desktop/release/
```

Electron usa `HashRouter` para rutas locales. El badge **Windows** aparece en la barra superior.

## Roles y permisos

- **super_admin / administrador:** gestión completa de personal y turnos
- **supervisor_sitio:** supervisión en sitio
- **trabajador:** ver y aceptar/rechazar sus turnos; activación por invitación

## Diseño

Paleta del prompt maestro: fondo `#0A0A0A`, acento `#E8823C`, positivo `#3DDC97`, alerta `#D9455F`.

## Fases pendientes

1. ✅ Auth + Personal + Turnos
2. ✅ Cuentas de trabajadores + invitaciones
3. ✅ QR + GPS + geocercas
4. ✅ Notificaciones push (FCM) + bandeja en app
5. ✅ Nómina (horas, tarifas, refrigerios, exportación CSV)
6. ✅ Dashboard avanzado (KPIs, gráficos, actividad, filtro por evento)
7. ✅ Wizard de configuración (evento → sitios → tarifas → QR → resumen)
8. ✅ Capacitor (Android) + Electron (Windows)

## Prototipo anterior

El CRUD de envíos (Next.js + Turso) quedó en `_legacy/envios-next/` y la versión estática en `docs/`. No forma parte del sistema de personal.
