# Sistema de Personal para Eventos

Plataforma de gestión de personal para empresas de logística y recreación en eventos (200+ trabajadores). Web + Firebase con emuladores locales para desarrollo.

**Fase 1 (actual):** Auth con roles, módulo Personal, módulo Turnos.

## Requisitos

- Node.js 22+
- npm
- Java (Firebase Emulators)

## Inicio rápido (pruebas locales)

```bash
npm run setup          # deps + apps/web/.env.local
npm run emulators      # Terminal A — Auth :9099, Firestore :8080, UI :4000
npm run seed           # Terminal B — datos y cuentas de prueba
npm run dev:web        # Terminal C — http://localhost:5173
```

O en un solo comando (emuladores en background):

```bash
npm run setup:all && npm run dev
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
| `npm run setup` | Instala deps y crea `.env.local` para emuladores |
| `npm run emulators` | Inicia Firebase Emulators (Auth, Firestore) |
| `npm run seed` | Carga usuarios, trabajadores, eventos y turnos de prueba |
| `npm run dev:web` | Servidor Vite en puerto 5173 |
| `npm run build` | Build de producción (shared + web) |

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
