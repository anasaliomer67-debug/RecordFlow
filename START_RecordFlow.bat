@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   Starting RecordFlow
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  echo Install Node.js LTS from https://nodejs.org/ first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencies are missing. Running setup first...
  call SETUP_RecordFlow.bat
  if errorlevel 1 exit /b 1
)

if not exist ".next" (
  echo Production build is missing. Building now...
  call npm.cmd run build:local
  if errorlevel 1 (
    echo Build failed. Check the error above.
    pause
    exit /b 1
  )
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue) { exit 1 }" >nul 2>nul
if errorlevel 1 (
  echo Port 3000 is already in use.
  echo Run STOP_RecordFlow.bat, then start RecordFlow again.
  pause
  exit /b 1
)

echo Opening http://localhost:3000/login
start "" "http://localhost:3000/login"
echo.
echo Keep this window open while using RecordFlow.
echo Press Ctrl+C in this window to stop the app.
echo.

call npm.cmd run start
pause
