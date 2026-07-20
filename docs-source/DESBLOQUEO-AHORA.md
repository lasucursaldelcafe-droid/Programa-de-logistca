# Desbloqueo producción (QR, cuentas, correo)

## Por qué no funciona hoy

1. Login con `lasucursaldelcafe@gmail.com` **sí entra**.
2. Las **reglas Firestore en consola están viejas** (no reconocen el rol `ceo` como maestro).
3. Por eso **falla crear cuentas, QR e invitaciones** (403).
4. El workflow de GitHub “Desplegar reglas” salía en verde pero **no desplegaba**: faltaba el secret `FIREBASE_TOKEN`.
5. Cloud Functions (correo HTML de invitación) **no están desplegadas**.

## Qué hacer ahora (elige 1)

### Opción A — Consola Firebase (2 min)

1. Abre [Reglas Firestore](https://console.firebase.google.com/project/programalog-ccc12/firestore/rules)
2. Pega el archivo `firestore.rules` del repo
3. **Publicar**
4. En el agente o en PC:

```bash
SPE_PROD_PASSWORD='SpeAdmin2026!' npm run desbloquear:operacion
```

Eso crea el QR del evento/sitio existente y cuentas Admin / RH / Contador.

### Opción B — Autorizar al agente

Abre el enlace de login Firebase que te pase el agente, inicia sesión con `lasucursaldelcafe@gmail.com` y **pega el código** en el chat. El agente desplegará reglas + ejecutará el desbloqueo.

### Opción C — Secret permanente

```bash
npx firebase login:ci
```

Copia el token a GitHub → Settings → Secrets → Actions → `FIREBASE_TOKEN`.  
También `SPE_PROD_PASSWORD` con la clave del CEO.

## Correo

| Tipo | Estado |
|------|--------|
| Reset / “olvidé contraseña” (Firebase Auth) | Funciona sin Functions |
| Invitación HTML con código (Cloud Functions + Gmail) | Requiere `firebase deploy --only functions` y secrets `GMAIL_USER` / `GMAIL_APP_PASSWORD` |

Mientras tanto: comparte enlace `/activar?token=…` + código de la invitación, o la contraseña impresa al crear la cuenta.

## Ya existe en producción (lectura OK)

- Evento: `prueba de aplicacion`
- Sitio: `Hotel el peñon`
- Invitación pendiente: `pabcolgom@gmail.com` (supervisor) — código en Firestore
- QR: **ninguno** (hasta desbloquear escritura)
