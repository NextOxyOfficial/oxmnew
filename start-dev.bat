@echo off
echo Starting Full Stack Development Environment...
echo.

echo This will start both Django backend and Next.js frontend
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.

echo Starting backend in new window...
start "Django Backend" cmd /k "%~dp0start-backend.bat"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting frontend in new window...
start "Next.js Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Both services are starting in separate windows.
echo Check the new command windows for status.
echo.
echo Quick Links:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000/api
echo - Admin Panel: http://localhost:8000/admin
echo.

pause
