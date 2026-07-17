# SPE Toolkit — Automatización Windows

Herramienta de escritorio y CLI en **Python** (sin dependencias pip) para automatizar tareas del Programa de Logística SPE.

## Requisitos

- **Python 3.10+** con PATH configurado ([python.org](https://www.python.org/downloads/))
- **Node.js 20+** para desarrollo y builds
- **Google Chrome** o Edge (para generar PDF)

## Configuración automática al 100%

Ver guía completa: **`docs-source/CONFIGURACION-AUTOMATICA.md`**

### Windows — un solo clic

```bat
scripts\windows\Configurar-Todo.bat           rem desarrollo demo
scripts\windows\Configurar-Produccion.bat     rem producción Firebase
```

### Linux / macOS

```bash
chmod +x scripts/configurar-todo.sh
./scripts/configurar-todo.sh demo
./scripts/configurar-todo.sh produccion
```

### npm (cualquier OS)

```bash
npm run setup:auto
npm run setup:production
npm run toolkit:auto -- --json firebase-web-config.json --push-github --seed
```

Esto hace:
1. Crea `.env.local` en **admin**, **master** y **worker** (modo emuladores)
2. Ejecuta `npm install`
3. Genera `CREDENCIALES-SPE.txt` con usuarios de prueba
4. Crea acceso directo **SPE Toolkit** en el escritorio
5. Opcionalmente inicia `npm run dev:full`

### Desde CLI / npm

```bash
npm run toolkit:demo      # Desarrollo local 100%
npm run toolkit:init -- --demo
npm run dev:full          # Emuladores + seed + admin :5173
```

**Cuentas automáticas (emuladores):**

| Email | Password | App |
|-------|----------|-----|
| admin@eventos.test | Admin123! | Admin :5173 |
| master@eventos.test | Master123! | Master :5175 |

---

## Producción (Firebase real)

### Paso 1 — Obtener credenciales

1. [Firebase Console](https://console.firebase.google.com/) → tu proyecto
2. Configuración → Tus apps → SDK web → copia `firebaseConfig`
3. Guarda como `firebase-web-config.json` (ver `firebase-web-config.example.json`)

### Paso 2 — Aplicar con SPE Toolkit

**GUI:** pestaña Firebase → pegar config → **Aplicar producción**

**CLI:**
```bash
npm run toolkit:init -- --json firebase-web-config.json
# o interactivo:
npm run toolkit:cli -- firebase --interactive
```

### Paso 3 — GitHub Secrets (Pages + releases Windows/Android)

```bash
gh auth login
npm run toolkit:secrets
```

O copia manualmente desde `github-secrets-commands.txt`

### Paso 4 — Cuentas en producción

1. Firebase Console → Cuentas de servicio → Generar clave privada
2. Guarda como `service-account.json` en la raíz (gitignored)
3. Ejecuta:

```bash
npm run seed:production -- --service-account ./service-account.json
```

Crea `master@eventos.test` y `admin@eventos.test` en Firebase Auth + Firestore.

---

## Inicio rápido (Windows)

### Opción A — Acceso directo en el escritorio

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\Instalar-SPE-Toolkit.ps1
```

### Opción B — Lanzador directo

```bat
scripts\windows\SPE-Toolkit.bat
```

### Opción C — npm

```bash
npm run toolkit
```

## Pestañas de la aplicación

| Pestaña | Función |
|---------|---------|
| **Firebase / Credenciales** | Demo 100%, pegar config producción, GitHub Secrets |
| **Informes PDF** | Genera informes de presentación |
| **Desarrollo** | npm scripts (dev:full, build, seed producción…) |
| **Diagnóstico** | Node, Firebase, sitio Pages, Chrome |

## CLI completa

```bat
scripts\windows\spe-cli.bat demo
scripts\windows\spe-cli.bat init --json firebase-web-config.json
scripts\windows\spe-cli.bat firebase --interactive
scripts\windows\spe-cli.bat secrets
scripts\windows\spe-cli.bat pdf --faltantes
scripts\windows\spe-cli.bat health
scripts\windows\spe-cli.bat run dev:full
```

## Archivos generados (gitignored)

| Archivo | Contenido |
|---------|-----------|
| `CREDENCIALES-SPE.txt` | Usuarios y pasos de acceso |
| `github-secrets-commands.txt` | Comandos `gh secret set` |
| `firebase-web-config.json` | Tu config Firebase (opcional) |
| `service-account.json` | Clave Admin SDK para seed producción |

## Estructura

```
tools/
  spe_automation/
    credentials.py   # Parse Firebase, demo, GitHub secrets
    setup_full.py    # Configuración completa
    env_manager.py   # .env.local × 3 apps
    cli.py           # CLI
  spe_toolkit_gui.py # App Windows
scripts/
  seed-production.ts # Cuentas Firebase producción
  windows/
    Configurar-Todo.bat
    SPE-Toolkit.bat
```

Guía Firebase: `docs-source/PRODUCCION-FIREBASE.md`
