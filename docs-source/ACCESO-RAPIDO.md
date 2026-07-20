# Acceso rápido — Personal Eventos (producción)

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
