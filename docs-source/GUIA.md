# Guía de uso — Sistema de Personal para Eventos

Plataforma para gestionar personal en eventos de logística y recreación (200+ trabajadores). **Una sola app**: al iniciar sesión se abre el panel según tu rol.

## Enlaces en línea (GitHub Pages, modo demo)

| Recurso | URL |
|---------|-----|
| **App unificada SPE** | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |

> En modo demo los datos viven en la memoria del navegador. En producción se usa Firebase (Auth + Firestore).

## Cuentas de plataforma

Plataforma vacía al iniciar — solo cuentas de administración. Supervisores y trabajadores se crean desde **Personal** (rol) + **Cuentas** (invitación).

| Rol | Email | Contraseña |
|-----|-------|------------|
| Master (plataforma) | master@eventos.test | Master123! |
| **Administrador único** | admin@eventos.test | Admin123! |

Cada persona invitada usa **su correo** y crea **su contraseña** al activar. El administrador asigna el rol (Trabajador o Supervisor).

Ver guía completa: [CUENTAS-Y-ROLES.md](./CUENTAS-Y-ROLES.md)

---

## 1. Master Console

**Para quién:** dueño de la plataforma o gerencia global.

**Funciones principales:**

- **Panel** — vista general de la operación.
- **Administradores** — listado y gestión de cuentas con rol administrador.
- **Informes** — exportación de datos (CSV) para análisis.
- **Auditoría** — revisión de nómina y movimientos sensibles.

**Flujo típico:** revisar informes semanales → auditar nómina → verificar administradores activos.

---

## 2. Admin Console

**Para quién:** administradores de evento y supervisores de sitio.

**Funciones principales:**

| Sección | Qué hace |
|---------|----------|
| **Dashboard** | Resumen del evento activo |
| **Personal** | Alta y asignación de trabajadores |
| **Cuentas** | Invitaciones y activación de cuentas |
| **QR Sitios** | Generar códigos QR por ubicación GPS |
| **Mapa** | Ubicación en vivo del personal |
| **Reportes** | Incidencias enviadas por trabajadores |
| **Turnos** | Crear turnos y asignar sitio + horario |
| **Nómina** | Cálculo y exportación de pagos |
| **Configuración** | Parámetros del evento |

### Cómo preparar un evento (resumen)

1. Crear o seleccionar el evento en **Configuración**.
2. Definir **sitios** con coordenadas GPS en **QR Sitios**.
3. Registrar **personal** y enviar invitaciones en **Cuentas**.
4. Crear **turnos** asignando trabajador + sitio + horario.
5. Imprimir o mostrar los **QR** en cada punto de entrada.
6. Durante el evento: monitorear **Mapa** y atender **Reportes**.

### Asignación de ubicación

La ubicación del trabajador se define **por turno**, no por persona fija. Cada turno indica en qué sitio debe marcar entrada ese día.

---

## 3. App Trabajador

**Para quién:** personal de campo (móvil).

**Barra inferior:**

| Pestaña | Función |
|---------|---------|
| **Inicio** | Resumen y próximo turno |
| **Turnos** | Ver turnos asignados y aceptar/rechazar |
| **Escanear** | Escanear QR del sitio + validar GPS |
| **Reportar** | Enviar incidencia al supervisor |

### Flujo del trabajador

1. **Activar cuenta** — abrir el enlace de invitación (`/activar/:token`).
2. **Completar perfil** — nombre, teléfono, etc.
3. **Aceptar turno** — en la pestaña Turnos.
4. **Llegar al sitio** — escanear el QR del punto asignado.
5. **Validación GPS** — el sistema comprueba que estás cerca del sitio.
6. **Reportar** — si hay un problema, enviar incidencia (el supervisor la ve en Admin → Reportes).

### App nativa (Android)

```bash
npm run cap:android   # requiere Android Studio
```

La app Android empaqueta la **App Trabajador**, no el Admin.

---

## Desarrollo local

```bash
npm run setup          # primera vez
npm start              # emuladores + Admin :5173
npm run dev:worker     # :5174
npm run dev:master     # :5175
npm run build:pages    # build para GitHub Pages (las 3 apps)
```

Emuladores Firebase (Auth + Firestore) en `localhost:9099` y `localhost:8080`.

---

## Preguntas frecuentes

**¿Por qué no puedo entrar con mi cuenta?**  
Cada plataforma valida el rol. Usa la URL y cuenta correctas según la tabla de arriba.

**¿El GPS es obligatorio?**  
Sí, para marcar entrada. Evita registros fraudulentos fuera del sitio.

**¿Puedo usar la misma URL para todos?**  
No. Admin, Worker y Master son apps separadas con URLs distintas en GitHub Pages.

**¿Cómo paso a producción?**  
Configura un proyecto Firebase real, variables `.env.local` en cada app, y despliega cada plataforma en su dominio o subruta.

---

## Soporte

- Repositorio: https://github.com/lasucursaldelcafe-droid/Programa-de-logistca
- Dentro de cada app: ruta **/ayuda** (versión interactiva de esta guía)
