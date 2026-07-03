# Sistema de Personal para Eventos

Plataforma de gestión de personal para empresas de logística y recreación en eventos (200+ trabajadores). Web + Firebase con emuladores locales para desarrollo.

**Fase 1 (actual):** Auth con roles, módulo Personal, módulo Turnos.

## Requisitos

- Node.js 22+
- npm
- Java (Firebase Emulators)

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

Si la URL muestra la versión antigua, en GitHub ve a **Settings → Pages** y confirma que la fuente sea `gh-pages` o `main` / `docs`. Si el despliegue falla por reglas de entorno, desactiva la protección en **Settings → Environments → github-pages**.

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
| `npm run test:smoke` | CI: emuladores + seed + verificación |

## Roles y permisos

- **super_admin / administrador:** gestión completa de personal y turnos
- **supervisor_sitio:** supervisión en sitio (Fase 2+)
- **trabajador:** ver y aceptar/rechazar sus turnos

## Diseño

Paleta del prompt maestro: fondo `#0A0A0A`, acento `#E8823C`, positivo `#3DDC97`, alerta `#D9455F`.

## Fases pendientes

1. ✅ Auth + Personal + Turnos
2. Cuentas de trabajadores + invitaciones
3. QR + GPS + geocercas
4. Notificaciones push (FCM)
5. Nómina
6. Dashboard avanzado
7. Wizard de configuración
8. Capacitor (Android) + Electron (Windows)

## Prototipo anterior

El CRUD de envíos (Next.js + Turso) quedó en `_legacy/envios-next/` y la versión estática en `docs/`. No forma parte del sistema de personal.
