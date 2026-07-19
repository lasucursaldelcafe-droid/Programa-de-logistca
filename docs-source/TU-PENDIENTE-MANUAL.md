# Lo que TÚ debes hacer (5–15 min)

> Ejecuta primero en PC: `npm run auto:max` o `.\scripts\windows\SPE-Setup-Completo.ps1`  
> Eso genera token + archivos locales (no se suben a Git).

## Opción A — PC Windows (recomendada, ~10 min)

1. Abre **PowerShell** en la carpeta del repo.
2. Ejecuta:
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\scripts\windows\SPE-Setup-Completo.ps1
   ```
3. Inicia sesión con **lasucursaldelcafe@gmail.com** cuando abra el navegador (clasp).
4. Al terminar, abre `CREDENCIALES-SHEETS-AUTO.txt` en la raíz del repo.
5. Si PowerShell preguntó por **gh secrets** y dijiste **s**, ya quedó en GitHub.
6. Si no tienes `gh`: copia URL y token a GitHub Secrets (ver abajo).

## Opción B — Solo celular (~15 min)

1. Abre el archivo generado en tu PC (después de `npm run auto:max`):  
   `CREDENCIALES-SPE-GENERADAS.txt`  
   Copia el **API Token** y guárdalo.
2. Google Sheets → nueva hoja → **Extensiones → Apps Script**.
3. Pega el código de `apps-script/spe-backend/Code.gs`.
4. ⚙️ Propiedades del script → `SPE_API_TOKEN` = tu token.
5. Ejecuta `setupSheets` → **Implementar → Web App → Cualquiera** → copia URL `/exec`.
6. Edita en GitHub: `config/bootstrap.json` usando plantilla `config/bootstrap.sheets.plantilla.json`.
7. Commit a `main` → espera deploy 5 min.

## GitHub Secrets (obligatorio para producción web)

https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/settings/secrets/actions

| Name | Value |
|------|--------|
| `VITE_DATA_BACKEND` | `sheets` |
| `VITE_DEMO_MODE` | `false` |
| `VITE_SHEETS_WEB_APP_URL` | URL `/exec` de Apps Script |
| `VITE_SHEETS_API_TOKEN` | Token de CREDENCIALES-SPE-GENERADAS.txt |
| `VITE_GOOGLE_MAPS_API_KEY` | Clave Google Maps (opcional mapa real) |

## Verificar

- Login: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login  
- Mapa: …/mapa  
- Demo mientras tanto: `?spe_backend=demo` + `admin@eventos.test` / `Admin123!`
