# Levanta la fase 1 de Upland (rama fase-1) para presentarla, sin tocar el trabajo de la fase 2.
#
#   powershell -ExecutionPolicy Bypass -File scripts\presentar-fase1.ps1
#
# Por qué hace falta: la fase 1 y la fase 2 no pueden compartir base de datos. La base de la
# fase 2 tiene migraciones (V3 en adelante) que el código de la fase 1 no conoce, y Flyway se
# niega a arrancar si encuentra migraciones aplicadas que no están en el código. Por eso la
# fase 1 usa su propia base, upland_fase1, dentro del mismo PostgreSQL.
#
# El código de la fase 1 queda en una carpeta aparte (upland-fase1, al lado de esta) creada
# con "git worktree": es la rama fase-1 del mismo repositorio, sin tener que cambiar de rama
# aquí ni guardar el trabajo en curso.
#
# Las dos fases usan los puertos 8080 y 5500: si la fase 2 está abierta, este script la cierra.

param([switch]$SinNavegador)

. (Join-Path $PSScriptRoot 'comun.ps1')

$raiz = Split-Path $PSScriptRoot -Parent
$carpeta = Join-Path (Split-Path $raiz -Parent) 'upland-fase1'
$base = 'upland_fase1'

Write-Host '1/6 Puertos 8080 y 5500' -ForegroundColor Cyan
if (-not (Clear-PuertosUpland)) { exit 1 }

Write-Host '2/6 Codigo de la fase 1' -ForegroundColor Cyan
if (-not (Test-Path $carpeta)) {
    git -C $raiz worktree add $carpeta fase-1
    if ($LASTEXITCODE -ne 0) { Write-Host 'No se pudo crear la carpeta de la fase 1.' -ForegroundColor Red; exit 1 }
}
Write-Host "    $carpeta"

Write-Host '3/6 PostgreSQL' -ForegroundColor Cyan
if (-not (Start-PostgreSQL $raiz)) { exit 1 }

$existe = docker exec upland-postgres psql -U upland -d postgres -tAc "select 1 from pg_database where datname = '$base'"
if ("$existe".Trim() -ne '1') {
    docker exec upland-postgres createdb -U upland $base
    Write-Host "    base $base creada"
}

Write-Host '4/6 Backend (se abre en otra ventana)' -ForegroundColor Cyan
# La ventana nueva hereda esta variable: es lo que apunta el backend a la base de la fase 1.
$env:DB_URL = "jdbc:postgresql://localhost:5432/$base"
Start-Process powershell -WorkingDirectory (Join-Path $carpeta 'backend') -ArgumentList '-NoExit', '-Command', (Get-ComandoBackend 'Upland fase 1 - backend')
Remove-Item Env:DB_URL
if (-not (Wait-Puerto 8080 180)) { Write-Host 'El backend no arranco. Revisa su ventana.' -ForegroundColor Red; exit 1 }

Write-Host '5/6 Datos de demostracion' -ForegroundColor Cyan
$usuarios = docker exec upland-postgres psql -U upland -d $base -tAc 'select count(*) from usuarios'
if ("$usuarios".Trim() -eq '0') {
    docker cp (Join-Path $carpeta 'db\semilla.sql') upland-postgres:/tmp/semilla-fase1.sql
    docker exec upland-postgres psql -U upland -d $base -q -f /tmp/semilla-fase1.sql
    Write-Host '    semilla cargada'
} else {
    Write-Host "    ya habia datos ($("$usuarios".Trim()) usuarios)"
}

Write-Host '6/6 Frontend (se abre en otra ventana)' -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $carpeta -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'Upland fase 1 - frontend'; npx.cmd --yes http-server frontend -p 5500 -c-1"
if (-not (Wait-Puerto 5500 90)) { Write-Host 'El frontend no arranco. Revisa su ventana.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host 'Fase 1 lista en http://localhost:5500' -ForegroundColor Green
Write-Host 'Usuarios (clave upland123): ana@upland.test y carlos@upland.test son anfitriones; laura@upland.test y pedro@upland.test son huespedes.'
Write-Host 'Para terminar, cierra las dos ventanas que se abrieron.'
if (-not $SinNavegador) { Start-Process 'http://localhost:5500' }
