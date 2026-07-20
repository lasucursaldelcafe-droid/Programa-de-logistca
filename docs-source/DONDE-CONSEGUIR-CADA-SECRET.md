# Dónde conseguir cada Secret (rutas exactas)

Repo: **lasucursaldelcafe-droid/Programa-de-logistca**

---

## Antes de Secrets: ¿necesitas alguno?

| Modo | ¿Secrets obligatorios? | Qué hacer desde el celular |
|------|------------------------|----------------------------|
| **Demo** (probar login) | **No** | Nada. Login: `admin@eventos.test` / `Admin123!` |
| **Google Sheets** (recomendado) | **No** si usas `config/bootstrap.json` | Editar archivo en GitHub (enlace abajo) |
| **Firebase** | **Sí** (6 secrets) | Firebase Console → copiar SDK web |
| **Crear usuarios Firebase auto** | +1 secret (`FIREBASE_SERVICE_ACCOUNT_JSON`) | Solo si puedes descargar JSON en Firebase |

---

## Ruta única para PEGAR secrets en GitHub (celular o PC)

1. Abre:  
   **https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions**
2. Pulsa **「New repository secret」**
3. En **Name** → nombre exacto de la tabla (ej. `VITE_SHEETS_WEB_APP_URL`)
4. En **Secret** → pegas el valor
5. **Add secret**

*(Si no ves Settings, entra con la cuenta dueña del repo: lasucursaldelcafe-droid)*

---

## Opción A — Google Sheets (SIN ir a Secrets)

**Más fácil desde celular:** no uses Secrets; edita el archivo del repo:

**https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/edit/main/config/bootstrap.json**

```json
{
  "backend": "sheets",
  "demoMode": false,
  "sheetsWebAppUrl": "PEGAR_URL_AQUI",
  "sheetsApiToken": "PEGAR_TOKEN_AQUI"
}
```

Commit a `main` → en ~1 min se publica en Pages.

### De dónde salen `sheetsWebAppUrl` y `sheetsApiToken`

| Dato | Ruta exacta |
|------|-------------|
| **URL** (`sheetsWebAppUrl`) | **Gmail** (app) → cuenta `lasucursaldelcafe@gmail.com` → buscar correo **CREDENCIALES-SHEETS** → línea `Web App URL:` → copiar URL que termina en **`/exec`** |
| **URL** (alternativa) | **https://script.google.com** → proyecto **SPE Backend** → **Implementar** (Deploy) → **Implementaciones** → fila **Aplicación web** → copiar URL **`.../exec`** |
| **Token** (`sheetsApiToken`) | Mismo correo Gmail → línea **`API Token:`** → cadena hexadecimal (ej. `a1b2c3d4...`) |
| **Token** (alternativa) | En Apps Script: **Proyecto SPE Backend** → archivo `Code.gs` → buscar constante **`SPE_API_TOKEN`** al inicio del código |

Si **no tienes** ese correo, alguien con PC debe ejecutar una vez: `npm run setup:sheets-auto` (genera `CREDENCIALES-SHEETS-AUTO.txt` y puede enviártelo por Gmail).

### Si igual quieres Secrets de Sheets (nombres = valores)

| Secret (Name en GitHub) | Valor | Dónde conseguirlo |
|-------------------------|-------|-------------------|
| `VITE_DATA_BACKEND` | `sheets` | Lo escribes tú (texto fijo) |
| `VITE_DEMO_MODE` | `false` | Lo escribes tú (texto fijo) |
| `VITE_SHEETS_WEB_APP_URL` | URL `/exec` | Gmail → CREDENCIALES-SHEETS → `Web App URL:` (ver arriba) |
| `VITE_SHEETS_API_TOKEN` | token hex | Gmail → CREDENCIALES-SHEETS → `API Token:` (ver arriba) |
| `VITE_BLOQUEAR_INTEGRACIONES` | `true` | Lo escribes tú (texto fijo) |
| `VITE_INTEGRACIONES_CLAVE` | `spe-desbloquear` | Lo escribes tú (valor por defecto de la app) |

**Pegar secrets:** https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions

---

## Opción B — Firebase (6 secrets + opcional VAPID)

### Ruta en Firebase Console (para los 6 secrets)

1. **https://console.firebase.google.com/**
2. Elige tu **proyecto** (ej. `personal-eventos-xxxxx`)
3. Engranaje ⚙️ arriba izquierda → **Configuración del proyecto** (Project settings)
4. Pestaña **General**
5. Baja a **「Tus apps」** / **Your apps**
6. Si no hay app web: **「Agregar app」** → icono **`</>`** (Web) → registrar
7. Verás un bloque `firebaseConfig` — ahí están **todos** los valores:

```javascript
const firebaseConfig = {
  apiKey: "...",           // → VITE_FIREBASE_API_KEY
  authDomain: "...",       // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "...",        // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "...",    // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...",// → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "..."             // → VITE_FIREBASE_APP_ID
};
```

| Secret en GitHub | Campo en `firebaseConfig` | Ruta en Firebase |
|----------------|---------------------------|------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` | Console → ⚙️ → General → Tus apps → Web → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` | Igual → `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` | Igual → `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` | Igual → `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | Igual → `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` | Igual → `appId` |
| `VITE_DATA_BACKEND` | — | Escribe `firebase` (texto fijo) |
| `VITE_DEMO_MODE` | — | Escribe `false` (texto fijo) |

**Pegar secrets:** https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions

**Alternativa sin Secrets:** pegar los mismos campos en  
**https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/edit/main/config/bootstrap.json**  
dentro del objeto `"firebase": { "apiKey": "...", ... }`.

### VITE_FIREBASE_VAPID_KEY (opcional — notificaciones push)

| Secret | Ruta exacta |
|--------|-------------|
| `VITE_FIREBASE_VAPID_KEY` | Firebase Console → ⚙️ **Configuración del proyecto** → pestaña **Cloud Messaging** → sección **Certificados de Web Push** → **Generar par de claves** → copiar **clave pública** |

Si no usas notificaciones push, **puedes omitir** este secret.

### GMAIL_USER + GMAIL_APP_PASSWORD (correos automáticos de invitación y turnos)

| Secret | Ruta exacta |
|--------|-------------|
| `GMAIL_USER` | Correo del proyecto: `lasucursaldelcafe@gmail.com` |
| `GMAIL_APP_PASSWORD` | [Google Account](https://myaccount.google.com/apppasswords) → **Contraseñas de aplicaciones** → crear una para «SPE» → copiar la clave de 16 caracteres (sin espacios) |
| `SPE_APP_URL` (opcional) | URL pública de la app: `https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/` |

Configúralos como **secrets de Cloud Functions** en Firebase (no solo GitHub Actions):

```bash
firebase functions:secrets:set GMAIL_USER
firebase functions:secrets:set GMAIL_APP_PASSWORD
firebase functions:secrets:set SPE_APP_URL
```

Sin estos secrets, las invitaciones se crean pero el correo no sale (verás `emailError` en Cuentas → Invitaciones).

### VITE_GOOGLE_MAPS_API_KEY (opcional — mapa en vivo con Google Maps)

| Secret | Ruta exacta |
|--------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials) → **Credenciales** → **Crear credenciales** → **Clave de API** → habilitar **Maps JavaScript API** → restringir por dominio HTTP (`*.github.io`, tu dominio de producción) |

Sin esta clave, `/mapa` y **Supervisión** usan el mapa esquemático SVG (demo). La geolocalización GPS del trabajador **no depende** de Google Maps.

**Local:** añade en `apps/admin/.env.local`:

```bash
VITE_GOOGLE_MAPS_API_KEY=tu-clave-aqui
```

### FIREBASE_SERVICE_ACCOUNT_JSON (solo workflow «Crear usuarios Firebase»)

| Secret | Ruta exacta |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Console → ⚙️ → pestaña **Cuentas de servicio** (Service accounts) → **Generar nueva clave privada** → se descarga un `.json` → **abre el archivo** → copia **todo el contenido JSON** y pégalo como valor del secret |

⚠️ Si Google **no te deja descargar** ese JSON, **no uses Firebase** para producción; usa **Sheets** (Opción A) o crea usuarios a mano:

- Firebase Console → **Authentication** → **Users** → **Add user**
- Firebase Console → **Firestore** → colección `users` → documento con el UID del usuario

---

## Opción C — Demo (sin backend real)

No hace falta ningún Secret.

Archivo: **https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/edit/main/config/bootstrap.json**

```json
{
  "backend": "demo",
  "demoMode": true,
  "sheetsWebAppUrl": "",
  "sheetsApiToken": ""
}
```

Login: **https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login**  
`admin@eventos.test` / `Admin123!`

---

## Disparar deploy SIN guardar Secrets (desde celular)

Si tienes URL y token pero no quieres/peudes entrar a Settings → Secrets:

1. **https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions/workflows/deploy-github-pages.yml**
2. **Run workflow** → rama `main`
3. `backend` = **sheets**
4. `sheets_web_app_url` = URL `/exec` del correo
5. `sheets_api_token` = token del correo
6. **Run workflow**

---

## Resumen rápido (lo mínimo)

| Quiero… | Solo necesito… |
|---------|----------------|
| Probar la app | Nada — login demo |
| Producción con Sheets | Editar `config/bootstrap.json` con URL + token del **Gmail** |
| Producción Firebase | 6 valores del **Firebase Console → ⚙️ → General → app Web** |
| Que el bot cree usuarios Firebase | + JSON de **Cuentas de servicio** |

Correo del proyecto: **lasucursaldelcafe@gmail.com**
