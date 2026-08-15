@echo off
setlocal
cd /d "%~dp0.."
if not exist "node_modules\.bin\tsx.cmd" (
  echo TrialIQ dependencies are not installed.
  echo Run npm install once in the TrialIQ project.
  pause
  exit /b 1
)
start "TrialIQ Local Agent" /min cmd /c "npm run local:agent"
exit /b 0
