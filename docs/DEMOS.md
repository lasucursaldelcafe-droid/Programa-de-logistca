# Demos — SPE Negocio (estilo Siigo)

Plataforma unificada: contabilidad demo, integraciones API (Siigo, WhatsApp, redes, web) y supervisión de personal en vivo.

## Cuentas de prueba

| Correo | Contraseña | Rol |
|--------|------------|-----|
| admin@eventos.test | Admin123! | Administrador |
| supervisor@eventos.test | Super123! | Supervisor de sitio |
| maria@eventos.test | Trab123! | Trabajador |
| juan@eventos.test | Trab123! | Trabajador |

## Demo web (navegador)

```bash
npm run setup
npm start
```

Abre http://localhost:5173 — inicia sesión con `admin@eventos.test` / `Admin123!`.

### Módulos disponibles

- **Dashboard** — KPIs de negocio + personal
- **Clientes / Facturación / Inventario** — ERP demo
- **Integraciones** — conectar Siigo, WhatsApp, Facebook, Instagram, webhooks
- **Supervisión en vivo** — mapa con posiciones simuladas cada 5 s
- **Personal / Turnos** — gestión de trabajadores y turnos

## Demo GitHub Pages

Tras `npm run build:pages`, la app se publica en:

`https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/`

Modo demo: datos en memoria del navegador (sin Firebase).

## Demo Windows (Electron)

```bash
# 1. Compilar web para empaquetado nativo
npm run build:native

# 2. Ejecutar app de escritorio
npm run electron
```

### Instalador Windows

```bash
npm run electron:build
```

Genera en `apps/desktop/release/`:

- `SPENegocio-0.1.0-win.exe` (instalador NSIS)
- `SPENegocio-0.1.0-win.exe` (portable)

Requisitos: Node.js 20+, Windows 10/11.

## Demo Android (Capacitor)

Requisitos: Android Studio, JDK 17, SDK Android.

```bash
# Primera vez: añadir plataforma Android
npm run cap:add:android

# Sincronizar build web → proyecto Android
npm run cap:sync

# Abrir en Android Studio
npm run cap:android
```

En Android Studio: Run ▶ en emulador o dispositivo físico.

### Permisos

La app solicita ubicación para futura supervisión GPS en campo (demo).

## Integraciones (modo demo)

Todas las conexiones son simuladas — no requieren credenciales reales.

| Integración | Uso |
|-------------|-----|
| Siigo | Facturas y clientes sincronizados (demo) |
| WhatsApp Business | Bandeja y plantillas (demo) |
| Facebook / Instagram | Comentarios y leads (demo) |
| Web / Webhooks | Formularios y eventos entrantes (demo) |

En **Integraciones → Configurar APIs** (solo administrador):

1. Expande cada integración (Siigo, WhatsApp, etc.)
2. **Sube** un archivo `.json` o `.env`, o ingresa los campos manualmente
3. Pulsa **Guardar credenciales** o **Guardar y conectar**

Las credenciales se guardan en `localStorage` del navegador (demo).

## Skills Cursor

- `.cursor/skills/spe-negocio-siigo/SKILL.md` — módulos ERP y UX tipo Siigo
- `.cursor/skills/spe-integrations/SKILL.md` — conectores API y hub de integraciones

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Emuladores Firebase + web dev |
| `npm run build` | Build producción web |
| `npm run build:pages` | Build para GitHub Pages |
| `npm run build:native` | Build para Electron/Capacitor |
| `npm run electron` | App Windows (dev) |
| `npm run electron:build` | Instalador Windows |
| `npm run cap:sync` | Sync Capacitor Android |
| `npm run cap:android` | Abrir Android Studio |
