@echo off
setlocal
cd /d "%~dp0"
echo Iniciando proceso de arranque inteligente...
powershell -ExecutionPolicy Bypass -File ".\start-app.ps1"
pause
