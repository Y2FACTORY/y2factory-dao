@echo off
chcp 65001 > nul
echo ====================================
echo   Y2FACTORY DAO - Starting...
echo ====================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server...
echo Access http://localhost:3000
echo.

start "" http://localhost:3000
call npm run dev
