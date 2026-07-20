# SPE — Desplegar Firestore (reglas + índices chat)
# Ejecutar en PowerShell desde la raíz del repo:
#   .\scripts\windows\SPE-Deploy-Firestore.ps1
#
# Desbloquea: chat /comunicacion, datos en producción, login Firestore sin 403.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path (Split-Path $PSScriptRoot))

$projectId = "programalog-ccc12"
if (Test-Path "config/bootstrap.json") {
    $boot = Get-Content "config/bootstrap.json" | ConvertFrom-Json
    if ($boot.firebase.projectId) { $projectId = $boot.firebase.projectId }
}

Write-Host "`n=== SPE — Firestore (reglas + chat) ===" -ForegroundColor Cyan
Write-Host "Proyecto: $projectId`n" -ForegroundColor Gray

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando firebase-tools…" -ForegroundColor Yellow
    npm install -g firebase-tools
}

if (-not $env:FIREBASE_TOKEN) {
    $credPath = "config/credenciales.local.json"
    if (Test-Path $credPath) {
        $cred = Get-Content $credPath | ConvertFrom-Json
        if ($cred.firebaseToken) { $env:FIREBASE_TOKEN = $cred.firebaseToken }
    }
}

if (-not $env:FIREBASE_TOKEN) {
    Write-Host "Genera FIREBASE_TOKEN (abre navegador)…" -ForegroundColor Yellow
    firebase login
    firebase use $projectId
    $token = firebase login:ci
    if ($token) {
        if (-not (Test-Path "config")) { New-Item -ItemType Directory -Path "config" | Out-Null }
        if (Test-Path $credPath) {
            $cred = Get-Content $credPath | ConvertFrom-Json
        } else {
            $cred = [ordered]@{ google = @{ email = "lasucursaldelcafe@gmail.com" } }
        }
        $cred | Add-Member -NotePropertyName firebaseToken -NotePropertyValue $token -Force
        $cred | ConvertTo-Json -Depth 5 | Set-Content $credPath
        $env:FIREBASE_TOKEN = $token
        Write-Host "✓ Token guardado en $credPath" -ForegroundColor Green
    }
}

Write-Host "`n→ Desplegando reglas + índices…" -ForegroundColor Yellow
npm run deploy:firestore
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nAlternativa CLI directa:" -ForegroundColor Yellow
    firebase use $projectId
    npm run firebase:deploy-firestore
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`n→ Bootstrap admin (users + setupConfig)…" -ForegroundColor Yellow
if (-not $env:SPE_PROD_PASSWORD) { $env:SPE_PROD_PASSWORD = "SpeAdmin2026!" }
npm run firestore:bootstrap -- --uid 8kJ9xnbXwlNVQerimF088JXo8Ql1 --skip-auth
if ($LASTEXITCODE -ne 0) {
    npm run firestore:bootstrap
}

Write-Host "`n→ Verificando login producción…" -ForegroundColor Yellow
npm run verify:prod-login
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠ Auth OK pero Firestore puede seguir bloqueado — repite deploy o revisa consola Firebase." -ForegroundColor Yellow
}

Write-Host "`n✓ Paso 2 completado." -ForegroundColor Green
Write-Host "  Chat: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/comunicacion" -ForegroundColor Gray
Write-Host "  Login: lasucursaldelcafe@gmail.com / $env:SPE_PROD_PASSWORD`n" -ForegroundColor Gray
