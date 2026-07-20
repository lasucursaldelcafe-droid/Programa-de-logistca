# Lo que TÚ debes hacer (10–15 min) — Firebase

> Guía completa de acceso: [`ACCESO-PRODUCCION.md`](./ACCESO-PRODUCCION.md)

## Checklist rápido

- [ ] **1. Secrets Firebase** en GitHub (6× `VITE_FIREBASE_*`) — ver [`PRODUCCION-FIREBASE.md`](./PRODUCCION-FIREBASE.md)
- [ ] **2. Crear cuenta admin** con seed o Firebase Console
- [ ] **3. Desplegar Firestore** (`npm run firebase:deploy-firestore` tras `firebase login`)
- [ ] **4. Probar login** en producción (Backend: Firebase)
- [ ] **5. (Opcional)** Mapa Google Maps, FCM, Releases

---

## 1. GitHub Secrets (obligatorio)

https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions

| Secret | Valor |
|--------|--------|
| `VITE_DATA_BACKEND` | `firebase` |
| `VITE_DEMO_MODE` | `false` |
| `VITE_FIREBASE_API_KEY` | Firebase Console → SDK web |
| `VITE_FIREBASE_AUTH_DOMAIN` | SDK web |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | SDK web |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | SDK web |
| `VITE_FIREBASE_APP_ID` | SDK web |

Para **crear usuarios** (workflow Actions):

| Secret | Valor |
|--------|--------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON cuenta de servicio (Admin SDK) |
| `SPE_PROD_PASSWORD` | Contraseña que quieras para `lasucursaldelcafe@gmail.com` |
| `CURSOR_API_KEY` | (Opcional) Cursor CLI en Actions → workflow **Cursor Agent (SPE)** |

---

## Cursor Agent en GitHub Actions (opcional)

1. [Cursor Dashboard](https://cursor.com) → genera **API Key**
2. GitHub Secret: `CURSOR_API_KEY`
3. **Actions** → **Cursor Agent (SPE)** → Run workflow
4. Tareas: `diagnostico`, `pendientes-firebase` o `custom` con tu prompt

Ver `.github/workflows/cursor-agent.yml` y [docs Cursor CLI](https://cursor.com/docs/cli/github-actions).

---

## 2. Crear cuenta de login

**Correo:** `lasucursaldelcafe@gmail.com`  
**Contraseña:** la que tú elijas (ejecuta seed o workflow).

```bash
SPE_PROD_PASSWORD='TuContraseña' npm run seed:production -- --service-account ./service-account.json
```

O: Actions → **Crear usuarios Firebase (producción)** → Run workflow.

---

## 3. Firestore (chat / comunicación)

```bash
firebase login
firebase use TU_PROJECT_ID
npm run firebase:deploy-firestore
```

O usa **Firebase MCP** en Cursor (`.cursor/mcp.json` ya configurado).

---

## 4. Verificar

- Login: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login  
- Debe decir **Backend: Firebase**
- Entra con `lasucursaldelcafe@gmail.com` + tu contraseña
- Menú **Operación → Comunicación** (chat y video)

---

## MCP Firebase en Cursor

1. `firebase login` en tu PC  
2. Recarga MCP en Cursor (Settings → Tools & MCP)  
3. Pide al agente: *“Despliega firestore rules e indexes”*
