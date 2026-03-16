@echo off
echo =============================================
echo   Solucionador de Ecuaciones Diferenciales
echo =============================================
echo.

REM Verificar API key
if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: Define ANTHROPIC_API_KEY antes de ejecutar.
    echo Ejemplo: set ANTHROPIC_API_KEY=sk-ant-...
    pause
    exit /b 1
)

echo [1/2] Iniciando backend (Python/FastAPI)...
start "Backend - Diff Solver" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando frontend (React/Vite)...
start "Frontend - Diff Solver" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo Abriendo en el navegador...
start http://localhost:5173

echo.
echo La app esta corriendo en http://localhost:5173
pause
