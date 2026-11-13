@echo off
rem Starter ansoegningssiden lokalt og aabner den i browseren.
rem Luk det lille servervindue for at stoppe siden igen.
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  set "PY=python"
) else (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Python blev ikke fundet. Installer Python fra python.org og proev igen.
    pause
    exit /b 1
  )
  set "PY=py"
)

start "Ansoegning - lokal server (luk vinduet for at stoppe)" /min %PY% -m http.server 5173
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173/?motion=1"
