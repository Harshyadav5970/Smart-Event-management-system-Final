@echo off
echo ========================================================
echo   EventHub - Smart College Event & Fest Management System
echo   Author: Harsh Yadav (Roll No: 129, TYCS-B)
echo   Project Guide: Faculty Coordinator
echo ========================================================
echo.
set PATH=%PATH%;C:\Program Files\nodejs
echo [1/2] Installing backend dependencies if needed...
cd /d "%~dp0backend"
if not exist "node_modules" (
  call npm install
)
echo.
echo [2/2] Launching EventHub Backend Server on port 5000...
start "" http://localhost:5000
node server.js
pause
