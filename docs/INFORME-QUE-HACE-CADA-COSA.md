# Informe: qué hace cada cosa — SPE Eventos

Documento de referencia del Sistema de Personal para Eventos (SPE): consolas, módulos, roles y límites del CEO.

---

## 1. Tres consolas

| Consola | Quién entra | Para qué |
|---------|-------------|----------|
| **Master** (`/master`) | CEO, Master App | Dirección: equipo admin, roles, trabajadores en vivo, chat, informes globales, auditoría. El CEO también tiene atajos a **Operación empresa**. |
| **Admin** (`/panel`, etc.) | CEO, Master App, Administrador, RH, Contabilidad, Supervisor | Operar la empresa/evento: personal, turnos, QR, mapa, reportes, nómina, negocio. |
| **Worker / Empleado** (`/worker`) | Solo rol **Empleado** (`trabajador`) | App de campo: mis turnos, marcar entrada (QR/GPS), reportar, chat. |

El **CEO no es empleado**: no entra a `/worker`. Sí puede **crear, quitar, editar e invitar** personal y **ver/atender reportes**.

---

## 2. Roles (quién es quién)

| Rol | Consola | Qué hace | Qué no hace |
|-----|---------|----------|-------------|
| **CEO** | Master + Admin | Toda la empresa: eventos, personal (CRUD), invitaciones, turnos, reportes, nómina, negocio, chat, informes, roles, auditoría | App de campo (marcar entrada / mis turnos como empleado) |
| **Master App** | Master + Admin | Igual que dirección técnica + permisos amplios de plataforma | App de campo |
| **Administrador** | Admin | Opera el evento de punta a punta; crea RH/Contabilidad | Consola Master (roles globales / auditoría) |
| **Recursos Humanos** | Admin | Personal, invitaciones, turnos, comunicación, reportes | Crear eventos, nómina, facturación, APIs |
| **Contabilidad** | Admin | Nómina, clientes, facturación, inventario, informes | Personal, eventos, QR, supervisión |
| **Supervisor** | Admin | Mapa, turnos, QR, reportes; puede dar de alta empleados | Configurar eventos, nómina, crear cuentas admin |
| **Empleado** | Worker | Turnos propios, entrada QR/GPS, reportar, chat | Cualquier consola admin/master |

---

## 3. Módulos — qué hace cada pantalla

### Dirección (Master)

| Módulo | Qué hace |
|--------|----------|
| **Resumen** | Vista global de la plataforma |
| **Trabajadores en vivo** | Qué hace cada persona de campo ahora (jornada, GPS, turnos). Llamar al celular o abrir chat app |
| **Chat y videollamadas** | Canales del evento y DM |
| **Equipo administrativo** | Crear/gestionar Administrador, RH, Contabilidad |
| **Roles y puestos** | Roles personalizados y plantillas |
| **Informes globales** | Exportación CSV a nivel plataforma |
| **Auditoría** | Movimientos sensibles / nómina |
| **Ayuda** | Guía por plataforma |

### Operación empresa (Admin — también enlazada desde Master para el CEO)

| Módulo | Qué hace |
|--------|----------|
| **Configurar evento** | Crear/editar/eliminar eventos; sitios; tarifas; QR; temática y reglas |
| **Personal** | Crear, editar, habilitar/deshabilitar, eliminar trabajadores/supervisores |
| **Invitaciones y cuentas** | Enviar códigos, activar accesos, quitar invitaciones |
| **Operación / Dashboard del evento** | Turnos del evento, equipo, supervisión, eliminar evento |
| **Turnos** | Crear y gestionar turnos (asignar sitio y horario) |
| **QR y sitios** | Códigos QR por sitio y geocerca |
| **Supervisión y mapa** | GPS en vivo y alertas de geocerca |
| **Reportes** | Novedades enviadas por empleados; revisar/resolver |
| **Informes por evento** | Informes operativos/rendimiento del evento |
| **Comunicación** | Chat por canal (evento / empleados / supervisores / DM) |
| **Nómina** | Calcular y exportar pagos |
| **Negocio** | Clientes, facturación, inventario |
| **APIs / Integraciones** | Conectar servicios externos |
| **Notificaciones** | Alertas in-app / push |
| **Config. pendiente** | Checklist de producción |
| **Descargas** | APK / instaladores |

### App Empleado

| Módulo | Qué hace |
|--------|----------|
| **Inicio** | Resumen del turno y acciones |
| **Mis turnos** | Aceptar / ver turnos asignados |
| **Escanear QR / Ya estoy aquí** | Activar jornada con GPS o QR |
| **Reportar** | Enviar novedad al supervisor/admin |
| **Chat** | Canales permitidos + alertas |

---

## 4. CEO: parámetros de empresa vs empleado

**Sí (parámetros de empresa / operación):**

- Configurar y eliminar eventos  
- Personal: poner, quitar, crear, eliminar, ajustar  
- Invitaciones y cuentas de campo  
- Turnos, QR, mapa, supervisión  
- Reportes e informes  
- Nómina, clientes, facturación, inventario  
- Integraciones, roles, equipo admin, auditoría, chat  

**No (rol empleado):**

- Entrar a la app de campo como trabajador  
- Marcar su propia entrada QR / “mis turnos” de empleado  

---

## 5. Flujo típico de un evento

1. **CEO o Administrador** crea el evento en Configuración (sitios, tarifas, QR, reglas).  
2. Registran **personal** e envían **invitaciones**.  
3. Crean **turnos** (persona + sitio + horario).  
4. El **empleado** acepta el turno y marca llegada (QR o GPS).  
5. **Supervisor / Admin / CEO** monitorean mapa, reportes y chat.  
6. Al cierre: **nómina** e **informes**.  
7. Si el evento ya no sirve: **Eliminar evento** (bloqueado si hay jornadas abiertas).

---

## 6. Contacto con el personal en vivo

Desde **Trabajadores en vivo** (Master):

- **Llamar celular** — abre el marcador (en APK pide permiso de teléfono).  
- **Chat app** — abre conversación directa en Comunicación.

---

## 7. Dónde leer más

- Guía general: `docs/GUIA.md` / `docs-source/GUIA.md`  
- Cuentas y roles: `docs/CUENTAS-Y-ROLES.md`  
- Integraciones: `docs/INTEGRACIONES-APIS.md`  

*Última actualización: julio 2026 — CEO con operación empresa completa, sin app de empleado.*
