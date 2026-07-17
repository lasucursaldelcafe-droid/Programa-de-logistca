# Configurar SPE desde el celular (sin PC)

Tres caminos **sin escribir credenciales a mano**:

---

## 1. Un toque en la app (recomendado)

1. Abre en el celular:  
   **https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/configurar**
2. En Gmail, abre el correo con `CREDENCIALES-SHEETS-AUTO.txt` (o similar).
3. **Copiar todo** el texto del correo.
4. Vuelve a la app → **「Pegar credenciales del correo」**.
5. Login: `admin@eventos.test` / `Admin123!`

La configuración queda guardada en el navegador del celular.

---

## 2. Editar un archivo en GitHub (desde la app GitHub)

1. App **GitHub** → repo `Programa-de-logistca` → `config/bootstrap.json` → ✏️ Editar.
2. Pega URL `/exec` y token del correo (ver `config/bootstrap.example.json`).
3. **Commit** a `main` → en ~3 min se publica en Pages con backend Sheets.

Link directo:  
https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/edit/main/config/bootstrap.json

---

## 3. Enlace mágico (desde un mensaje)

Abre un enlace como (valores del correo):

```
https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/configurar?spe_backend=sheets&spe_url=URL_EXEC&spe_token=TOKEN
```

Se guarda solo y redirige al login.

---

## Lo que el agente cloud **no** puede hacer

- No tiene acceso al navegador de tu celular ni a Gmail.
- No puede escribir GitHub Secrets (permiso 403 del bot).
- No puede hacer `clasp login` en Google por ti.

**Tú solo copias/pegas una vez**; el resto (deploy en push, workflows, backend Sheets) ya está automatizado en el repo.

---

## Automatización ya activa

| Acción | Qué pasa |
|--------|----------|
| Push a `main` | Deploy automático GitHub Pages |
| Editar `config/bootstrap.json` | Build con Sheets/Firebase del archivo |
| `npm run apply:all` (PC) | Sube secrets o dispara workflow |

Ver también: `GUIA-SIN-DESCARGAR-JSON.md`
