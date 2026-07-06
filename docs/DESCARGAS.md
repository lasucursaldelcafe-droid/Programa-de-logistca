# Descargas — SPE (Windows, Android, Web)

## Enlace principal (última versión)

### https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest

Tras cada merge a `main`, GitHub Actions publica automáticamente:

| Archivo | Plataforma | Descripción |
|---------|------------|-------------|
| `SPE-Admin-0.2.0-nsis.exe` | Windows | Instalador — consola Admin |
| `SPE-Admin-0.2.0-portable.exe` | Windows | Portable — consola Admin |
| `SPE-Trabajador-0.2.0-android.apk` | Android | App del trabajador en campo |

## Web (sin instalar)

| App | URL |
|-----|-----|
| Admin | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| Trabajador | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/worker/ |
| Master | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/master/ |

## Cuentas demo

| App | Correo | Contraseña |
|-----|--------|------------|
| Admin / Windows | admin@eventos.test | Admin123! |
| Trabajador / Android | maria@eventos.test | Trab123! |
| Master | master@eventos.test | Master123! |

---

## Windows — SPE Admin

1. Abre [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest)
2. Descarga **`SPE-Admin-*-nsis.exe`**
3. Ejecuta → Instalar → Abre desde el menú Inicio

**Portable:** `SPE-Admin-*-portable.exe` (no requiere instalación)

## Android — SPE Trabajador

1. Abre [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest)
2. Descarga **`SPE-Trabajador-*-android.apk`**
3. En el celular: **Ajustes → Seguridad → Instalar apps desconocidas**
4. Abre el APK → **Instalar**

## Compilar localmente

```bash
# Windows (Admin)
npm run electron:build
# → apps/desktop/release/

# Android (Trabajador)
npm run cap:sync
cd apps/worker/android && ./gradlew assembleDebug
# → apps/worker/android/app/build/outputs/apk/debug/app-debug.apk
```

## Publicación automática

Workflow: `.github/workflows/release-apps.yml`

Forzar release manual: **GitHub → Actions → Publicar instaladores → Run workflow**
