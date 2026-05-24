@echo off
setlocal
cd /d "%~dp0"

echo.
echo Stopping RecordFlow if it is running...

if exist "server-pid.txt" (
  set /p RECORDFLOW_PID=<server-pid.txt
  if not "%RECORDFLOW_PID%"=="" (
    taskkill /PID %RECORDFLOW_PID% /T /F >nul 2>nul
  )
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; foreach ($connection in $connections) { Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

echo RecordFlow stopped.

if /I not "%~1"=="/quiet" pause
