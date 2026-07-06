# Descargas — Windows y Android

Los instaladores se generan automáticamente en cada push a `main` mediante GitHub Actions.

## Enlace directo

**https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest**

## Archivos disponibles

| Archivo | Plataforma | Descripción |
|---------|------------|-------------|
| `SPE-Admin-*-nsis.exe` | Windows | Instalador de la consola Admin (Electron) |
| `SPE-Admin-*-portable.exe` | Windows | Versión portable sin instalación |
| `SPE-Trabajador-*-android.apk` | Android | App del trabajador (Capacitor) |

## Cuentas demo (modo demostración)

| App | Correo | Contraseña |
|-----|--------|------------|
| Admin / Windows | admin@eventos.test | Admin123! |
| Trabajador / Android | maria@eventos.test | Trab123! |
| Master (solo web) | master@eventos.test | Master123! |

## Instalar en Windows

1. Descarga `SPE-Admin-*-nsis.exe` desde Releases.
2. Ejecuta el instalador y sigue el asistente.
3. Abre **SPE Admin** desde el menú Inicio.
4. Inicia sesión con la cuenta demo de administrador.

Alternativa: usa `SPE-Admin-*-portable.exe` si no quieres instalar en el sistema.

## Instalar en Android

1. Descarga `SPE-Trabajador-*-android.apk`.
2. En el teléfono, ve a **Ajustes → Seguridad** y permite **orígenes desconocidos** (o “Instalar apps desconocidas” para tu navegador).
3. Abre el archivo APK descargado e instala.
4. Inicia sesión con la cuenta demo del trabajador.

## Web (sin instalación)

| Plataforma | URL |
|------------|-----|
| Admin | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/ |
| Trabajador | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/worker/ |
| Master | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/master/ |

## Si no hay releases todavía

Revisa el workflow **Publicar instaladores (Windows + Android)** en [Actions](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions). Cuando el build termine en verde, el release aparecerá en la pestaña Releases.

## Compilar localmente

```bash
# Windows (requiere Windows o Wine)
npm run electron:build

# Android (requiere Android SDK + Java 21)
npm run cap:sync
cd apps/worker/android && ./gradlew assembleDebug
```
