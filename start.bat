@echo off
REM Script para iniciar Backend e Frontend no Windows (CMD)

echo.
echo ========================================
echo  Restaurant Analytics Platform
echo ========================================
echo.

echo [1/3] Verificando portas...
netstat -ano | findstr :8000 > nul
if %errorlevel% equ 0 (
    echo Porta 8000 em uso, matando processo...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr :5173 > nul
if %errorlevel% equ 0 (
    echo Porta 5173 em uso, matando processo...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [2/3] Iniciando Backend (FastAPI)...
start "Backend - FastAPI :8000" cmd /k "cd backend && echo Backend FastAPI && echo ==================== && echo. && if exist venv\Scripts\python.exe (echo Usando Python do venv && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) else (echo ERRO: venv nao encontrado! && pause)"

timeout /t 3 /nobreak >nul

echo.
echo [3/3] Iniciando Frontend (Vite + React)...
start "Frontend - React+Vite :5173" cmd /k "cd frontend && echo Frontend React + Vite && echo ======================== && echo. && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Servidores Iniciados!
echo ========================================
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo.
echo Abrindo navegador...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Pressione qualquer tecla para sair...
pause >nul
