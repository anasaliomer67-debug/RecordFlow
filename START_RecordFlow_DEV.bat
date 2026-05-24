@echo off
setlocal
cd /d "%~dp0"

echo.
echo Starting RecordFlow in development mode...
echo Opening http://localhost:3000/login
echo.

if not exist "node_modules" (
  call SETUP_RecordFlow.bat
  if errorlevel 1 exit /b 1
)

start "" "http://localhost:3000/login"
call npm.cmd run dev
pause
