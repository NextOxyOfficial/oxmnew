@echo off
echo Starting Next.js Frontend...
cd /d "%~dp0frontend"

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting Next.js development server...
echo Frontend will be available at: http://localhost:3000
echo.
call npm run dev

pause
