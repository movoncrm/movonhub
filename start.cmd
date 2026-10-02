@echo off
setlocal EnableExtensions
title MOVONHUB - Start
cd /d "%~dp0"

echo ============================================================
echo   MOVONHUB - local development
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH. Install Node.js 18+ first.
  echo         https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/4] Installing dependencies ^(first run, this may take a few minutes^)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo [1/4] Dependencies present.
)

if not exist ".env.local" (
  echo [2/4] Creating .env.local with generated secrets...
  copy /y ".env.example" ".env.local" >nul
  for /f "delims=" %%S in ('node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"') do set "MHSECRET=%%S"
  for /f "delims=" %%A in ('node -e "process.stdout.write(require('crypto').randomBytes(9).toString('base64url'))"') do set "MHADMIN=%%A"
  powershell -NoProfile -Command "(Get-Content '.env.local') -replace '^SESSION_SECRET=.*','SESSION_SECRET=%MHSECRET%' -replace '^ADMIN_PASSWORD=.*','ADMIN_PASSWORD=%MHADMIN%' | Set-Content '.env.local'"
) else (
  echo [2/4] Using existing .env.local.
)

echo [3/4] Starting the dev server in a minimised window...
start "MOVONHUB dev" /min cmd /c "npm run dev > .movonhub-dev.log 2>&1"

echo       Waiting for http://localhost:3000 ...
set /a MH_TRIES=0
:wait
set /a MH_TRIES+=1
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 goto ready
if %MH_TRIES% geq 60 goto timeout
ping -n 3 127.0.0.1 >nul
goto wait

:ready
echo.
echo   MOVONHUB is running:  http://localhost:3000
echo   Advisor page:         http://localhost:3000/sa/nik
echo   Stop it any time with: stop.cmd
echo.

set "MHCHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "MHCHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "MHCHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "MHCHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

echo [4/4] Opening the browser...
if defined MHCHROME (
  start "" "%MHCHROME%" "http://localhost:3000"
) else (
  start "" "http://localhost:3000"
)

echo.
echo Done. This window can be closed; the server keeps running.
ping -n 5 127.0.0.1 >nul
exit /b 0

:timeout
echo.
echo [WARN] The server did not become ready in time.
echo        Check the log for errors:  .movonhub-dev.log
echo.
pause
exit /b 1
