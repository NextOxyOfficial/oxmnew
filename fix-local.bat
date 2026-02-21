@echo off
REM Complete Local Environment Fix Script for OXM Project (Windows)
echo ========================================
echo   OXM Local Environment Fix Tool
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the OXM project root directory
    pause
    exit /b 1
)

echo [INFO] This script will fix your local development environment
echo [WARNING] This will recreate your local database and environment files
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo [INFO] Operation cancelled
    pause
    exit /b 0
)

echo.
echo [INFO] Starting local environment fix...
echo.

REM ===================================
REM Step 1: Fix Backend Environment
REM ===================================
echo [STEP 1/7] Fixing backend environment...
cd backend

REM Backup existing .env if it exists
if exist ".env" (
    echo [INFO] Backing up existing .env file...
    copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >nul 2>&1
)

REM Create fresh .env file
echo [INFO] Creating fresh backend .env file...
(
echo # Django Configuration
echo SECRET_KEY=django-insecure-local-dev-key-12345678901234567890abcdef
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

echo [SUCCESS] Backend .env file created
echo.

REM ===================================
REM Step 2: Setup Virtual Environment
REM ===================================
echo [STEP 2/7] Setting up Python virtual environment...

if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        echo [INFO] Make sure Python 3.8+ is installed
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created
) else (
    echo [INFO] Virtual environment already exists
)

echo [INFO] Installing Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Python dependencies installed
echo.

REM ===================================
REM Step 3: Fix Database
REM ===================================
echo [STEP 3/7] Fixing database...

REM Check PostgreSQL service
echo [INFO] Checking PostgreSQL service...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    sc query postgresql-x64-16 | find "RUNNING" >nul
    if %errorlevel% neq 0 (
        echo [WARNING] PostgreSQL service is not running
        echo [INFO] Attempting to start PostgreSQL...
        net start postgresql-x64-14 >nul 2>&1
        if %errorlevel% neq 0 (
            net start postgresql-x64-16 >nul 2>&1
        )
    )
)

echo [INFO] Recreating database...
REM Drop and recreate database using psql
psql -U postgres -c "DROP DATABASE IF EXISTS oxm_db;" 2>nul
psql -U postgres -c "CREATE DATABASE oxm_db;" 2>nul

if %errorlevel% neq 0 (
    echo [WARNING] Could not recreate database automatically
    echo [INFO] Please run these commands manually in psql:
    echo    DROP DATABASE IF EXISTS oxm_db;
    echo    CREATE DATABASE oxm_db;
    echo.
    set /p continue="Press Enter after running the commands..."
)

echo [SUCCESS] Database recreated
echo.

REM ===================================
REM Step 4: Run Migrations
REM ===================================
echo [STEP 4/7] Running database migrations...

REM Remove old migration files (optional - uncomment if needed)
REM echo [INFO] Cleaning old migrations...
REM for /r %%i in (migrations\*.py) do if not "%%~nxi"=="__init__.py" del "%%i" 2>nul
REM for /r %%i in (migrations\*.pyc) do del "%%i" 2>nul

echo [INFO] Creating migrations...
python manage.py makemigrations

echo [INFO] Applying migrations...
python manage.py migrate

if %errorlevel% neq 0 (
    echo [ERROR] Migration failed
    echo [INFO] Try running migrations manually:
    echo    cd backend
    echo    venv\Scripts\activate
    echo    python manage.py makemigrations
    echo    python manage.py migrate
    pause
    exit /b 1
)

echo [SUCCESS] Migrations completed
echo.

REM ===================================
REM Step 5: Create Superuser
REM ===================================
echo [STEP 5/7] Creating superuser...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123'); print('Superuser: admin/admin123')"

echo [SUCCESS] Superuser ready (username: admin, password: admin123)
echo.

REM ===================================
REM Step 6: Collect Static Files
REM ===================================
echo [STEP 6/7] Collecting static files...
python manage.py collectstatic --noinput --clear

REM Create media directories
if not exist "media" mkdir media
if not exist "media\store_logos" mkdir media\store_logos
if not exist "media\product_images" mkdir media\product_images

echo [SUCCESS] Static files collected
cd ..

REM ===================================
REM Step 7: Fix Frontend Environment
REM ===================================
echo.
echo [STEP 7/7] Fixing frontend environment...
cd frontend

REM Backup existing .env.local if it exists
if exist ".env.local" (
    echo [INFO] Backing up existing .env.local file...
    copy .env.local .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >nul 2>&1
)

REM Create fresh .env.local file
echo [INFO] Creating fresh frontend .env.local file...
(
echo # Local Development Environment
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
) > .env.local

echo [SUCCESS] Frontend .env.local file created
echo.

echo [INFO] Installing Node.js dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies
    echo [INFO] Make sure Node.js 18+ is installed
    pause
    exit /b 1
)

echo [SUCCESS] Node.js dependencies installed
cd ..

REM ===================================
REM Summary
REM ===================================
echo.
echo ========================================
echo [SUCCESS] Local Environment Fixed!
echo ========================================
echo.
echo [INFO] What was done:
echo   [x] Backend .env file created/updated
echo   [x] Python virtual environment setup
echo   [x] Python dependencies installed
echo   [x] Database recreated (oxm_db)
echo   [x] All migrations applied
echo   [x] Superuser created (admin/admin123)
echo   [x] Static files collected
echo   [x] Frontend .env.local created/updated
echo   [x] Node.js dependencies installed
echo.
echo [INFO] Your local environment is now ready!
echo.
echo [INFO] To start development:
echo   Option 1 - Use start-dev.bat (recommended):
echo     start-dev.bat
echo.
echo   Option 2 - Start manually:
echo     Terminal 1: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo     Terminal 2: cd frontend ^&^& npm run dev
echo.
echo [INFO] Access your application:
echo   Frontend:     http://localhost:3000
echo   Backend API:  http://localhost:8000/api/
echo   Django Admin: http://localhost:8000/admin/
echo   Login:        admin / admin123
echo.
echo [INFO] Backup files created:
echo   backend\.env.backup.*
echo   frontend\.env.local.backup.*
echo.
echo [WARNING] Next steps:
echo   1. Test all functionality
echo   2. Load sample data if needed
echo   3. Change admin password for security
echo.
pause
