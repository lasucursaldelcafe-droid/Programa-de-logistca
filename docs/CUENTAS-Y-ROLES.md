# Cuentas, credenciales y roles — SPE

## Principio

| Tipo de cuenta | Quién la crea | Credenciales |
|----------------|---------------|--------------|
| **CEO / Master App** | Seed / plataforma | Cuentas raíz de dirección |
| **Administrador, RH, Contabilidad** | CEO / Master / Administrador | Cuenta de plataforma |
| **Supervisor, Empleado** | CEO, Admin, RH (y Supervisor solo empleados) → Personal + Cuentas | Nombre y correo de la persona; **contraseña la elige la persona** al activar |

**El CEO tiene todos los parámetros de la empresa** (eventos, personal, turnos, reportes, nómina, negocio) **excepto** la app de empleado. Sí puede crear, quitar, ajustar e invitar personal y ver reportes.

---

## Flujo del administrador / CEO

1. **Personal** — Registrar persona con nombre, documento, correo y **rol** (Empleado o Supervisor de sitio).
2. **Cuentas** — Enviar invitación por correo (código de 6 dígitos, un solo uso).
3. La persona recibe el correo con su nombre y rol asignado.

## Flujo de la persona invitada

1. Abre la app SPE → **Unirme con código** o enlace de activación.
2. Ingresa **su correo** (el que registró el admin) y el **código**.
3. Crea **su contraseña personal** (mínimo 8 caracteres).
4. Si es trabajador: completa perfil. Si es supervisor: entra directo al panel operativo.

Tras iniciar sesión, la app abre el panel según el rol asignado.

---

## Cuentas de plataforma (demo / seed)

| Rol | Correo | Contraseña | Notas |
|-----|--------|------------|-------|
| Master | master@eventos.test | Master123! | Super admin — no se crea desde Personal |
| **Administrador** | admin@eventos.test | Admin123! | Opera eventos e invita personal |

No hay supervisor ni trabajadores precargados. Se crean desde el panel.

---

## Permisos (resumen)

- **CEO:** toda la empresa + menú Master; **no** app de empleado  
- **Asignar roles de campo:** quien tenga `gestionar_personal` (CEO, Admin, RH, Supervisor con límites)  
- **Enviar invitaciones:** quien tenga `gestionar_cuentas`  
- **Configurar APIs:** administrador, CEO y master  

Informe completo de módulos: [INFORME-QUE-HACE-CADA-COSA.md](./INFORME-QUE-HACE-CADA-COSA.md)

---

## Producción (Firebase)

- Seed crea cuentas raíz + Administrador en Auth y Firestore.
- Invitaciones guardan `role` en documento `invitations`.
- Activación crea usuario Auth con email de la persona y `role` de la invitación.
- Cambiar la contraseña del seed tras el primer acceso.
