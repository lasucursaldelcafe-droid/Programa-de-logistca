# SPE — Producción completa (un comando)
# Ejecutar en PowerShell desde la raíz del repo:
#   .\scripts\windows\SPE-Produccion-Completa.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path (Split-Path $PSScriptRoot))

Write-Host "`n=== SPE — Producción completa ===`n" -ForegroundColor Cyan

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando firebase-tools…" -ForegroundColor Yellow
    npm install -g firebase-tools
}

if (-not $env:FIREBASE_TOKEN) {
    Write-Host "Genera FIREBASE_TOKEN (firebase login:ci)…" -ForegroundColor Yellow
    $token = firebase login:ci
    if ($token) {
        $credPath = "config/credenciales.local.json"
        if (Test-Path $credPath) {
            $cred = Get-Content $credPath | ConvertFrom-Json
        } else {
            $cred = @{}
        }
        $cred | Add-Member -NotePropertyName firebaseToken -NotePropertyValue $token -Force
        $cred | ConvertTo-Json -Depth 5 | Set-Content $credPath
        $env:FIREBASE_TOKEN = $token
    }
}

if (-not $env:SPE_PROD_PASSWORD) {
    $env:SPE_PROD_PASSWORD = "SpeAdmin2026!"
}

npm run produccion:completa
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n✓ Listo. Abre: https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/login" -ForegroundColor Green
Write-Host "  lasucursaldelcafe@gmail.com / SpeAdmin2026!`n"
