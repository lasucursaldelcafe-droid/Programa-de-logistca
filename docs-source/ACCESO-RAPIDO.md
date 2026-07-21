# Acceso rápido — Personal Eventos (producción)

## Sincronización automática entre versiones

Web, Windows, Android y Linux usan **el mismo proyecto Firebase** (`programalog-ccc12`).

| Qué | Cómo se mantiene al día |
|-----|-------------------------|
| **Datos** (eventos, personal, turnos, asistencia) | Firestore en **tiempo real** en todas las plataformas |
| **UI / código** | GitHub Pages es la fuente. Web se actualiza en cada push a `main`. **APK y Electron** cargan esa misma web cuando hay red (`preferLiveUi`), así no hace falta reinstalar para ver cambios. Sin red usan el bundle embebido. |
| **Config** (Firebase, Maps, FCM) | `spe-runtime-config.json` en Pages (`cache: no-store`) |

| Plataforma | Sync |
|------------|------|
| **Web** | Pages + Firestore |
| **Windows / Linux** | Electron → Pages (fallback offline) + Firestore |
| **Android** | Capacitor → Pages (fallback con `SPE_LIVE_UI=0`) + Firestore |
| **iOS** | PWA Safari (misma web) |

Usa **las mismas credenciales** en todas. No hace falta configurar nada extra en cada dispositivo.

## Login

**URL:** https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login

| Campo | Valor |
|--------|--------|
| Correo | `lasucursaldelcafe@gmail.com` |
| Contraseña genérica | `SpeAdmin2026!` (si no entra, prueba `MiClaveSPE2026!`) |

> Cambia la contraseña en Firebase Console → Authentication, o tras entrar en **Cuentas → Mi contraseña**.

## Cambiar contraseña (con sesión)

https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/cuentas

## Si sale "Missing or insufficient permissions"

Firestore necesita **reglas desplegadas**. Sin `FIREBASE_TOKEN` en GitHub, la web entra con sesión admin **provisional** (sin sync de datos).

### Opción A — PC Windows (recomendado, un comando)

```powershell
.\scripts\windows\SPE-Produccion-Completa.ps1
```

### Opción B — Manual en GitHub

1. En PC: `firebase login:ci` → copia el token
2. GitHub → **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**: `FIREBASE_TOKEN` = token del paso 1
4. Actions → **Configurar Firebase (SPE)** → Run workflow

### Opción C — Consola Firebase

Firebase Console → Firestore → Reglas → pegar `firestore.rules` → Publicar

Proyecto: `programalog-ccc12` | UID admin: `8kJ9xnbXwlNVQerimF088JXo8Ql1`
