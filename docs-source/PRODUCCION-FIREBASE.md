# Producción — Firebase

La app opera con **Firebase Auth + Firestore** en producción. Los despliegues de GitHub Pages **no** usan modo demo.

**URL:** https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login

## Cuenta raíz (única al inicio)

| Email | Rol | Panel |
|-------|-----|-------|
| `lasucursaldelcafe@gmail.com` | **CEO — Dirección general** | `/master` |

Desde Master → **Equipo administrativo** se crean Administrador de operaciones, Recursos Humanos y Contabilidad. Ellos crean el resto en cascada.

```bash
# Asegurar rol CEO en Firestore (sin service account)
SPE_PROD_PASSWORD='…' npm run ensure:prod-ceo

# Verificar login + rol
SPE_PROD_PASSWORD='…' npm run verify:prod-login
```

## Admin SDK vs SDK web

| Uso | Qué es | Dónde va |
|-----|--------|----------|
| **Login en el navegador / app** | SDK web (`apiKey`, `authDomain`, `projectId`, …) | GitHub Secrets `VITE_FIREBASE_*` |
| **Scripts Admin (opcional)** | Cuenta de servicio JSON | `npm run seed:production` o workflow **Crear usuarios Firebase** |

El Admin SDK **solo** corre en Node/scripts/CI. No lo pegues en la app React ni en GitHub Pages.

```bash
SPE_PROD_PASSWORD='…' npm run seed:production -- --service-account ./service-account.json
# o
FIREBASE_SERVICE_ACCOUNT_JSON='{…}' SPE_PROD_PASSWORD='…' npm run seed:production
```

## GitHub Secrets

| Secret | Uso |
|--------|-----|
| `VITE_FIREBASE_*` (6) | Build Pages con backend Firebase |
| `VITE_FIREBASE_VAPID_KEY` | Push FCM (opcional) |
| `SPE_PROD_PASSWORD` | Contraseña de `lasucursaldelcafe@gmail.com` |
| `FIREBASE_TOKEN` | Deploy reglas/functions desde CI (`firebase login:ci`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alternativa a FIREBASE_TOKEN para Admin SDK |

## Deploy

Cada push a `main` publica GitHub Pages (`VITE_DEMO_MODE=false`).

```bash
# Local / CI con token
npm run firebase:deploy-firestore
npm run firebase:deploy-functions
npm run produccion:completa
```

## Emuladores (solo desarrollo)

```bash
npm run dev:full   # seed: ceo@eventos.test / master@eventos.test
```

Esas cuentas `@eventos.test` **no** son producción.
