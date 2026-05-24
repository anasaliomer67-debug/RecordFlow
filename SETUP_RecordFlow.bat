@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   RecordFlow setup
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm is not available in PATH.
  echo Reinstall Node.js LTS and run this file again.
  pause
  exit /b 1
)

echo Stopping any running RecordFlow server...
call STOP_RecordFlow.bat /quiet

echo Installing dependencies...
call npm.cmd install
if errorlevel 1 goto fail

echo.
echo Preparing database client...
call npm.cmd run db:generate:local
if errorlevel 1 goto fail

echo.
echo Syncing database schema...
call npm.cmd run db:push:local
if errorlevel 1 goto fail

echo.
echo Building RecordFlow...
call npm.cmd run build:local
if errorlevel 1 goto fail

echo.
echo Setup completed successfully.
echo Use START_RecordFlow.bat to open the app.
pause
exit /b 0

:fail
echo.
echo Setup failed. Check the error above.
pause
exit /b 1
