# SPE — Producción Firebase completa (un comando en PC)
#   .\scripts\windows\SPE-Produccion-Completa.ps1
#
# Orden: login:ci → secret GitHub → deploy reglas/functions → QR + cuentas

$ErrorActionPreference = "Stop"
Set-Location (Split-Path (Split-Path $PSScriptRoot))

Write-Host "`n=== SPE — Firebase producción (automático) ===`n" -ForegroundColor Cyan
Write-Host "Nota: GitHub Pages (la web) ya se publica solo." -ForegroundColor DarkGray
Write-Host "Este script configura el puente GitHub → Firebase.`n" -ForegroundColor DarkGray

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "Necesitas Node.js / npm instalado." -ForegroundColor Red
    exit 1
}

if (-not $env:FIREBASE_TOKEN) {
    Write-Host "1/4  Generando FIREBASE_TOKEN (abre el navegador)…" -ForegroundColor Yellow
    $token = (npx --yes firebase-tools@14 login:ci 2>&1 | Select-String -Pattern '^1//' | Select-Object -Last 1).ToString().Trim()
    if (-not $token) {
        Write-Host "Pega aquí el token que mostró firebase login:ci:" -ForegroundColor Yellow
        $token = Read-Host "FIREBASE_TOKEN"
    }
    if (-not $token) {
        Write-Host "Sin token no se puede continuar." -ForegroundColor Red
        exit 1
    }
    $credPath = "config/credenciales.local.json"
    if (Test-Path $credPath) {
        $cred = Get-Content $credPath -Raw | ConvertFrom-Json
    } else {
        $cred = [pscustomobject]@{}
    }
    $cred | Add-Member -NotePropertyName firebaseToken -NotePropertyValue $token -Force
    if (-not $cred.speProdPassword) {
        $cred | Add-Member -NotePropertyName speProdPassword -NotePropertyValue "SpeAdmin2026!" -Force
    }
    $cred | ConvertTo-Json -Depth 5 | Set-Content $credPath -Encoding UTF8
    $env:FIREBASE_TOKEN = $token
    Write-Host "   Token guardado en config/credenciales.local.json" -ForegroundColor Green
}

if (-not $env:SPE_PROD_PASSWORD) {
    $env:SPE_PROD_PASSWORD = "SpeAdmin2026!"
}

Write-Host "2/4  Subiendo secrets a GitHub…" -ForegroundColor Yellow
npm run setup:firebase-token
if ($LASTEXITCODE -ne 0) {
    Write-Host "   No se pudo subir con gh. Créalo a mano:" -ForegroundColor Yellow
    Write-Host "   GitHub → Settings → Secrets → FIREBASE_TOKEN" -ForegroundColor Yellow
}

Write-Host "3/4  Desplegando Firebase (reglas + bootstrap + QR)…" -ForegroundColor Yellow
npm run produccion:completa
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Fallback local: deploy reglas + desbloquear…" -ForegroundColor Yellow
    npm run deploy:firestore-rules
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npm run desbloquear:operacion
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    npm run desbloquear:operacion
}

Write-Host "4/4  Disparando workflow GitHub (opcional)…" -ForegroundColor Yellow
if (Get-Command gh -ErrorAction SilentlyContinue) {
    gh workflow run "Configurar Firebase (SPE)" 2>$null
}

Write-Host "`n✓ Listo." -ForegroundColor Green
Write-Host "  App:    https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login"
Write-Host "  Cuenta: lasucursaldelcafe@gmail.com / (SPE_PROD_PASSWORD)"
Write-Host "  QR:     /qr-sitios  |  Cuentas: salen en la salida de desbloquear:operacion`n"
