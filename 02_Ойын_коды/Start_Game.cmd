@echo off
cd /d "%~dp0"
set "GAME_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%GAME_NODE%" (
  "%GAME_NODE%" serve-game.mjs --open
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js 22 or newer is required. Install it from nodejs.org.
    pause
    exit /b 1
  )
  node serve-game.mjs --open
)
