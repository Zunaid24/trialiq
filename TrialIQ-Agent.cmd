@echo off
setlocal EnableExtensions EnableDelayedExpansion

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
    exit /b 1
)

if not exist "node_modules" (
    echo [ERROR] node_modules not found.
    echo [ERROR] Please run npm install once in the TrialIQ project.
    exit /b 1
)

if not exist "node_modules\.bin\tsx.cmd" (
    echo [ERROR] tsx is not installed.
    echo [ERROR] Please run npm install once in the TrialIQ project.
    exit /b 1
)

echo [TrialIQ] Cleaning dedicated agent ports 45822 and 45823...

rem These ports belong exclusively to TrialIQ. Kill every listener and its child tree.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(45822,45823); foreach($port in $ports){$connections=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue; foreach($c in $connections){$pid=$c.OwningProcess; Write-Host ('[TrialIQ] Stopping PID ' + $pid + ' on port ' + $port); taskkill.exe /PID $pid /T /F 2>$null | Out-Null}}"

rem Wait until both agent sockets are actually free.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(10); do {$busy=@(45822,45823) | Where-Object {Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $_ -State Listen -ErrorAction SilentlyContinue}; if(-not $busy){exit 0}; Start-Sleep -Milliseconds 300} while((Get-Date) -lt $deadline); Write-Host '[ERROR] TrialIQ agent ports did not become free.' -ForegroundColor Red; exit 1"
if errorlevel 1 exit /b 1

echo [TrialIQ] Agent ports are free.
echo [TrialIQ] Starting Local Agent...
echo.

call npm run local:agent
set "AGENT_EXIT=%ERRORLEVEL%"

echo.
echo ========================================
echo TrialIQ Local Agent stopped. Exit code: %AGENT_EXIT%
echo ========================================
echo.
exit /b %AGENT_EXIT%
