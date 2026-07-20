# SPE — Setup completo Windows (PowerShell) — Firebase producción
# Ejecutar en PC con cuenta lasucursaldelcafe@gmail.com
#
#   Set-ExecutionPolicy -Scope Process Bypass
#   cd C:\ruta\Programa-de-logistca
#   .\scripts\windows\SPE-Setup-Completo.ps1

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Write-Host "`n=== SPE Setup Completo — Firebase (PowerShell) ===" -ForegroundColor Cyan
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

# 2. Firebase web config
$fbConfig = Join-Path $Root "firebase-web-config.json"
$fbExample = Join-Path $Root "firebase-web-config.example.json"
if (-not (Test-Path $fbConfig)) {
    Write-Host "`n! Falta firebase-web-config.json" -ForegroundColor Yellow
    Write-Host "  1. Abre https://console.firebase.google.com" -ForegroundColor Gray
    Write-Host "  2. Proyecto → Configuración → App web → copia firebaseConfig" -ForegroundColor Gray
    Write-Host "  3. Guárdalo como firebase-web-config.json (plantilla: firebase-web-config.example.json)" -ForegroundColor Gray
    if (Test-Path $fbExample) {
        Copy-Item $fbExample $fbConfig
        Write-Host "  → Creado firebase-web-config.json desde plantilla — EDÍTALO antes de continuar" -ForegroundColor DarkYellow
        Read-Host "Pulsa Enter cuando hayas pegado las credenciales Firebase"
    }
}

# 3. Service account (opcional pero recomendado)
$saFile = Join-Path $Root "service-account.json"
if (-not (Test-Path $saFile)) {
    Write-Host "`n! Falta service-account.json (Admin SDK)" -ForegroundColor Yellow
    Write-Host "  Firebase Console → Configuración → Cuentas de servicio → Generar clave privada" -ForegroundColor Gray
}

# 4. Contraseña admin
if (-not $env:SPE_PROD_PASSWORD) {
    $pwd = Read-Host "Contraseña para lasucursaldelcafe@gmail.com (SPE_PROD_PASSWORD)"
    if ($pwd) { $env:SPE_PROD_PASSWORD = $pwd }
}

# 5. Setup CLI automático
Write-Host "`n→ npm run setup:cli -- --full ..." -ForegroundColor Yellow
npm run setup:cli -- --full
if ($LASTEXITCODE -ne 0) {
    Write-Host "! setup:cli con avisos — revisa SETUP-RESULTADO.txt" -ForegroundColor DarkYellow
}

# 6. Firebase login (Firestore manual si service account falló)
if (Test-Cmd firebase) {
    Write-Host "`n→ firebase login (opcional, para deploy manual)..." -ForegroundColor Yellow
    Write-Host "  Si ya desplegaste Firestore en setup:cli, puedes omitir" -ForegroundColor Gray
} elseif (Test-Cmd npx) {
    Write-Host "  Tip: npx firebase-tools login" -ForegroundColor Gray
}

Write-Host "`n=== LISTO ===" -ForegroundColor Green
Write-Host "Login:  https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login"
Write-Host "Local:  npm start  →  http://localhost:5173"
Write-Host "Acceso: npm run acceso"
Write-Host "Resumen: SETUP-RESULTADO.txt`n"
