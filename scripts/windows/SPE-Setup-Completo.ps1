# SPE — Setup completo Windows (PowerShell)
# Ejecutar en PC con cuenta Google lasucursaldelcafe@gmail.com
#
#   Set-ExecutionPolicy -Scope Process Bypass
#   cd C:\ruta\Programa-de-logistca
#   .\scripts\windows\SPE-Setup-Completo.ps1

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Write-Host "`n=== SPE Setup Completo (PowerShell) ===" -ForegroundColor Cyan
Write-Host "Repo: $Root`n"

Set-Location $Root

function Test-Cmd($name) {
    $null = Get-Command $name -ErrorAction SilentlyContinue
    return $?
}

# 1. Dependencias
Write-Host "→ npm install..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falló" }

# 2. Python auto (token + credenciales locales)
if (Test-Cmd python) {
    Write-Host "→ Python spe-max-auto.py..." -ForegroundColor Yellow
    python scripts/spe-max-auto.py
} elseif (Test-Cmd python3) {
    python3 scripts/spe-max-auto.py
} else {
    Write-Host "! Python no encontrado — saltando generación token" -ForegroundColor DarkYellow
}

# 3. Google Sheets + Apps Script (clasp — abre navegador)
Write-Host "`n→ Google Sheets automático (clasp login)..." -ForegroundColor Yellow
Write-Host "  Se abrirá el navegador para lasucursaldelcafe@gmail.com" -ForegroundColor Gray
$claspOk = $false
try {
    npm run setup:sheets-auto
    if ($LASTEXITCODE -eq 0) { $claspOk = $true }
} catch {
    Write-Host "! setup:sheets-auto falló — continúa con pasos manuales" -ForegroundColor DarkYellow
}

# 4. Sincronizar config
Write-Host "→ config:sync..." -ForegroundColor Yellow
npm run config:sync

# 5. Diagnóstico
npm run diagnostico

# 6. GitHub Secrets (opcional si tienes gh CLI)
if (Test-Cmd gh) {
    Write-Host "`n→ GitHub CLI detectado" -ForegroundColor Yellow
    $credFile = Join-Path $Root "CREDENCIALES-SHEETS-AUTO.txt"
    if (-not (Test-Path $credFile)) { $credFile = Join-Path $Root "CREDENCIALES-SPE-GENERADAS.txt" }
    if (Test-Path $credFile) {
        $text = Get-Content $credFile -Raw
        if ($text -match "Web App URL:\s*(https://script\.google\.com/macros/s/[^\s]+/exec)") {
            $webUrl = $Matches[1]
        }
        if ($text -match "API Token:\s*(\S+)") {
            $apiToken = $Matches[1]
        }
        if ($webUrl -and $apiToken) {
            $confirm = Read-Host "¿Subir secrets a GitHub con gh? (s/N)"
            if ($confirm -eq "s" -or $confirm -eq "S") {
                gh secret set VITE_DATA_BACKEND --body "sheets"
                gh secret set VITE_DEMO_MODE --body "false"
                gh secret set VITE_SHEETS_WEB_APP_URL --body $webUrl
                gh secret set VITE_SHEETS_API_TOKEN --body $apiToken
                Write-Host "✓ Secrets Sheets configurados" -ForegroundColor Green
                $mapsKey = Read-Host "Pega VITE_GOOGLE_MAPS_API_KEY (Enter para omitir)"
                if ($mapsKey) { gh secret set VITE_GOOGLE_MAPS_API_KEY --body $mapsKey }
            }
        }
    }
} else {
    Write-Host "! Instala GitHub CLI (gh) para subir secrets automáticamente" -ForegroundColor DarkYellow
}

# 7. Build verificación
Write-Host "`n→ Build verificación..." -ForegroundColor Yellow
npm run build

Write-Host "`n=== LISTO ===" -ForegroundColor Green
Write-Host "App demo: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login?spe_backend=demo"
Write-Host "Local:    npm start  →  http://localhost:5173"
Write-Host "Credenciales: CREDENCIALES-SHEETS-AUTO.txt o CREDENCIALES-SPE-GENERADAS.txt"
Write-Host "Pendientes:   config/pendientes-setup.json`n"

if (-not $claspOk) {
    Write-Host "MANUAL clasp:" -ForegroundColor Yellow
    Write-Host "  1. npx @google/clasp login"
    Write-Host "  2. npm run setup:sheets-auto"
    Write-Host "  3. Edita config/bootstrap.json en GitHub con URL y token"
}
