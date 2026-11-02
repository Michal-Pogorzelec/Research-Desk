@echo off
rem Research Desk: starts the local server (data in the db folder) and opens the app in the browser.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
title Research Desk
rem Repacks src\ into "Research Desk offline.html", so the single file always matches the sources.
node build.js
if errorlevel 1 (
  pause
  exit /b 1
)
node server.js --open
pause
