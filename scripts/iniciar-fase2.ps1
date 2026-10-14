# Levanta la fase 2 de Upland (esta carpeta): PostgreSQL, backend y frontend en React.
#
#   powershell -ExecutionPolicy Bypass -File scripts\iniciar-fase2.ps1
#
# Abre el backend y el frontend cada uno en su ventana. Para terminar, se cierran las dos.
# Si la fase 1 está abierta, la cierra: las dos usan los puertos 8080 y 5500.
# No carga datos: eso se hace una sola vez y esta explicado en el README.

param([switch]$SinNavegador)

. (Join-Path $PSScriptRoot 'comun.ps1')

$raiz = Split-Path $PSScriptRoot -Parent
$frontend = Join-Path $raiz 'frontend'

Write-Host '1/4 Puertos 8080 y 5500' -ForegroundColor Cyan
if (-not (Clear-PuertosUpland)) { exit 1 }

Write-Host '2/4 PostgreSQL' -ForegroundColor Cyan
if (-not (Start-PostgreSQL $raiz)) { exit 1 }

Write-Host '3/4 Backend (se abre en otra ventana)' -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory (Join-Path $raiz 'backend') -ArgumentList '-NoExit', '-Command', (Get-ComandoBackend 'Upland fase 2 - backend')
if (-not (Wait-Puerto 8080 180)) { Write-Host 'El backend no arranco. Revisa su ventana.' -ForegroundColor Red; exit 1 }

Write-Host '4/4 Frontend (se abre en otra ventana)' -ForegroundColor Cyan
# La primera vez hay que descargar las dependencias de React; despues ya estan en node_modules.
$instalar = if (Test-Path (Join-Path $frontend 'node_modules')) { '' } else { 'npm.cmd install; ' }
Start-Process powershell -WorkingDirectory $frontend -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'Upland fase 2 - frontend'; ${instalar}npm.cmd run dev"
if (-not (Wait-Puerto 5500 180)) { Write-Host 'El frontend no arranco. Revisa su ventana.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host 'Fase 2 lista en http://localhost:5500' -ForegroundColor Green
Write-Host 'Usuarios (clave upland123): ana@upland.test y carlos@upland.test son anfitriones; laura@upland.test y pedro@upland.test son huespedes.'
Write-Host 'Para terminar, cierra las dos ventanas que se abrieron.'
if (-not $SinNavegador) { Start-Process 'http://localhost:5500' }
