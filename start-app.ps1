# Script para iniciar la aplicación de forma robusta
# Este script asegura que no haya procesos bloqueando los puertos y espera a que el servidor esté listo.

$Port = 3000
$Url = "http://localhost:$Port"

Write-Host "--- Preparando inicio de la aplicación ---" -ForegroundColor Cyan

# 1. Limpiar procesos antiguos de Node en el puerto 3000
Write-Host "Verificando procesos en el puerto $Port..." -ForegroundColor Gray
$ProcessId = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($ProcessId) {
    Write-Host "Cerrando proceso previo (PID: $ProcessId) para liberar el puerto..." -ForegroundColor Yellow
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 2. Iniciar el servidor de desarrollo
Write-Host "Iniciando servidor de desarrollo (npm run dev)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/c npm run dev" -WindowStyle Normal

# 3. Esperar a que el servidor responda
Write-Host "Esperando a que el servidor esté listo en $Url..." -ForegroundColor Cyan
$MaxAttempts = 30
$Attempt = 1
$Ready = $false

while (-not $Ready -and $Attempt -le $MaxAttempts) {
    try {
        $Response = Invoke-WebRequest -Uri $Url -Method Head -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            $Ready = $true
        }
    } catch {
        Write-Host "[$Attempt/$MaxAttempts] El servidor aún no responde, esperando..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $Attempt++
    }
}

if ($Ready) {
    Write-Host "`n¡Servidor listo! Abriendo el navegador..." -ForegroundColor Green
    Start-Process $Url
} else {
    Write-Error "El servidor tardó demasiado en iniciar. Por favor, revisa la ventana de comandos de Node para ver si hay errores."
}

Write-Host "`nNo cierres la ventana negra de Node mientras uses la aplicación." -ForegroundColor Yellow
Write-Host "Puedes cerrar esta ventana de control." -ForegroundColor Gray
Start-Sleep -Seconds 5
