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

echo [TrialIQ] Cleaning stale TrialIQ processes and ports 3000, 45822 and 45823...

rem Kill every listener on the dedicated TrialIQ ports, including its full child tree.
rem 3000 is the TrialIQ Next.js site; 45822/45823 are the local-agent proxy/core.
rem Do not use $pid in PowerShell: PID is a built-in read-only variable.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(3000,45822,45823); foreach($port in $ports){$connections=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue; foreach($connection in $connections){$processId=[int]$connection.OwningProcess; Write-Host ('[TrialIQ] Port ' + $port + ' -> stopping PID ' + $processId); taskkill.exe /PID $processId /T /F 2>$null | Out-Null}}"

rem Also remove stale TrialIQ Node processes that may no longer own a socket but can
rem restart/rebind a port later. Scope this by the actual project path or TrialIQ agent/runner scripts.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$project='C:\Users\hp\Desktop\trialiq'; $processes=Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -and ($_.CommandLine -like ('*' + $project + '*') -or $_.CommandLine -like '*scripts/local-agent*' -or $_.CommandLine -like '*scripts/test-runner.ts*')}; foreach($process in $processes){$processId=[int]$process.ProcessId; Write-Host ('[TrialIQ] Stopping stale Node PID ' + $processId); taskkill.exe /PID $processId /T /F 2>$null | Out-Null}"

rem Verify all three dedicated ports are genuinely free before starting the agent.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(12); do {$busy=@(3000,45822,45823) | Where-Object {Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $_ -State Listen -ErrorAction SilentlyContinue}; if(-not $busy){exit 0}; Start-Sleep -Milliseconds 300} while((Get-Date) -lt $deadline); Write-Host '[ERROR] TrialIQ ports are still occupied:' -ForegroundColor Red; Get-NetTCPConnection -LocalAddress '127.0.0.1' -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -in @(3000,45822,45823)} | Select-Object LocalPort,OwningProcess | Format-Table -AutoSize; exit 1"
if errorlevel 1 exit /b 1

echo [TrialIQ] Ports 3000, 45822 and 45823 are free.
echo [TrialIQ] Starting Local Agent...
echo.

rem Invoke npm through Node instead of npm.cmd/call so Ctrl+C does not trigger
rem the nested batch-file "Terminate batch job (Y/N)?" prompt.
node "%CD%\node_modules\npm\bin\npm-cli.js" run local:agent
set "AGENT_EXIT=%ERRORLEVEL%"

exit /b %AGENT_EXIT%
