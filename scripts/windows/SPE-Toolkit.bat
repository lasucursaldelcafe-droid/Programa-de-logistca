@echo off
setlocal
cd /d "%~dp0\..\.."

where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
  set PY=python
) else (
  where py >nul 2>&1
  if %ERRORLEVEL% equ 0 (
    set PY=py
  ) else (
    echo Python no encontrado. Instala Python 3.10+ desde https://www.python.org/downloads/
    echo Marca "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
  )
)

echo Iniciando SPE Toolkit...
%PY% tools\spe_toolkit_gui.py
if %ERRORLEVEL% neq 0 pause
endlocal
