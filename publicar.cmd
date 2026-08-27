@echo off
REM Doble clic aqui para publicar el cotizador en internet.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publicar.ps1" %*
echo.
pause
