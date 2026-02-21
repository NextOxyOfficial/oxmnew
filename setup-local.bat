@echo off
REM Local Development Environment Setup for OXM Project (Windows)
echo ========================================
echo   OXM Local Environment Setup (Windows)
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the OXM project root directory
    exit /b 1
)

echo [INFO] Setting up local development environment...
echo.

REM ===================================
REM Backend Setup
REM ===================================
echo [STEP 1/5] Setting up backend environment...
cd backend

REM Create .env file for local development
echo [INFO] Creating backend .env file...
(
echo # Django Configuration
echo SECRET_KEY=django-insecure-local-dev-key-12345678901234567890
echo DEBUG=True
echo ALLOWED_HOSTS=localhost,127.0.0.1
echo.
echo # PostgreSQL Database Configuration
echo DB_NAME=oxm_db
echo DB_USER=postgres
echo DB_PASSWORD=postgres
echo DB_HOST=localhost
echo DB_PORT=5432
echo.
echo # CORS Settings
echo CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
echo.
echo # Static and Media Files
echo STATIC_URL=/static/
echo MEDIA_URL=/media/
echo SITE_URL=http://localhost:8000
echo.
echo # Email Configuration
echo EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
) > .env

echo [SUCCESS] Backend .env created
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    echo [SUCCESS] Virtual environment created
) else (
    echo [INFO] Virtual environment already exists
)

echo [INFO] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

echo [SUCCESS] Backend dependencies installed
cd ..

REM ===================================
REM Frontend Setup
REM ===================================
echo.
echo [STEP 2/5] Setting up frontend environment...
cd frontend

REM Create .env.local file
echo [INFO] Creating frontend .env.local file...
(
echo # Local Development Environment
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
) > .env.local

echo [SUCCESS] Frontend .env.local created
echo.

echo [INFO] Installing Node.js dependencies...
call npm install

echo [SUCCESS] Frontend dependencies installed
cd ..

REM ===================================
REM Database Setup
REM ===================================
echo.
echo [STEP 3/5] Setting up database...
echo [INFO] Checking PostgreSQL service...

REM Check if PostgreSQL service is running
sc query postgresql-x64-14 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL service is not running
    echo [INFO] Please start PostgreSQL service manually:
    echo    - Open Services (services.msc^)
    echo    - Find PostgreSQL service
    echo    - Start the service
    echo.
    set /p continue="Press Enter to continue after starting PostgreSQL..."
)

echo [INFO] Creating database and running migrations...
cd backend
call venv\Scripts\activate.bat

REM Run migrations
python manage.py makemigrations
python manage.py migrate

echo [SUCCESS] Database migrations completed
echo.

REM ===================================
REM Create Superuser
REM ===================================
echo [STEP 4/5] Creating superuser...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')"
echo [SUCCESS] Superuser created (username: admin, password: admin123)
echo.

REM ===================================
REM Collect Static Files
REM ===================================
echo [STEP 5/5] Collecting static files...
python manage.py collectstatic --noinput

REM Create media directories
if not exist "media\store_logos" mkdir media\store_logos
if not exist "media\product_images" mkdir media\product_images

echo [SUCCESS] Static files collected
cd ..

REM ===================================
REM Summary
REM ===================================
echo.
echo ========================================
echo [SUCCESS] Local Setup Complete!
echo ========================================
echo.
echo [INFO] Configuration Summary:
echo   Backend .env: backend\.env
echo   Frontend .env.local: frontend\.env.local
echo   Database: oxm_db
echo   Superuser: admin / admin123
echo.
echo [INFO] To start development servers:
echo   1. Backend:  cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo   2. Frontend: cd frontend ^&^& npm run dev
echo.
echo   Or use: start-dev.bat
echo.
echo [INFO] Access your application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000/api/
echo   Django Admin: http://localhost:8000/admin/
echo.
echo [WARNING] Remember to:
echo   - Change admin password in production
echo   - Keep your .env files secure
echo   - Never commit .env files to Git
echo.
pause
