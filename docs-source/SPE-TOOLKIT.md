# SPE Toolkit — Automatización Windows

Herramienta de escritorio y CLI en **Python** (sin dependencias pip) para automatizar tareas del Programa de Logística SPE.

## Requisitos

- **Python 3.10+** con PATH configurado ([python.org](https://www.python.org/downloads/))
- **Node.js 20+** para desarrollo y builds
- **Google Chrome** o Edge (para generar PDF)

## Inicio rápido (Windows)

### Opción A — Acceso directo en el escritorio

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\Instalar-SPE-Toolkit.ps1
```

Luego abre **SPE Toolkit** desde el escritorio.

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
| **Firebase** | Guarda credenciales en `apps/admin`, `apps/master` y `apps/worker/.env.local`. Genera plantilla para GitHub Secrets. |
| **Informes PDF** | Genera `INFORME-REVISION-SPE.pdf` y `REPORTE-FALTANTES-SPE.pdf` desde HTML/Markdown. |
| **Desarrollo** | Ejecuta `npm install`, `dev:full`, `build`, `build:pages`, Electron, etc. |
| **Diagnóstico** | Comprueba Node, Firebase, sitio en GitHub Pages, Chrome y artefactos del proyecto. |

## CLI (línea de comandos)

```bat
scripts\windows\spe-cli.bat setup
scripts\windows\spe-cli.bat firebase --interactive
scripts\windows\spe-cli.bat pdf
scripts\windows\spe-cli.bat pdf --faltantes
scripts\windows\spe-cli.bat health
scripts\windows\spe-cli.bat run dev:full
```

Desde cualquier SO:

```bash
npm run toolkit:cli -- health
npm run toolkit:setup
npm run toolkit:pdf
```

## Estructura

```
tools/
  spe_automation/     # Módulos: config, env, pdf, health, cli
  spe_toolkit_gui.py  # App Windows (tkinter)
  requirements.txt    # Solo stdlib; PyInstaller opcional
scripts/windows/
  SPE-Toolkit.bat
  spe-cli.bat
  Instalar-SPE-Toolkit.ps1
```

## Firebase en producción

1. Abre la pestaña **Firebase** y pega las credenciales de [Firebase Console](https://console.firebase.google.com/).
2. Pulsa **Guardar en apps** para desarrollo local.
3. Pulsa **Plantilla GitHub Secrets** y copia los valores a  
   `Settings → Secrets and variables → Actions` en GitHub.

Guía completa: `docs-source/PRODUCCION-FIREBASE.md`

## Empaquetar .exe (opcional)

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "SPE-Toolkit" tools/spe_toolkit_gui.py
```

El ejecutable quedará en `dist/SPE-Toolkit.exe`.
