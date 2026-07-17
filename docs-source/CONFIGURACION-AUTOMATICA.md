# Configuración automática SPE — sin celular

Guía para dejar SPE operativo **desde PC** (Python + Node + Firebase + Apps Script opcional). No necesitas configurar nada en el celular hasta que la app ya esté desplegada.

## ¿Qué camino elige el sistema?

| Objetivo | Camino recomendado | Comando |
|----------|-------------------|---------|
| Probar todo en tu PC | Emuladores demo | `npm run setup:auto` |
| **GPS + QR entre varios celulares** | **Firebase producción** | `npm run setup:auto -- --production` |
| Piloto rápido sin Firebase | Google Sheets + Apps Script | `npm run setup:auto -- --sheets ...` |

**Para producción con GPS real entre dispositivos, usa Firebase.** Sheets es un puente limitado (ver `OPCION-GOOGLE-SHEETS.md`).

---

## Opción A — Un comando (recomendado)

### Windows

```bat
scripts\windows\Configurar-Todo.bat          rem desarrollo demo
scripts\windows\Configurar-Produccion.bat    rem producción Firebase
```

### Linux / macOS

```bash
chmod +x scripts/configurar-todo.sh
./scripts/configurar-todo.sh demo
./scripts/configurar-todo.sh produccion
```

### npm (cualquier sistema)

```bash
npm run setup:auto                              # demo local
npm run setup:auto -- --production              # Firebase
npm run setup:auto -- --production --push-github --seed
```

---

## Opción B — Producción Firebase paso a paso (solo PC)

### 1. Crear proyecto Firebase (navegador del PC)

1. [Firebase Console](https://console.firebase.google.com/) → **Crear proyecto**
2. **Authentication** → Método de acceso → **Correo/contraseña** → Activar
3. **Firestore Database** → Crear base de datos
4. **Configuración del proyecto** → **Tus apps** → **Web** (`</>`) → Registrar app
5. Copia el bloque `firebaseConfig` (JSON)

### 2. Pegar config en el repo

Guarda el JSON como `firebase-web-config.json` en la raíz (plantilla: `firebase-web-config.example.json`).

### 3. Ejecutar automatización

```bash
npm install
npm run setup:auto -- --production
```

Esto hace automáticamente:

- Escribe `.env.local` en **admin**, **worker** y **master**
- Genera `github-secrets-commands.txt` para GitHub Pages
- Actualiza `firebase-messaging-sw.js` (notificaciones push)
- Genera `CREDENCIALES-SPE.txt` y `CHECKLIST-PRODUCCION.txt`
- Despliega reglas Firestore si existe `service-account.json`

### 4. GitHub Secrets (Pages en la nube)

```bash
gh auth login
npm run toolkit:secrets
```

O copia manualmente desde `github-secrets-commands.txt` en  
**GitHub → Settings → Secrets and variables → Actions**.

### 5. Cuentas admin / master

1. Firebase Console → **Cuentas de servicio** → **Generar clave privada**
2. Guarda como `service-account.json` en la raíz (gitignored)
3. Ejecuta:

```bash
npm run seed:production -- --service-account ./service-account.json
```

Crea `admin@eventos.test` y `master@eventos.test` en Auth + Firestore.

### 6. Probar

```bash
npm start                    # Admin local :5173
npm run dev:worker           # Trabajador :5174
```

Cada push a `main` publica en GitHub Pages con Firebase real si los Secrets están completos.

---

## Opción C — Google Sheets + Apps Script (puente)

Si aún no tienes Firebase, puedes operar un piloto con hoja de cálculo:

1. Crea Google Sheet → **Extensiones → Apps Script**
2. Pega `apps-script/spe-backend/Code.gs`
3. Propiedad `SPE_API_TOKEN` = token aleatorio largo
4. Ejecuta `setupSheets` → **Implementar** como Web App
5. Configura la app:

```bash
npm run setup:auto -- --sheets \
  --web-app-url "https://script.google.com/macros/s/XXXX/exec" \
  --api-token "tu-token"
```

Detalle completo: `docs-source/OPCION-GOOGLE-SHEETS.md`.

---

## SPE Toolkit (Python + GUI Windows)

```bash
npm run toolkit              # GUI Windows
npm run toolkit:cli -- auto --demo
npm run toolkit:cli -- auto --json firebase-web-config.json --push-github --seed
```

Ver `docs-source/SPE-TOOLKIT.md`.

---

## GPS — qué necesitas realmente

| Componente | ¿Secret/API? | Notas |
|------------|--------------|-------|
| GPS del navegador / Capacitor | **No** | Permiso del usuario en el celular al usar la app |
| Sincronizar ubicación entre dispositivos | **Firebase Firestore** | Requiere los 6 `VITE_FIREBASE_*` en GitHub Secrets |
| Geocerca (radio del sitio) | **No** | Cálculo Haversine en la app |
| Google Maps API | **No obligatorio** | SPE no usa mapas externos para marcar entrada |
| Push alertas geocerca | Opcional `VITE_FIREBASE_VAPID_KEY` | Cloud Messaging |

---

## Archivos generados (no se suben a git)

| Archivo | Contenido |
|---------|-----------|
| `firebase-web-config.json` | Tu SDK web (lo pegas tú una vez) |
| `service-account.json` | Clave Admin SDK para seed |
| `github-secrets-commands.txt` | Comandos `gh secret set` |
| `CREDENCIALES-SPE.txt` | Usuarios y pasos |
| `CHECKLIST-PRODUCCION.txt` | Estado del setup automático |

---

## Solución de problemas

**GitHub Pages sigue en modo demo**  
→ Faltan Secrets. Ejecuta `npm run toolkit:secrets` o revisa el workflow en Actions.

**403 al subir secrets desde cloud agent**  
→ Debes ejecutar `gh auth login` en **tu PC** con permisos de admin del repo.

**GPS no sincroniza entre celulares**  
→ El deploy está en `VITE_DEMO_MODE=true`. Configura Firebase producción.

**Reglas Firestore**  
→ `npm run firebase:deploy-rules` (requiere `service-account.json` o `firebase login`).

Más detalle: `docs-source/PRODUCCION-FIREBASE.md`.
