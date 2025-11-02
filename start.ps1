#!/usr/bin/env pwsh
# Script para iniciar Backend e Frontend simultaneamente

Write-Host "Iniciando Restaurant Analytics Platform..." -ForegroundColor Cyan
Write-Host ""

# Diretório raiz do projeto
$ROOT_DIR = $PSScriptRoot

# Função para matar processos nas portas
function Stop-ProcessOnPort {
    param($Port)
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "Matando processo na porta $Port..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# Limpar portas se estiverem em uso
Write-Host "Verificando portas 8000 e 5173..." -ForegroundColor Gray
Stop-ProcessOnPort -Port 8000
Stop-ProcessOnPort -Port 5173

Write-Host ""
Write-Host "Iniciando Backend (FastAPI) na porta 8000..." -ForegroundColor Green

# Iniciar Backend em uma nova janela do PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$ROOT_DIR\backend'
Write-Host 'Backend FastAPI' -ForegroundColor Green
Write-Host '==================' -ForegroundColor Green
Write-Host ''
if (Test-Path 'venv\Scripts\python.exe') {
    Write-Host 'Usando Python do ambiente virtual (venv)' -ForegroundColor Yellow
    .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
} elseif (Test-Path '.venv\Scripts\python.exe') {
    Write-Host 'Usando Python do ambiente virtual (.venv)' -ForegroundColor Yellow
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
} else {
    Write-Host 'ERRO: Ambiente virtual nao encontrado!' -ForegroundColor Red
    Write-Host 'Execute: python -m venv venv' -ForegroundColor Yellow
    Write-Host 'Depois: .\venv\Scripts\Activate.ps1' -ForegroundColor Yellow
    Write-Host 'E entao: pip install -r requirements.txt' -ForegroundColor Yellow
    pause
}
"@

# Aguardar backend iniciar
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Iniciando Frontend (Vite + React) na porta 5173..." -ForegroundColor Cyan

# Iniciar Frontend em uma nova janela do PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$ROOT_DIR\frontend'
Write-Host 'Frontend React + Vite' -ForegroundColor Cyan
Write-Host '========================' -ForegroundColor Cyan
Write-Host ''
npm run dev
"@

# Aguardar frontend iniciar
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Servidores iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponiveis:" -ForegroundColor White
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "   • API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dica: Pressione Ctrl+C em cada janela para parar os servidores" -ForegroundColor Gray
Write-Host ""

# Aguardar mais um pouco e abrir navegador
Start-Sleep -Seconds 2
Write-Host "Abrindo navegador..." -ForegroundColor Magenta
Start-Process "http://localhost:5173"
