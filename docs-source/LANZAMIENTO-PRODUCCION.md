# Lanzamiento a producción (SPE)

## Estado objetivo

| Pieza | Valor |
|-------|--------|
| URL | https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login |
| Proyecto Firebase | `programalog-ccc12` |
| Cuenta raíz | `lasucursaldelcafe@gmail.com` → rol **`ceo`** |
| Panel | `/master` (CEO / Master App) |
| Demo | No. Solo Firebase real en Pages |

## Paso crítico: publicar reglas Firestore

Sin esto, el rol `ceo` **no puede escribir** en Firestore (las reglas viejas solo conocen `super_admin` / `administrador`).

1. Abre [Firebase Console → Firestore → Reglas](https://console.firebase.google.com/project/programalog-ccc12/firestore/rules)
2. Copia el contenido de `firestore.rules` del repo
3. **Publicar**
4. (Opcional) En PC: `firebase login:ci` → guarda el token como GitHub Secret `FIREBASE_TOKEN`

Luego:

```bash
SPE_PROD_PASSWORD='tu-clave' npm run ensure:prod-ceo
SPE_PROD_PASSWORD='tu-clave' npm run verify:prod-login
```

## Si el login falla o no puedes escribir

En Firestore → `users` → documento del UID de `lasucursaldelcafe@gmail.com`:

- Campo `role` = `ceo` (después de publicar reglas nuevas), **o**
- Temporalmente `super_admin` / `administrador` (reglas viejas) hasta publicar las nuevas

## Flujo de negocio tras el login

1. Entras como **CEO** → consola Master
2. **Equipo administrativo** → creas Administrador, Recursos Humanos, Contabilidad
3. Esas cuentas entran a `/panel` con su menú
4. Personal de campo se crea en **Personal** → app `/worker`

## Secrets GitHub obligatorios

Ya usados en Pages: `VITE_FIREBASE_*` (6).

Añadir cuanto antes:

| Secret | Para |
|--------|------|
| `SPE_PROD_PASSWORD` | Contraseña de la cuenta raíz |
| `FIREBASE_TOKEN` | Deploy automático de reglas y Cloud Functions |

## Comandos

```bash
npm run ensure:prod-ceo      # rol CEO en Auth/Firestore
npm run verify:prod-login    # comprueba Auth + rol raíz
npm run produccion:completa  # pipeline local si hay token
```
