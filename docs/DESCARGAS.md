# Descargas — SPE Negocio

## Enlace principal (siempre el más reciente)

**GitHub Releases:**  
https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest

Cada merge a `main` genera automáticamente un nuevo release con:

| Archivo | Plataforma |
|---------|------------|
| `SPENegocio-0.1.0-nsis.exe` | Windows — instalador |
| `SPENegocio-0.1.0-portable.exe` | Windows — portable (sin instalar) |
| `SPE-Negocio-0.1.0-android.apk` | Android — instalar en celular |

## App web (sin descargar)

https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/

## Cuenta demo

- **admin@eventos.test** / **Admin123!**

---

## Instalar en Windows

1. Ve a [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest)
2. Descarga **`SPENegocio-*-nsis.exe`**
3. Ejecuta el instalador → Siguiente → Instalar
4. Abre **SPE Negocio** desde el menú Inicio

**Portable:** descarga `SPENegocio-*-portable.exe` si no quieres instalar.

## Instalar en Android

1. Ve a [Releases](https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/releases/latest)
2. Descarga **`SPE-Negocio-*-android.apk`**
3. En el celular: **Ajustes → Seguridad → Instalar apps desconocidas** (activar para Chrome/Archivos)
4. Abre el APK descargado → **Instalar**

## Compilar localmente (opcional)

Si prefieres generar los archivos en tu PC:

```bash
# Windows
npm run electron:build
# → apps/desktop/release/

# Android (requiere Android Studio)
npm run cap:sync && npm run cap:android
# → Build APK en Android Studio
```

## Publicación automática

El workflow `.github/workflows/release-apps.yml` compila y publica en cada push a `main`.

Para forzar un release manual: **Actions → Publicar instaladores → Run workflow**.
