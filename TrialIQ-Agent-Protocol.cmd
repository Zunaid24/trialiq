@echo off
setlocal

rem Browser custom-protocol handler for trialiq://start-agent
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; try { $r=Invoke-RestMethod -Uri 'http://127.0.0.1:45822/health' -TimeoutSec 2; $ok=($r.ok -eq $true -and $r.agent -eq 'online') } catch {}; if (-not $ok) { Start-Process -FilePath '%~dp0TrialIQ-Agent.cmd' -WorkingDirectory '%~dp0' };"

exit /b 0
