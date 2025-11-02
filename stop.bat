@echo off
REM Script para parar todos os servidores

echo.
echo ========================================
echo  Parando Servidores
echo ========================================
echo.

echo [1/2] Parando Backend (porta 8000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo    Matando processo %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [2/2] Parando Frontend (porta 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo    Matando processo %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================
echo  Servidores Parados!
echo ========================================
echo.
pause
