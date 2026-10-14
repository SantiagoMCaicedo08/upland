# Funciones que comparten iniciar-fase2.ps1 y presentar-fase1.ps1. No se ejecuta solo: los
# otros dos scripts lo cargan con ". (Join-Path $PSScriptRoot 'comun.ps1')".

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

# Las dos fases usan los puertos 8080 (backend) y 5500 (frontend). Si los ocupa Upland (la
# otra fase, o esta misma abierta de antes), se cierra: así cambiar de fase es un solo
# comando. Si los ocupa otro programa no se toca, y se dice cuál es.
function Clear-PuertosUpland {
    # Primero las ventanas que abrieron estos scripts; cerrarlas no cierra lo que corre dentro.
    Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
        Where-Object { $_.CommandLine -like '*Upland fase*' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    foreach ($puerto in 8080, 5500) {
        $conexiones = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue
        foreach ($id in ($conexiones.OwningProcess | Select-Object -Unique)) {
            $proceso = Get-CimInstance Win32_Process -Filter "ProcessId = $id"
            # El backend es un java con "upland" en su classpath; el frontend es node con
            # Vite (fase 2) o http-server (fase 1).
            if ([string]$proceso.CommandLine -match 'upland|vite|http-server') {
                Write-Host "    cerrando lo que ocupaba el puerto $puerto ($($proceso.Name))"
                Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
            } else {
                Write-Host "El puerto $puerto lo ocupa otro programa: $($proceso.Name) (PID $id). Cierralo y vuelve a ejecutar." -ForegroundColor Yellow
                return $false
            }
        }
    }
    Start-Sleep -Seconds 2
    return -not ((Test-Puerto 8080) -or (Test-Puerto 5500))
}

# Deja PostgreSQL listo: abre Docker Desktop si está cerrado, reanuda el contenedor si
# alguien lo pausó y lo levanta con docker compose.
function Start-PostgreSQL($raiz) {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        $docker = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
        if (-not (Test-Path $docker)) {
            Write-Host 'No se encontro Docker Desktop. Abrelo a mano y vuelve a ejecutar.' -ForegroundColor Red
            return $false
        }
        Write-Host '    Docker Desktop estaba cerrado: abriendolo (puede tardar un par de minutos)'
        Start-Process $docker
        for ($i = 0; $i -lt 90; $i++) {
            Start-Sleep -Seconds 2
            docker info *> $null
            if ($LASTEXITCODE -eq 0) { break }
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host 'Docker Desktop no termino de arrancar. Espera a que diga "Engine running" y vuelve a ejecutar.' -ForegroundColor Red
            return $false
        }
    }

    $pausado = docker inspect -f '{{.State.Paused}}' upland-postgres 2>$null
    if ("$pausado".Trim() -eq 'true') {
        Write-Host '    el contenedor estaba pausado: reanudandolo'
        docker unpause upland-postgres *> $null
        # Mientras estuvo pausado, sus revisiones de salud fallaron: Docker lo sigue marcando
        # "unhealthy" hasta la siguiente revisión (cada 5 s), y compose --wait se rendiría.
        for ($i = 0; $i -lt 20; $i++) {
            $salud = docker inspect -f '{{.State.Health.Status}}' upland-postgres
            if ("$salud".Trim() -eq 'healthy') { break }
            Start-Sleep -Seconds 2
        }
    }

    # Out-Host muestra la salida en pantalla sin que se vuelva parte del valor que devuelve
    # la función, que debe ser solo $true o $false.
    docker compose -f (Join-Path $raiz 'docker-compose.yml') up -d --wait | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'No se pudo levantar PostgreSQL.' -ForegroundColor Red
        return $false
    }
    return $true
}
