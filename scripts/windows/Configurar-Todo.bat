@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0\..\.."

echo ============================================
echo   SPE - Configuracion automatica completa
echo ============================================
echo.

where python >nul 2>&1 && set PY=python && goto pyok
where py >nul 2>&1 && set PY=py && goto pyok
echo ERROR: Instala Python 3.10+ desde https://www.python.org/downloads/
pause
exit /b 1
:pyok

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo ERROR: Instala Node.js 20+ desde https://nodejs.org/
  pause
  exit /b 1
)

echo [1/3] Configurando desarrollo local (emuladores + credenciales)...
%PY% -m tools.spe_automation.cli demo
if %ERRORLEVEL% neq 0 (
  echo Fallo la configuracion.
  pause
  exit /b 1
)

echo.
echo [2/3] Creando acceso directo SPE Toolkit...
powershell -ExecutionPolicy Bypass -File scripts\windows\Instalar-SPE-Toolkit.ps1

echo.
echo [3/3] Listo. Abriendo archivo de credenciales...
if exist CREDENCIALES-SPE.txt start "" CREDENCIALES-SPE.txt

echo.
echo ============================================
echo   SIGUIENTE PASO: npm run dev:full
echo   Login: admin@eventos.test / Admin123!
echo ============================================
echo.
set /p START="Iniciar dev:full ahora? (S/n): "
if /i "!START!"=="n" goto end
npm run dev:full
:end
endlocal
