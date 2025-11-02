#!/usr/bin/env pwsh
# Script para parar todos os servidores

Write-Host "Parando servidores..." -ForegroundColor Red
Write-Host ""

# Função para matar processos nas portas
function Stop-ProcessOnPort {
    param($Port, $Name)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            Write-Host "   Matando $Name (PID: $pid) na porta $Port..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Write-Host "   OK - $Name parado" -ForegroundColor Green
    } else {
        Write-Host "   INFO - Nenhum processo rodando na porta $Port" -ForegroundColor Gray
    }
}

# Parar Backend
Write-Host "Parando Backend (porta 8000)..." -ForegroundColor Cyan
Stop-ProcessOnPort -Port 8000 -Name "Backend"

Write-Host ""

# Parar Frontend
Write-Host "Parando Frontend (porta 5173)..." -ForegroundColor Cyan
Stop-ProcessOnPort -Port 5173 -Name "Frontend"

Write-Host ""
Write-Host "Todos os servidores foram parados!" -ForegroundColor Green
Write-Host ""
