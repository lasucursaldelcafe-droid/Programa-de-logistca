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

1. Firebase Console → **Firestore** → **Reglas** → **Publicar** (o pega `firestore.rules` del repo)
2. Firestore → colección **`users`** → documento **`8kJ9xnbXwlNVQerimF088JXo8Ql1`** con `role: administrador`
3. GitHub Actions → **Bootstrap Firestore (SPE)** o **Desplegar reglas Firestore**

Proyecto Firebase: `programalog-ccc12`
