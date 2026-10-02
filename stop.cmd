@echo off
setlocal EnableExtensions
title MOVONHUB - Stop
cd /d "%~dp0"

echo ============================================================
echo   MOVONHUB - stopping local development server
echo ============================================================
echo.

set "MH_FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Stopping process PID %%P ...
  taskkill /PID %%P /T /F >nul 2>nul
  set "MH_FOUND=1"
)

if "%MH_FOUND%"=="1" (
  echo.
  echo MOVONHUB has been stopped.
) else (
  echo No MOVONHUB server was found listening on port 3000.
)

echo.
ping -n 4 127.0.0.1 >nul
exit /b 0
