# Guía completa — SPE sin descargar JSON de Google

Si **Google/Firebase no te deja descargar** el archivo JSON (cuenta bloqueada, permisos, política de empresa), usa esta ruta. **No necesitas JSON** — solo iniciar sesión en el navegador con tu cuenta Google.

---

## Resumen: ¿qué camino usar?

| Situación | Comando | ¿JSON? |
|-----------|---------|--------|
| No puedes descargar nada de Google | `npm run setup:sheets-auto` | **No** |
| Puedes copiar texto del SDK web | `npm run setup:production` | Solo pegar config (no JSON de cuenta de servicio) |
| Solo probar en tu PC | `npm run setup:auto` | No |

**Recomendado para ti:** `npm run setup:sheets-auto`

---

## Opción A — Automático con Google Sheets (SIN JSON)

### Requisitos

- PC con Node.js 20+
- Cuenta Google (Gmail) — solo login en navegador
- **No** hace falta Firebase Console ni descargar claves

### Paso 1 — Un comando

```bash
cd Programa-de-logistca
npm install
npm run setup:sheets-auto
```

El script hace **todo solo**:

1. Abre el navegador para **clasp login** (como entrar a Gmail)
2. Crea una hoja Google Sheets + Apps Script en tu cuenta
3. Sube el código `apps-script/spe-backend/Code.gs`
4. Genera un token API seguro
5. Crea las tablas (users, workers, shifts, sites, attendance, qrCodes…)
6. Despliega la Web App
7. Escribe `.env.local` en admin, worker y master

### Paso 2 — Probar

```bash
npm start
```

Abre http://localhost:5173

| Usuario | Contraseña |
|---------|------------|
| admin@eventos.test | Admin123! |
| master@eventos.test | Master123! |

### Paso 3 — Publicar en GitHub Pages (opcional)

En GitHub → Settings → Secrets → Actions, crea:

| Secret | Valor |
|--------|--------|
| `VITE_DEMO_MODE` | `false` |
| `VITE_DATA_BACKEND` | `sheets` |
| `VITE_SHEETS_WEB_APP_URL` | URL que termina en `/exec` |
| `VITE_SHEETS_API_TOKEN` | Token de `CREDENCIALES-SHEETS-AUTO.txt` |
| `VITE_BLOQUEAR_INTEGRACIONES` | `true` |

Push a `main` → la app en Pages usará Sheets (varios celulares sincronizados vía hoja).

### Si falla el deploy automático

1. Abre https://script.google.com (misma cuenta del login)
2. Proyecto **SPE Backend**
3. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquiera**
4. Copia la URL `/exec` → pégala en `sheets-web-app-url.txt`
5. Vuelve a ejecutar: `npm run setup:sheets-auto`

---

## Opción B — Firebase sin JSON de cuenta de servicio

Si prefieres Firebase pero **no puedes descargar service-account.json**:

### Lo que SÍ puedes hacer sin JSON

1. Firebase Console → copiar **solo el bloque de texto** `firebaseConfig` (SDK web)
2. Guardar como `firebase-web-config.json`
3. `npm run setup:production`

### Crear cuentas admin **sin** service-account.json

**Manual (Firebase Console):**

1. Authentication → Agregar usuario → `admin@eventos.test` / `Admin123!`
2. Firestore → Colección `users` → documento `{uid}`:

```json
{
  "email": "admin@eventos.test",
  "nombre": "Administrador",
  "role": "administrador",
  "perfilCompleto": true
}
```

**Reglas Firestore:**

```bash
firebase login
npm run firebase:deploy-rules
```

(`firebase login` usa navegador — **no descarga JSON**)

---

## Bloqueo de integraciones (ahorro de tokens API)

Las pantallas de Siigo, WhatsApp y Meta vienen **bloqueadas por defecto** para que no se gasten tokens por error.

- Desbloquear: menú **Integraciones** → clave `spe-desbloquear`
- Cambiar clave: variable `VITE_INTEGRACIONES_CLAVE` en `.env.local`
- Desactivar bloqueo: `VITE_BLOQUEAR_INTEGRACIONES=false`

---

## GPS entre celulares

| Backend | ¿GPS sync entre dispositivos? |
|---------|------------------------------|
| Demo (navegador) | No — solo local |
| **Google Sheets** | **Sí** — ubicaciones en hoja `attendance` |
| Firebase | Sí — Firestore |

Con Sheets, el trabajador marca entrada con QR + GPS; admin ve la ubicación en la hoja (actualización ~8 s).

---

## Solución de problemas

### "Google no me deja descargar el JSON"

→ Usa **Opción A** (`setup:sheets-auto`). No usa JSON.

### "clasp login falla"

```bash
npx @google/clasp login --no-localhost
```

Copia el código que muestra la terminal al navegador.

### "Unauthorized" al iniciar sesión

Verifica que `VITE_SHEETS_API_TOKEN` en `.env.local` coincida con el token en `CREDENCIALES-SHEETS-AUTO.txt`.

### Pages sigue en demo

Faltan Secrets de Sheets en GitHub. Ver Paso 3 Opción A.

---

## Archivos generados (gitignored)

| Archivo | Contenido |
|---------|-----------|
| `CREDENCIALES-SHEETS-AUTO.txt` | URL Web App + token + cuentas |
| `apps-script/spe-backend/.clasp.json` | ID del proyecto Apps Script |
| `sheets-web-app-url.txt` | URL manual si hace falta |

---

## Línea de comandos — referencia rápida

```bash
npm run setup:sheets-auto     # Sheets + Apps Script automático (SIN JSON)
npm run setup:auto            # Demo local emuladores
npm run setup:production      # Firebase (solo pegar firebase-web-config.json)
npm start                     # Admin :5173
npm run dev:worker            # Trabajador :5174
npm run toolkit:cli -- auto --demo
```

Documentación relacionada:

- `docs-source/CONFIGURACION-AUTOMATICA.md`
- `docs-source/OPCION-GOOGLE-SHEETS.md`
- `docs-source/PRODUCCION-FIREBASE.md`
