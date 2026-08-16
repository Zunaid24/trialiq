@echo off
setlocal

title Install TrialIQ Agent Protocol
cd /d "%~dp0"

echo.
echo ========================================
echo   TrialIQ Agent Protocol Installer
echo ========================================
echo.

if not exist "%~dp0TrialIQ-Agent.cmd" (
    echo [ERROR] TrialIQ-Agent.cmd was not found next to this installer.
    echo.
    pause
    exit /b 1
)

set "HANDLER=%~dp0TrialIQ-Agent-Protocol.cmd"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$base='HKCU:\Software\Classes\trialiq'; $handler=[Environment]::GetEnvironmentVariable('HANDLER'); New-Item -Path $base -Force | Out-Null; Set-ItemProperty -Path $base -Name '(default)' -Value 'URL:TrialIQ Local Agent'; New-ItemProperty -Path $base -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null; $shell=Join-Path $base 'shell\open\command'; New-Item -Path $shell -Force | Out-Null; Set-ItemProperty -Path $shell -Name '(default)' -Value ('"' + $handler + '" "%%1"')"

if errorlevel 1 (
    echo.
    echo [ERROR] Could not register the TrialIQ protocol.
    echo Run this file again as your normal Windows user.
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] TrialIQ:// protocol registered for this Windows user.
echo.
echo You can now use the Start Agent button in the deployed TrialIQ suite.
echo.
pause
