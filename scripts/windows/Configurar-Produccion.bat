@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0\..\.."

echo ============================================
echo   SPE - Configuracion PRODUCCION (Firebase)
echo ============================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo ERROR: Instala Node.js 20+ desde https://nodejs.org/
  pause
  exit /b 1
)

if not exist firebase-web-config.json (
  echo ERROR: Falta firebase-web-config.json en la raiz del proyecto.
  echo.
  echo Desde PC ^(sin celular^):
  echo   1. Abre https://console.firebase.google.com
  echo   2. Configuracion - App web - copia firebaseConfig
  echo   3. Guarda como firebase-web-config.json
  echo      ^(plantilla: firebase-web-config.example.json^)
  echo   4. Vuelve a ejecutar este script
  echo.
  pause
  exit /b 1
)

echo [1/3] Configurando Firebase en admin, worker y master...
call npm run setup:auto -- --production
if %ERRORLEVEL% neq 0 goto fail

echo.
echo [2/3] Subiendo GitHub Secrets ^(si gh esta autenticado^)...
call npm run setup:auto -- --production --push-github
echo.

echo [3/3] Creando cuentas ^(si existe service-account.json^)...
call npm run setup:auto -- --production --seed

if exist CHECKLIST-PRODUCCION.txt start "" CHECKLIST-PRODUCCION.txt
if exist github-secrets-commands.txt start "" github-secrets-commands.txt

echo.
echo ============================================
echo   LISTO - Ver CHECKLIST-PRODUCCION.txt
echo   npm start  ^|  npm run toolkit:secrets
echo ============================================
pause
exit /b 0

:fail
echo Fallo la configuracion.
pause
exit /b 1
