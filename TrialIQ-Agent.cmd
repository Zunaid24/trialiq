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

echo [TrialIQ] Checking agent ports...

rem Clean up stale TrialIQ proxy/internal-agent processes before starting.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(45822,45823); foreach($port in $ports){$connections=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue; foreach($c in $connections){$p=Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $c.OwningProcess) -ErrorAction SilentlyContinue; $cmd=[string]$p.CommandLine; if($cmd -match 'trialiq' -or $cmd -match 'local-agent'){Write-Host ('[TrialIQ] Stopping stale agent PID ' + $c.OwningProcess + ' on port ' + $port); Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue}}}"

rem Give Windows a moment to release the sockets after task/process termination.
timeout /t 1 /nobreak >nul

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
