@echo off
setlocal
cd /d "%~dp0\..\.."
where python >nul 2>&1 && set PY=python && goto run
where py >nul 2>&1 && set PY=py && goto run
echo Python no encontrado.
exit /b 1
:run
%PY% -m tools.spe_automation.cli %*
endlocal
