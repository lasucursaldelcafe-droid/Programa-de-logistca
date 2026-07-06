# Cuentas, credenciales y roles — SPE

## Principio

| Tipo de cuenta | Quién la crea | Credenciales |
|----------------|---------------|--------------|
| **Administrador** (único) | Seed / Master plataforma | Cuenta fija de plataforma (`admin@eventos.test` en demo) |
| **Master** | Seed plataforma | Solo gestión global (`master@eventos.test` en demo) |
| **Supervisor, Trabajador** | Administrador → Personal + Cuentas | Nombre y correo de la persona; **contraseña la elige la persona** al activar |

**Los roles los asigna solo el administrador** al registrar en Personal. Nadie más puede elegir su propio rol.

---

## Flujo del administrador

1. **Personal** — Registrar persona con nombre, documento, correo y **rol** (Trabajador o Supervisor de sitio).
2. **Cuentas** — Enviar invitación por correo (código de 6 dígitos, un solo uso).
3. La persona recibe el correo con su nombre y rol asignado.

## Flujo de la persona invitada

1. Abre la app SPE → **Unirme con código** o enlace de activación.
2. Ingresa **su correo** (el que registró el admin) y el **código**.
3. Crea **su contraseña personal** (mínimo 8 caracteres).
4. Si es trabajador: completa perfil. Si es supervisor: entra directo al panel operativo.

Tras iniciar sesión, la app abre el panel según el rol asignado por el administrador.

---

## Cuentas de plataforma (demo / seed)

| Rol | Correo | Contraseña | Notas |
|-----|--------|------------|-------|
| Master | master@eventos.test | Master123! | Super admin — no se crea desde Personal |
| **Administrador** | admin@eventos.test | Admin123! | **Única cuenta admin** — asigna roles e invita |

No hay supervisor ni trabajadores precargados. Se crean desde el panel.

---

## Permisos

- **Asignar roles:** solo `administrador`
- **Enviar invitaciones:** solo `administrador` (Cuentas)
- **Registrar personal:** administrador y supervisor (el supervisor registra con rol Trabajador por defecto)
- **Configurar APIs:** administrador y master

---

## Producción (Firebase)

- Seed crea solo Master + Administrador en Auth y Firestore.
- Invitaciones guardan `role` en documento `invitations`.
- Activación crea usuario Auth con email de la persona y `role` de la invitación.
- El administrador de producción debe cambiar la contraseña del seed tras el primer acceso.
