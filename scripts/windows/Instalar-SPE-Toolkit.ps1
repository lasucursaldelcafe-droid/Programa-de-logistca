# Instala acceso directo al escritorio para SPE Toolkit
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$BatPath = Join-Path $RepoRoot "scripts\windows\SPE-Toolkit.bat"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "SPE Toolkit.lnk"

if (-not (Test-Path $BatPath)) {
    Write-Error "No se encuentra $BatPath"
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $BatPath
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.Description = "SPE Toolkit - Automatizacion Firebase, PDF y desarrollo"
$Shortcut.Save()

Write-Host "Acceso directo creado: $ShortcutPath" -ForegroundColor Green
Write-Host "Ejecuta SPE Toolkit desde el escritorio o: $BatPath"
