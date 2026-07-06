# Persistencia de datos y despliegue

## Cómo se guardan tus cambios

| Modo | Dónde se guarda | Sincroniza entre dispositivos |
|------|-----------------|-------------------------------|
| **Demo** (web, Android, Windows con internet) | `localStorage` del navegador en la URL publicada | Sí, si usas la misma URL (GitHub Pages) |
| **Desarrollo** (`npm start`) | Firebase Emulators (Firestore) | Solo en tu PC mientras corren los emuladores |
| **Producción Firebase** (futuro) | Firestore en la nube | Sí, en tiempo real |

### Demo — plataformas unificadas

- **Web:** https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/
- **Android (APK):** carga la misma URL (requiere internet).
- **Windows (instalador):** desde esta versión carga la misma URL por defecto, para que personal, cuentas y configuración coincidan con la web.

Los datos demo viven en el navegador del usuario, **no en Git**. Eliminar o crear personal se guarda al instante en `localStorage` y se recarga al abrir de nuevo la app.

### Eliminar personal

En **Personal → Eliminar → Confirmar** se borra la persona y se limpian invitaciones, turnos y cuentas asociadas. Queda registro en el historial local (demo).

## Despliegue automático (código)

Cada **push a `main`** dispara:

1. **GitHub Pages** — app web actualizada (`.github/workflows/deploy-github-pages.yml`)
2. **Release Windows + Android** — nuevos instaladores (`.github/workflows/release-apps.yml`)

Los cambios de **código** se publican así. Los cambios de **datos** (personal que registras tú) no van a `main`; se guardan en el almacenamiento del navegador o en Firestore según el modo.

## Flujo recomendado para el equipo

1. Desarrollar en rama `cursor/...`
2. Verificar build: `npm run build -w @spe/admin`
3. Merge a `main` → CI publica web + instaladores
4. Usuarios recargan la web o reinstalan solo si cambió el **código**; sus **datos** siguen en el mismo origen (URL o emulador).
