# Acceso a Personal Eventos (producción)

**URL:** https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login

Debe mostrar **Backend: Firebase** (sin demo ni Google Sheets).

---

## Credenciales de administrador

| Campo | Valor |
|--------|--------|
| **Correo** | `lasucursaldelcafe@gmail.com` |
| **Contraseña** | La que **tú defines** al crear la cuenta en Firebase (ver abajo) |
| **Rol** | `administrador` |
| **Panel tras login** | `/panel` |

> La contraseña **no** está guardada en GitHub ni en este repo por seguridad.  
> Si nunca ejecutaste el seed, el login fallará hasta que crees la cuenta.

---

## Crear la contraseña (elige una opción)

### Opción A — Desde tu PC (5 min)

1. Firebase Console → **Authentication** → **Sign-in method** → activa **Correo/contraseña**.
2. Descarga **cuenta de servicio**: Configuración → Cuentas de servicio → Generar clave privada → `service-account.json` en la raíz del repo.
3. Elige una contraseña segura (ej. mínimo 8 caracteres, mayúsculas y números).
4. En PowerShell o terminal, en la carpeta del repo:

```bash
SPE_PROD_PASSWORD='TuContraseñaSegura123' npm run seed:production -- --service-account ./service-account.json
```

5. Inicia sesión en la web con `lasucursaldelcafe@gmail.com` y esa contraseña.

### Opción B — GitHub Actions (sin guardar JSON en PC)

1. GitHub → **Settings → Secrets → Actions**:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = contenido completo del JSON de cuenta de servicio
   - `SPE_PROD_PASSWORD` = la contraseña que quieras usar
2. **Actions** → **Crear usuarios Firebase (producción)** → **Run workflow**
3. Inicia sesión con el correo y la contraseña del secret `SPE_PROD_PASSWORD`.

### Opción C — Manual en Firebase Console

1. Firebase → **Authentication** → **Add user** → `lasucursaldelcafe@gmail.com` + contraseña.
2. Firestore → colección `users` → documento con ID = **UID** del usuario:

```json
{
  "email": "lasucursaldelcafe@gmail.com",
  "nombre": "La Sucursal del Café",
  "role": "administrador",
  "workerId": null,
  "perfilCompleto": true
}
```

---

## Firestore (chat y videollamadas)

Con Firebase MCP en Cursor o desde terminal (tras `firebase login`):

```bash
firebase use TU_PROJECT_ID
npm run firebase:deploy-firestore
```

Despliega reglas (`firestore.rules`) e índices (`chatMessages` por canal).

---

## Desarrollo local (solo emuladores, NO producción)

```bash
npm run dev:full
```

| Correo | Contraseña | Rol |
|--------|------------|-----|
| `admin@eventos.test` | `Admin123!` | administrador |
| `master@eventos.test` | `Master123!` | super_admin |

Estas cuentas **solo** funcionan con emuladores locales, no en la web de GitHub Pages.

---

## Si el login sigue mostrando Google Sheets o demo

1. **Ctrl + Shift + R** en la página de login.
2. Borrar datos del sitio para `github.io` en el navegador.
3. La app recargará sola con el script de limpieza de caché.

---

## Guardar tu contraseña localmente (opcional)

Copia `config/acceso.local.ejemplo.json` → `config/acceso.local.json` (no se sube a Git) y anota ahí la contraseña que elegiste.
