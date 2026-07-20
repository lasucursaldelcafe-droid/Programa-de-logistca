# Camino Firebase automático (orden correcto)

Todo el producto va por **Firebase** (Auth + Firestore + Functions).  
GitHub Pages solo **sirve la web**; no sustituye a Firebase.

## Lo que NO está “rechazando” GitHub

| Workflow | Qué hace | Estado típico hoy |
|----------|----------|-------------------|
| **Publicar app (GitHub Pages)** | Sube la UI a github.io | OK (verde) |
| **CI** | Build + smoke | OK |
| **Desplegar reglas / Producción completa** | Habla con Firebase | Rojo **sin** `FIREBASE_TOKEN` |
| **Auto-merge** | Mergea PRs `cursor/*` | Ya no se atasca en borrador |

Detalle importante: si el merge lo hace Actions con el token por defecto, **GitHub no encadena** Pages/Firebase (parece un “rechazo”). Por eso hace falta el secret `GH_PAT` (abajo).

Si ves rojo en Firebase y verde en Pages: **es correcto**. Falta el puente GitHub → Firebase.

## Orden (una sola vez, ~5 min)

### 1) Token Firebase en tu PC

```powershell
cd C:\Users\LENOVO\Projects\Programa-de-logistca
npx firebase login:ci
```

Inicia sesión con `lasucursaldelcafe@gmail.com`. Copia el token (`1//0…`).

### 2) Secrets en GitHub

https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions

| Secret | Valor | Para qué |
|--------|--------|----------|
| `FIREBASE_TOKEN` | Token del paso 1 | Publicar reglas/functions en Firebase |
| `SPE_PROD_PASSWORD` | Contraseña del CEO | Bootstrap + QR + cuentas |
| `GH_PAT` | PAT classic (`repo` + `workflow`) | Que el auto-merge **sí dispare** Pages/Firebase |
| `VITE_FIREBASE_*` | SDK web | Ya deberían estar |

Atajo si tienes `gh` en el PC:

```powershell
# Pega el token en config/credenciales.local.json → "firebaseToken"
npm run setup:firebase-token
```

### 3) Un solo botón: todo Firebase solo

Actions → **Configurar Firebase (SPE)** → **Run workflow**

Ese workflow, en orden:

1. Publica `firestore.rules`
2. Bootstrap CEO
3. Verifica login **y escritura**
4. Crea **QR** + cuentas Admin / RH / Contador
5. Intenta desplegar **Cloud Functions** (correo HTML)

### 4) Correo de invitaciones (opcional, después)

En Firebase Console → Functions → Secrets:

- `GMAIL_USER` = `lasucursaldelcafe@gmail.com`
- `GMAIL_APP_PASSWORD` = contraseña de aplicación de Google

Sin esto, igual puedes crear cuentas; el correo HTML de invitación no sale, pero sí el reset de Auth.

## Después de eso

- Login: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login  
- CEO: `lasucursaldelcafe@gmail.com`  
- QR: menú **QR y sitios**  
- Cuentas: salen en el log del workflow / `npm run desbloquear:operacion`

## Si no puedes usar `login:ci` ahora

Plan B (mismo Firebase, 2 min):

1. https://console.firebase.google.com/project/programalog-ccc12/firestore/rules  
2. Pega `firestore.rules` del repo → **Publicar**  
3. Actions → **Configurar Firebase (SPE)** (cuando tengas el token) o pide al agente que ejecute `npm run desbloquear:operacion`
