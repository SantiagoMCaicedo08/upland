# Levanta la fase 2 de Upland (esta carpeta): PostgreSQL, backend y frontend en React.
#
#   powershell -ExecutionPolicy Bypass -File scripts\iniciar-fase2.ps1
#
# Abre el backend y el frontend cada uno en su ventana. Para terminar, se cierran las dos.
# No carga datos: eso se hace una sola vez y esta explicado en el README.

param([switch]$SinNavegador)

$raiz = Split-Path $PSScriptRoot -Parent
$frontend = Join-Path $raiz 'frontend'

function Test-Puerto($puerto) {
    [bool](Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue)
}

function Wait-Puerto($puerto, $segundos) {
    for ($i = 0; $i -lt $segundos; $i += 2) {
        if (Test-Puerto $puerto) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

foreach ($puerto in 8080, 5500) {
    if (Test-Puerto $puerto) {
        Write-Host "El puerto $puerto esta ocupado. Cierra las ventanas del backend y del frontend que tengas abiertas y vuelve a ejecutar." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host '1/3 PostgreSQL' -ForegroundColor Cyan
docker compose -f (Join-Path $raiz 'docker-compose.yml') up -d --wait
if ($LASTEXITCODE -ne 0) { Write-Host 'No se pudo levantar PostgreSQL. Comprueba que Docker Desktop este abierto.' -ForegroundColor Red; exit 1 }

Write-Host '2/3 Backend (se abre en otra ventana)' -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory (Join-Path $raiz 'backend') -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'Upland fase 2 - backend'; .\mvnw.cmd spring-boot:run"
if (-not (Wait-Puerto 8080 180)) { Write-Host 'El backend no arranco. Revisa su ventana.' -ForegroundColor Red; exit 1 }

Write-Host '3/3 Frontend (se abre en otra ventana)' -ForegroundColor Cyan
# La primera vez hay que descargar las dependencias de React; despues ya estan en node_modules.
$instalar = if (Test-Path (Join-Path $frontend 'node_modules')) { '' } else { 'npm.cmd install; ' }
Start-Process powershell -WorkingDirectory $frontend -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'Upland fase 2 - frontend'; ${instalar}npm.cmd run dev"
if (-not (Wait-Puerto 5500 180)) { Write-Host 'El frontend no arranco. Revisa su ventana.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host 'Fase 2 lista en http://localhost:5500' -ForegroundColor Green
Write-Host 'Usuarios (clave upland123): ana@upland.test y carlos@upland.test son anfitriones; laura@upland.test y pedro@upland.test son huespedes.'
Write-Host 'Para terminar, cierra las dos ventanas que se abrieron.'
if (-not $SinNavegador) { Start-Process 'http://localhost:5500' }
