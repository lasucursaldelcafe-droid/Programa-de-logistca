# Acceso rápido — Personal Eventos (producción)

## Sincronización entre plataformas

Web, Windows, Android y Linux usan **el mismo proyecto Firebase** (`programalog-ccc12`). Los datos (eventos, personal, turnos, asistencia) se actualizan en **tiempo real** en todas las plataformas.

| Plataforma | Cómo sincroniza |
|------------|-----------------|
| **Web** | Firebase Firestore directo |
| **Windows / Linux** | App embebida + Firebase (misma cuenta) |
| **Android** | App embebida + Firebase (misma cuenta) |
| **iOS** | PWA en Safari (misma web) |

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
