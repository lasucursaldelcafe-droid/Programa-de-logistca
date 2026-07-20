# Producción — Firebase

La app opera con **Firebase Auth + Firestore** en producción. No hay modo demo en despliegues.

**Configuración automática desde PC (sin celular):** ver [`CONFIGURACION-AUTOMATICA.md`](./CONFIGURACION-AUTOMATICA.md).

**Si Google no te deja descargar JSON:** ver [`GUIA-SIN-DESCARGAR-JSON.md`](./GUIA-SIN-DESCARGAR-JSON.md) → `npm run setup:sheets-auto`.

## Admin SDK vs SDK web (importante)

Son **dos credenciales distintas**:

| Uso | Qué es | Dónde va |
|-----|--------|----------|
| **Login en el navegador / app** | SDK web (`apiKey`, `authDomain`, `projectId`, …) | GitHub Secrets `VITE_FIREBASE_*` o `/configurar` |
| **Crear usuarios en el servidor** | Cuenta de servicio JSON (`serviceAccountKey.json`) | `npm run seed:production` o workflow **Crear usuarios Firebase (producción)** |

El código de Admin SDK (`firebase-admin` + `admin.credential.cert(serviceAccount)`) **solo corre en Node/scripts/CI**. **No** lo pegues en la app React ni en GitHub Pages.

Para crear la cuenta de producción `lasucursaldelcafe@gmail.com`:

```bash
# Con archivo (PC)
SPE_PROD_PASSWORD='…' npm run seed:production -- --service-account ./service-account.json

# Con variables (CI, sin guardar archivo en disco)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' SPE_PROD_PASSWORD='…' npm run seed:production
```

En GitHub: Settings → Secrets → `FIREBASE_SERVICE_ACCOUNT_JSON` + `SPE_PROD_PASSWORD` → Actions → **Crear usuarios Firebase (producción)** → Run workflow.

Comando rápido:

```bash
# 1. Pega firebase-web-config.json (SDK web de Firebase Console)
npm run setup:production
# 2. GitHub Secrets
npm run toolkit:secrets
# 3. Cuentas (service-account.json)
npm run seed:production -- --service-account ./service-account.json
```

## 1. Crear proyecto Firebase

1. [Firebase Console](https://console.firebase.google.com/) → nuevo proyecto (o usa uno existente).
2. Activa **Authentication** (correo/contraseña).
3. Crea base **Firestore** en modo producción.
4. Registra app **Web** y copia las credenciales del SDK.

## 2. Variables de entorno

Copia `apps/admin/.env.production.example` a `apps/admin/.env.local` y completa:

```
VITE_DEMO_MODE=false
VITE_USE_FIREBASE_EMULATORS=false
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Opcional push: `VITE_FIREBASE_VAPID_KEY` (Cloud Messaging).

## 3. GitHub Secrets (CI / GitHub Pages)

En el repositorio → **Settings → Secrets and variables → Actions**, crea:

| Secret | Valor |
|--------|--------|
| `VITE_FIREBASE_API_KEY` | SDK web |
| `VITE_FIREBASE_AUTH_DOMAIN` | SDK web |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | SDK web |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | SDK web |
| `VITE_FIREBASE_APP_ID` | SDK web |
| `VITE_FIREBASE_VAPID_KEY` | Opcional FCM |

Cada push a `main` ejecuta el build con `VITE_DEMO_MODE=false`.

## 4. Primera cuenta (Master + Admin)

Con emuladores locales (solo desarrollo):

```bash
npm run dev:full   # emuladores + seed de cuentas iniciales
```

En **producción**, crea usuarios manualmente en Firebase Auth y documentos en `users/{uid}`:

```json
{
  "email": "tu@empresa.com",
  "nombre": "Administrador",
  "role": "administrador",
  "perfilCompleto": true
}
```

Roles: `super_admin`, `administrador`, `supervisor_sitio`, `trabajador`.

## 5. Desarrollo local sin demo

```bash
npm run setup
# Editar apps/admin/.env.local con credenciales Firebase
npm start
```

## 6. Desarrollo con emuladores (opcional)

```bash
npm run dev:full
```

Usa `VITE_USE_FIREBASE_EMULATORS=true` y `VITE_DEMO_MODE=true` solo en `.env.local` si necesitas pruebas locales sin tocar producción.
