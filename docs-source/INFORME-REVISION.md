# Informe de revisión técnica — SPE (Sistema de Personal para Eventos)

**Proyecto:** Programa de logística — gestión de personal en eventos  
**Repositorio:** [lasucursaldelcafe-droid/Programa-de-logistca](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca)  
**Versión del sistema:** 0.2.x  
**Fecha del informe:** 7 de julio de 2026  
**Destinatario:** Equipo de revisión / stakeholders  

---

## 1. Resumen ejecutivo

SPE es una plataforma web y móvil para empresas que operan personal en eventos de logística y recreación (capacidad pensada para 200+ trabajadores por evento). El sistema cubre el ciclo completo:

1. **Planificación** — eventos, sitios GPS, turnos y códigos QR.
2. **Operación en campo** — check-in/out con geolocalización, reportes de incidencias.
3. **Supervisión** — mapa en vivo, alertas, seguimiento de asistencia.
4. **Administración** — personal, cuentas, nómina, configuración.
5. **Plataforma** — consola Master para auditoría e informes globales.

La aplicación es **unificada**: una sola URL y un solo login. Tras autenticarse, el usuario ve el panel que corresponde a su rol (Master, Admin/Supervisor o Trabajador). Se despliega automáticamente en **GitHub Pages** (web), y además genera instaladores **Windows** (Electron) y **Android** (Capacitor) en cada actualización de la rama `main`.

---

## 2. Alcance y objetivo del sistema

| Área | Qué resuelve |
|------|----------------|
| Gestión de personal | Alta, roles, invitaciones, activación de cuentas |
| Turnos y sitios | Asignación horaria + ubicación física con geocerca |
| Control de asistencia | QR rotativo + validación GPS al marcar entrada/salida |
| Supervisión | Mapa en tiempo real, estados del personal, incidencias |
| Nómina | Cálculo y exportación según asistencia y tarifas |
| Plataforma | Master con informes CSV y auditoría de movimientos |
| Integraciones (fase actual) | Conectores demo hacia Siigo, WhatsApp, redes sociales |

**Fuera de alcance actual:** backend de integraciones en producción (`functions/` reservado para fase 2), prototipo legacy en `_legacy/envios-next/`.

---

## 3. Arquitectura técnica

### 3.1 Estructura del monorepo

```
Programa-de-logistca/
├── apps/
│   ├── admin/          → App principal unificada (Vite + React 19)
│   ├── worker/         → Código del panel trabajador + proyecto Android (Capacitor)
│   ├── master/         → Código del panel Master
│   └── desktop/        → Cliente Electron (Windows)
├── packages/
│   ├── shared/         → Tipos, permisos, geo, Firebase, nómina, invitaciones
│   └── integrations/   → Conectores Siigo, WhatsApp, Facebook, Instagram, Webhook
├── scripts/            → Setup, seed, build Pages, validación CI
├── docs/               → Artefacto publicado en GitHub Pages
├── docs-source/        → Documentación fuente (este informe, guías)
├── firestore.rules     → Reglas de seguridad Firestore
└── .github/workflows/  → CI, Pages, Releases
```

### 3.2 Patrón de aplicación unificada

Aunque existen tres carpetas de código (`admin`, `worker`, `master`), **el despliegue usa un solo bundle** generado desde `apps/admin`. Vite importa las páginas de worker y master mediante aliases (`@worker`, `@master`). Ventajas:

- Un solo despliegue web.
- Misma versión de código en web, Android y Windows.
- Menor complejidad de CI/CD.

### 3.3 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Autenticación y datos | Firebase Auth + Cloud Firestore |
| Móvil | Capacitor 7 (Android), plugins de geolocalización y biometría |
| Escritorio | Electron 35 (Windows NSIS + portable) |
| CI/CD | GitHub Actions |
| Hosting web | GitHub Pages |

---

## 4. Roles, cuentas y permisos

### 4.1 Roles del sistema

| Rol técnico | Nombre visible | Panel tras login | Función principal |
|-------------|----------------|------------------|-------------------|
| `super_admin` | Master | `/master` | Gobierno de plataforma, informes globales, auditoría |
| `administrador` | Administrador | `/panel` | Configuración, cuentas, nómina, integraciones |
| `supervisor_sitio` | Supervisor de sitio | `/panel` | Operación diaria: turnos, mapa, personal, reportes |
| `trabajador` | Trabajador | `/worker` | Turnos, entrada/salida, reportar incidencias |

### 4.2 Quién crea cada cuenta

| Tipo | Creador | Cómo obtiene credenciales |
|------|---------|---------------------------|
| Master | Seed de plataforma | Cuenta fija (demo: `master@eventos.test`) |
| Administrador | Seed de plataforma | Cuenta fija (demo: `admin@eventos.test`) |
| Supervisor / Trabajador | Administrador | Invitación por correo → la persona elige su contraseña |

**Regla clave:** el rol lo asigna **solo el administrador** al registrar en Personal. La persona invitada no puede elegir su propio rol.

### 4.3 Matriz de permisos (resumen)

| Acción | Master | Admin | Supervisor | Trabajador |
|--------|:------:|:-----:|:----------:|:----------:|
| Informes y auditoría global | ✓ | — | — | — |
| Crear administradores | ✓ | — | — | — |
| Gestionar cuentas / invitaciones | — | ✓ | — | — |
| Configuración y nómina (CRUD) | — | ✓ | — | — |
| Gestionar personal | — | ✓ | ✓ | — |
| Turnos, QR, mapa, reportes | — | ✓ | ✓ | — |
| Configurar integraciones APIs | ✓ | ✓ | — | — |
| Marcar entrada/salida | — | — | — | ✓ |
| Ver propia nómina | — | ✓ | ✓ | ✓ |

La navegación lateral (`SidebarNav`) y las rutas protegidas (`PlatformGate`) ocultan automáticamente las secciones no permitidas según el rol.

---

## 5. Módulos funcionales — cómo funciona cada uno

### 5.1 Autenticación y sesión

**Ubicación en código:** `apps/admin/src/contexts/AuthContext.tsx`, `apps/admin/src/pages/LoginPage.tsx`

**Flujo:**

1. El usuario ingresa correo y contraseña en `/login`.
2. En **producción**, Firebase Auth valida credenciales y carga el documento `users/{uid}` en Firestore (rol, nombre, estado habilitado).
3. En **desarrollo con emuladores**, el mismo flujo apunta a Auth/Firestore locales (`demo-personal-eventos`).
4. Tras login exitoso, la app redirige al home del rol (`/master`, `/panel` o `/worker`).
5. **Biometría (Android):** opcionalmente guarda credenciales en el almacén seguro del dispositivo (`@capgo/capacitor-native-biometric`) para reingreso rápido.
6. **Cierre de sesión** limpia el estado de Auth y redirige a `/login`.

**Activación de cuentas nuevas:**

| Paso | Ruta | Qué ocurre |
|------|------|------------|
| Admin envía invitación | `/cuentas` | Se crea documento `invitations` con código de 6 dígitos y rol fijado |
| Persona activa cuenta | `/unirse` o `/activar/:token` | Valida código, crea usuario Auth + documento `users` |
| Trabajador completa datos | `/completar-perfil` | Nombre, teléfono; marca `perfilCompleto: true` |

---

### 5.2 Panel operativo (Admin / Supervisor)

**Ruta base:** `/panel`  
**Interfaz:** barra lateral por secciones (`AppShell`, `SidebarNav`, `PageHeader`)

| Módulo | Ruta | Función |
|--------|------|---------|
| **Resumen** | `/panel` | KPIs del evento: personal en sitio, turnos pendientes, alertas |
| **Personal** | `/personal` | Alta, edición, inhabilitación y eliminación de personas |
| **Cuentas** | `/cuentas` | Invitaciones, reenvío de códigos, estado de activación |
| **Turnos** | `/turnos` | Asignar trabajador + sitio + franja horaria + estado |
| **QR y sitios** | `/qr-sitios` | Generar QR por sitio; token rotativo por intervalo |
| **Mapa en vivo** | `/mapa` | Posición GPS de trabajadores con asistencia activa |
| **Supervisión** | `/supervision` | Vista operativa consolidada del evento |
| **Reportes** | `/reportes` | Incidencias enviadas por trabajadores desde campo |
| **Nómina** | `/nomina` | Cálculo de pagos y exportación CSV |
| **Clientes** | `/clientes` | Módulo negocio (vinculado a Siigo demo) |
| **Facturación** | `/facturacion` | Módulo negocio (vinculado a Siigo demo) |
| **Inventario** | `/inventario` | Módulo negocio (vinculado a Siigo demo) |
| **Configuración** | `/configuracion` | Wizard de evento, parámetros operativos |
| **Integraciones** | `/integraciones` | Conexión y estado de APIs externas |
| **Notificaciones** | `/notificaciones` | Bandeja en tiempo real + push FCM (si está configurado) |
| **Ayuda** | `/ayuda` | Guía de uso integrada |

---

### 5.3 Consola Master

**Ruta base:** `/master`

| Módulo | Ruta | Función |
|--------|------|---------|
| **Resumen plataforma** | `/master` | Vista global de la operación |
| **Administradores** | `/master/administradores` | Gestión de cuentas administrativas |
| **Informes** | `/master/informes` | Exportación CSV de datos agregados |
| **Auditoría** | `/master/auditoria` | Historial de movimientos de nómina y cambios |
| **Ayuda** | `/master/ayuda` | Documentación para Master |

Solo usuarios con rol `super_admin` acceden a estas rutas.

---

### 5.4 App Trabajador

**Ruta base:** `/worker`  
**Interfaz móvil:** navegación inferior (`WorkerBottomNav`) en pantallas pequeñas

| Módulo | Ruta | Función |
|--------|------|---------|
| **Inicio** | `/worker` | Resumen de turnos y estado del día |
| **Mis turnos** | `/worker/turnos` | Ver, confirmar o rechazar turnos asignados |
| **Marcar entrada** | `/worker/entrada` | Escanear/pegar QR + GPS → check-in o check-out |
| **Reportar** | `/worker/reportar` | Enviar incidencia al supervisor (texto + categoría) |
| **Notificaciones** | `/worker/notificaciones` | Alertas de turno, geocerca, mensajes |
| **Ayuda** | `/worker/ayuda` | Instrucciones para el trabajador |

**Protección:** rutas internas exigen `perfilCompleto === true` (`WorkerProtected`). Si el trabajador no completó perfil, se redirige a `/completar-perfil`.

---

### 5.5 Control de asistencia (QR + GPS)

**Ubicación:** `packages/shared/src/geo.ts`, `apps/admin/src/lib/geolocation.ts`, página `MarcarEntradaPage`

**Cómo funciona el check-in:**

```
Trabajador abre /worker/entrada
        ↓
Escanea o pega código QR del sitio
        ↓
La app solicita permiso de ubicación (obligatorio)
        ↓
Se obtiene posición GPS (web: navigator.geolocation / Android: Capacitor)
        ↓
checkInWithQr() valida:
  • Turno asignado al trabajador
  • Ventana horaria del turno
  • Token QR vigente (rotación por intervalo)
  • Distancia a la geocerca del sitio (fórmula Haversine)
        ↓
Si todo es válido → registro en colección attendance
        ↓
Durante la jornada: monitor de geocerca cada ~10 s
  • Si sale del radio → estado fuera_geocerca + notificación
```

**Requisitos técnicos:**

- HTTPS obligatorio para GPS en navegador (GitHub Pages lo cumple).
- Permisos Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
- Cada sitio tiene coordenadas y radio de geocerca configurables en admin.

---

### 5.6 Mapa en vivo y supervisión

**Ruta:** `/mapa`, `/supervision`

- El admin/supervisor ve en el mapa la **última posición conocida** de trabajadores con asistencia activa.
- Los datos provienen del campo `ubicacionActual` actualizado por el monitor de geocerca.
- Permite detectar personal fuera de zona o sin señal GPS.

---

### 5.7 Nómina

**Ruta:** `/nomina`

- Calcula pagos según asistencia registrada, tarifas del evento y reglas configuradas.
- Exporta resultados en CSV.
- Master puede auditar movimientos en `/master/auditoria` (registro append-only en `payrollAudit`).

---

### 5.8 Integraciones externas

**Ruta:** `/integraciones`  
**Paquete:** `packages/integrations`

| Integración | Estado actual | Uso previsto |
|-------------|---------------|--------------|
| Siigo Nube | Demo (sin HTTP real) | Clientes, facturación, inventario |
| WhatsApp Cloud API | Demo | Alertas de turno a trabajadores |
| Facebook | Demo | Actividad / mensajes |
| Instagram | Demo | DMs / actividad |
| Webhook entrante | Demo | Eventos de sistemas externos |

En la fase actual, las credenciales se guardan en `localStorage` del navegador y el estado de conexión es simulado. **No es apto para producción** hasta migrar a backend cifrado (Cloud Functions).

Documentación detallada: `docs-source/INTEGRACIONES-APIS.md`.

---

## 6. Persistencia de datos

### 6.1 Modos de almacenamiento

| Modo | Cuándo | Dónde se guarda | Sincronización |
|------|--------|-----------------|----------------|
| Demo (`VITE_DEMO_MODE=true`) | Desarrollo / pruebas locales | `localStorage` del navegador | Solo mismo origen (misma URL) |
| Emuladores | `npm run dev:full` | Firestore local en tu PC | Solo mientras corren emuladores |
| Producción | `VITE_DEMO_MODE=false` + Firebase real | Cloud Firestore | Tiempo real entre todos los dispositivos |

### 6.2 Colecciones Firestore principales

| Colección | Contenido |
|-----------|-----------|
| `users` | Perfil de cuenta: rol, nombre, email, habilitado |
| `workers` | Ficha de personal: documento, estado, perfil completo |
| `events` | Eventos configurados |
| `sites` | Sitios con coordenadas y geocerca |
| `qrCodes` | Tokens QR por sitio |
| `shifts` | Turnos asignados |
| `attendance` | Registros de entrada/salida |
| `invitations` | Códigos de activación |
| `reports` | Incidencias de trabajadores |
| `notifications` | Bandeja de alertas |
| `payroll` / `payrollAudit` | Nómina y auditoría |
| `fcmTokens` | Tokens push por usuario |
| `consents` | Consentimiento de datos GPS |

### 6.3 Capa de abstracción

`useDataStore.ts` expone la misma API al resto de la app y bifurca internamente entre implementación demo (`demo/store.ts`) y Firestore (`onSnapshot` en tiempo real). Las pantallas no necesitan saber en qué modo está el sistema.

---

## 7. Seguridad

### 7.1 Reglas Firestore (`firestore.rules`)

- Lectura/escritura según rol verificado en el token Auth.
- Trabajador solo modifica sus propios datos limitados (`nombre`, `telefono`, `perfilCompleto`).
- Invitaciones: lectura pública (necesaria para activación sin sesión); escritura controlada.
- Auditoría de nómina: solo creación, sin edición ni borrado.
- Admin/supervisor gestionan personal, turnos y asistencia; Master tiene acceso global.

### 7.2 Controles en cliente

- `PlatformGate`: impide que un trabajador acceda a rutas de admin.
- Navegación filtrada por funciones `puede*` de `@spe/shared`.
- Cuentas inhabilitables desde Personal (campo `habilitado`).
- Reset de contraseña disponible para administrador.

### 7.3 Riesgos conocidos (deuda técnica)

| Riesgo | Estado | Mitigación planificada |
|--------|--------|------------------------|
| Credenciales de APIs en `localStorage` | Activo en demo | Backend proxy en `functions/` |
| Invitaciones con lectura pública | Por diseño actual | Validación estricta al activar |
| Secrets Firebase no configurados en CI | Parcialmente mitigado | Configurar GitHub Secrets (ver §8) |

---

## 8. Despliegue, CI/CD y entregables

### 8.1 Pipelines automáticos (push a `main`)

| Workflow | Qué publica | Archivo |
|----------|------------|---------|
| CI | Build + smoke tests con emuladores | `.github/workflows/ci.yml` |
| GitHub Pages | App web en `docs/` → rama `gh-pages` | `deploy-github-pages.yml` |
| Releases | Windows `.exe` + Android `.apk` | `release-apps.yml` |

### 8.2 URLs de acceso

| Recurso | URL |
|---------|-----|
| **App web (producción)** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| **Instaladores** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest |
| **CI / Actions** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions |
| **Repositorio** | https://github.com/lasucursaldelcafe-droid/Programa-de-logistca |

### 8.3 Instaladores nativos

| Archivo | Plataforma | Comportamiento |
|---------|------------|----------------|
| `SPE-Admin-*-nsis.exe` | Windows instalable | Carga la URL de GitHub Pages (requiere internet) |
| `SPE-Admin-*-portable.exe` | Windows portable | Igual que instalable |
| `SPE-Eventos-*-android.apk` | Android | WebView que carga la misma URL remota |

### 8.4 Configuración Firebase para producción

Para que el **login funcione en el sitio publicado**, deben configurarse estos GitHub Secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY` (opcional, para push)

Guía paso a paso: `docs-source/PRODUCCION-FIREBASE.md`.

> **Nota:** La UI se publica aunque falten estos secrets (modo `--pages`). El inicio de sesión en producción requiere configurarlos.

---

## 9. Flujo operativo de punta a punta

```
┌─────────────────────────────────────────────────────────────────┐
│  MASTER — configura plataforma, revisa informes y auditoría    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  ADMIN — wizard evento → sitios GPS → QR → registra personal    │
│          → envía invitaciones → asigna turnos                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  TRABAJADOR — activa cuenta → completa perfil → confirma turno  │
│               → escanea QR + GPS → reporta incidencias          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  SUPERVISOR/ADMIN — mapa en vivo → reportes → nómina → cierre   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Comandos de desarrollo y verificación

| Comando | Para qué sirve |
|---------|----------------|
| `npm run setup` | Primera instalación: dependencias + plantillas `.env.local` |
| `npm start` | Desarrollo local en http://localhost:5173 |
| `npm run dev:full` | Emuladores Firebase + seed + app (entorno completo local) |
| `npm run seed` | Crea cuentas Master y Admin en emuladores |
| `npm run build` | Compila app unificada |
| `npm run build:pages` | Build para GitHub Pages |
| `npm run check:nav` | Valida que todas las rutas de navegación existan |
| `npm run test:smoke` | Prueba automática con emuladores (CI) |
| `npm run electron:build` | Genera instalador Windows |
| `npm run cap:sync` + `cap:android` | Sincroniza y abre proyecto Android |

---

## 11. Cuentas de prueba (solo desarrollo local)

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Master | master@eventos.test | Master123! |
| Administrador | admin@eventos.test | Admin123! |

Estas cuentas funcionan con **emuladores Firebase** (`npm run dev:full`). En producción se crean usuarios reales en Firebase Auth.

---

## 12. Estado actual del proyecto (para revisión)

### Completado

- [x] App unificada con navegación lateral por secciones
- [x] Tres paneles por rol (Master, Admin/Supervisor, Trabajador)
- [x] GPS real en web y Android
- [x] Biometría en Android
- [x] Gestión de personal, cuentas, invitaciones y roles
- [x] QR rotativo + geocercas + monitor de asistencia
- [x] Mapa en vivo y reportes de incidencias
- [x] Nómina con exportación CSV
- [x] Despliegue automático GitHub Pages + Releases
- [x] Modo producción sin demo (`VITE_DEMO_MODE=false`)
- [x] Validación de rutas y flujos en CI

### Pendiente / próxima fase

- [ ] Configurar GitHub Secrets Firebase (bloquea login en sitio publicado)
- [ ] Backend seguro para integraciones (Siigo, WhatsApp) — `functions/`
- [ ] Push notifications FCM en producción (requiere VAPID key)
- [ ] Migración completa de credenciales demo a Firestore cifrado

---

## 13. Documentación complementaria

| Documento | Contenido |
|-----------|-----------|
| `docs-source/GUIA.md` | Guía de usuario completa |
| `docs-source/CUENTAS-Y-ROLES.md` | Cuentas, invitaciones y permisos |
| `docs-source/PRODUCCION-FIREBASE.md` | Configuración Firebase y Secrets |
| `docs-source/PERSISTENCIA-Y-DEPLOY.md` | Dónde se guardan los datos y cómo se publica |
| `docs-source/INTEGRACIONES-APIS.md` | APIs externas y conectores |
| `README.md` | Inicio rápido del repositorio |

---

## 14. Glosario

| Término | Significado |
|---------|-------------|
| **SPE** | Sistema de Personal para Eventos |
| **Geocerca** | Radio en metros alrededor de un sitio; valida que el trabajador esté físicamente en zona |
| **QR rotativo** | Código que cambia token periódicamente para evitar fotocopias |
| **Check-in / Check-out** | Marcar entrada o salida de un turno |
| **Seed** | Datos iniciales de plataforma (Master + Admin) |
| **Capacitor** | Framework que empaqueta la web como app Android nativa |
| **Electron** | Framework que empaqueta la web como app de escritorio Windows |
| **Firestore** | Base de datos en tiempo real de Firebase |

---

## 15. Contacto y mantenimiento

- **Repositorio:** https://github.com/lasucursaldelcafe-droid/Programa-de-logistca  
- **Correo del proyecto:** lasucursaldelcafe@gmail.com  
- **Rama principal:** `main` (despliegue automático en cada merge)  

---

*Documento generado para entrega a revisión. Refleja el estado del sistema al 7 de julio de 2026.*
