# Reporte de faltantes — SPE (Sistema de Personal para Eventos)

**Fecha:** 7 de julio de 2026  
**Versión del sistema:** 0.2.x  
**Estado general:** App funcional en desarrollo local; **producción bloqueada** por configuración Firebase pendiente.

---

## Resumen ejecutivo

| Categoría | Estado | Impacto |
|-----------|--------|---------|
| **Código / UI** | ✅ ~90% completo | App usable en local con emuladores |
| **Producción web** | ⚠️ Parcial | UI publicada; **login no funciona** |
| **Instaladores (Win/Android)** | ❌ Bloqueado | CI falla sin Firebase Secrets |
| **Integraciones reales** | ❌ No iniciado | Solo modo demo/simulación |
| **Backend seguro** | ❌ No existe | `functions/` vacío |

**Bloqueador principal:** no están configurados los **GitHub Secrets** de Firebase (`VITE_FIREBASE_*`).

---

## 1. Bloqueadores críticos (impiden uso en producción)

### 1.1 Firebase no configurado en GitHub

| Secret faltante | Para qué sirve |
|-----------------|----------------|
| `VITE_FIREBASE_API_KEY` | Autenticación y SDK web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio Auth |
| `VITE_FIREBASE_PROJECT_ID` | Proyecto Firestore |
| `VITE_FIREBASE_STORAGE_BUCKET` | Almacenamiento |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Mensajería |
| `VITE_FIREBASE_APP_ID` | Identificador de app |
| `VITE_FIREBASE_VAPID_KEY` | Push notifications (opcional) |

**Efecto hoy:**
- El sitio https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ muestra la UI pero **no permite iniciar sesión**.
- El workflow **“Publicar instaladores (Windows + Android)”** falla en cada push a `main`.
- Los datos de producción **no se sincronizan** entre dispositivos.

**Acción requerida:** crear proyecto Firebase + pegar Secrets en GitHub → Settings → Secrets and variables → Actions.  
**Guía:** `docs-source/PRODUCCION-FIREBASE.md`

---

### 1.2 Usuarios de producción no creados

Las cuentas `admin@eventos.test` / `master@eventos.test` **solo funcionan en desarrollo local** (`npm run dev:full` con emuladores).

**Falta:**
- Crear al menos 1 usuario **Administrador** real en Firebase Auth.
- Crear documento `users/{uid}` en Firestore con `role: "administrador"`.
- Cambiar contraseña del seed si se usa en producción.

---

### 1.3 Instaladores Windows y Android desactualizados

El workflow `release-apps.yml` falla por validación Firebase estricta.

**Efecto:** los `.exe` y `.apk` en [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest) pueden estar **desactualizados** respecto al código actual.

---

## 2. Funcionalidades incompletas (fase actual)

### 2.1 Integraciones externas — solo demo

| Integración | Estado | Qué falta |
|-------------|--------|-----------|
| Siigo Nube | Demo | Llamadas HTTP reales, sync a Clientes/Facturación/Inventario |
| WhatsApp Cloud API | Demo | Envío real de alertas de turno |
| Facebook | Demo | Graph API con permisos |
| Instagram | Demo | Graph API con permisos |
| Webhook entrante | Demo | Endpoint servidor + validación firma |
| Formulario web (`web_form`) | No implementado | Conector y UI |

**Riesgo:** credenciales guardadas en `localStorage` del navegador — **no apto para producción**.

---

### 2.2 Backend Cloud Functions (`functions/`)

| Componente | Estado |
|------------|--------|
| Carpeta `functions/` | Solo `package.json` placeholder |
| Proxy seguro para APIs | No existe |
| Cifrado de credenciales integraciones | No existe |
| Webhooks servidor | No existe |
| Tareas programadas (cron) | No existe |

**Fase 2** según documentación del proyecto.

---

### 2.3 Notificaciones push (FCM)

| Item | Estado |
|------|--------|
| Service worker (`firebase-messaging-sw.js`) | ✅ Existe |
| Registro de token en Firestore | ✅ Código listo |
| `VITE_FIREBASE_VAPID_KEY` en producción | ❌ No configurado |
| Pruebas en dispositivos reales | ❌ Pendiente |

---

### 2.4 Módulos de negocio (Siigo)

Las pantallas **Clientes**, **Facturación** e **Inventario** existen en la UI pero:
- No reciben datos reales de Siigo.
- La sincronización demo no escribe en esas tablas.
- Requiere backend + credenciales Siigo de producción.

---

## 3. Configuración y operación pendiente

| Item | Estado | Notas |
|------|--------|-------|
| Dominio propio (HTTPS) | ❌ | Usa GitHub Pages subpath |
| Firebase Hosting alternativo | ❌ | Opcional |
| Reglas Firestore desplegadas a proyecto real | ❓ | Existen en repo; falta deploy al proyecto prod |
| Seed de producción (Master + Admin) | ❌ | Manual en Firebase Console |
| Política de contraseñas / 2FA | ❌ | Solo Firebase Auth básico |
| Backup / export Firestore | ❌ | No automatizado |
| Monitoreo / alertas de errores (Sentry, etc.) | ❌ | No configurado |

---

## 4. Documentación y entregables — completado

| Entregable | Estado |
|------------|--------|
| Informe técnico (`INFORME-REVISION.md`) | ✅ |
| Informe HTML (`INFORME-REVISION-SPE.html`) | ✅ |
| Informe PDF presentación (`INFORME-REVISION-SPE.pdf`) | ✅ |
| Guías (`GUIA.md`, `CUENTAS-Y-ROLES.md`, etc.) | ✅ |
| App web publicada (UI) | ✅ |
| CI build + smoke tests | ✅ |

---

## 5. Matriz de prioridades

| Prioridad | Faltante | Responsable sugerido | Esfuerzo estimado |
|-----------|----------|----------------------|-------------------|
| 🔴 P0 | Configurar GitHub Secrets Firebase | Admin del repo | 30–60 min |
| 🔴 P0 | Crear usuario Admin en Firebase producción | Admin del repo | 15 min |
| 🔴 P0 | Re-ejecutar deploy Pages + Releases | Automático tras P0 | 5 min |
| 🟠 P1 | Desplegar reglas Firestore al proyecto real | Desarrollo | 30 min |
| 🟠 P1 | Probar flujo completo: login → personal → turno → QR/GPS | QA / operación | 2–4 h |
| 🟡 P2 | Backend `functions/` para integraciones | Desarrollo | 1–2 semanas |
| 🟡 P2 | Siigo / WhatsApp en producción | Desarrollo + negocio | 1–2 semanas |
| 🟢 P3 | FCM push en producción | Desarrollo | 2–4 h |
| 🟢 P3 | Dominio propio + SSL | Infra | Variable |

---

## 6. Qué SÍ funciona hoy (sin faltantes)

- App unificada con navegación lateral (Admin / Master / Worker).
- Desarrollo local completo: `npm run dev:full` + cuentas seed.
- GPS real (web HTTPS + Android).
- Biometría en Android.
- QR rotativo + geocercas + monitor de asistencia.
- Mapa en vivo, reportes, nómina CSV.
- Gestión de personal, invitaciones, roles.
- GitHub Pages publica la UI automáticamente.
- Validación CI (build + smoke con emuladores).

---

## 7. Checklist para cerrar faltantes P0

```
[ ] Crear proyecto en Firebase Console
[ ] Activar Authentication (email/contraseña)
[ ] Crear base Firestore
[ ] Copiar credenciales SDK web
[ ] Pegar 6 Secrets en GitHub (VITE_FIREBASE_*)
[ ] Crear usuario administrador en Firebase Auth
[ ] Crear documento users/{uid} con role administrador
[ ] Push vacío o re-run workflow "Publicar instaladores"
[ ] Probar login en https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/
[ ] Registrar 1 trabajador de prueba y flujo invitación
```

---

## 8. Contacto

- **Repositorio:** https://github.com/lasucursaldelcafe-droid/Programa-de-logistca  
- **Correo:** lasucursaldelcafe@gmail.com  

---

*Reporte generado automáticamente a partir del estado del repositorio y CI al 7 de julio de 2026.*
