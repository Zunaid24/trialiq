@echo off
setlocal

title TrialIQ Local Agent

cd /d "%~dp0"

echo.
echo ========================================
echo        TrialIQ Local Agent
echo ========================================
echo.
echo Project: %CD%
echo.

if not exist "package.json" (
    echo [ERROR] TrialIQ project not found.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [ERROR] node_modules not found.
    echo.
    echo Please run npm install once in the TrialIQ project.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\.bin\tsx.cmd" (
    echo [ERROR] tsx is not installed.
    echo.
    echo Please run npm install once in the TrialIQ project.
    echo.
    pause
    exit /b 1
)

echo [TrialIQ] Starting Local Agent...
echo.

call npm run local:agent

echo.
echo ========================================
echo TrialIQ Local Agent stopped.
echo ========================================
echo.
pause