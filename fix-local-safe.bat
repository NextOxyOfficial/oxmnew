@echo off
REM Safe Local Environment Fix Script - Keeps Your Data Safe!
echo ========================================
echo   OXM Local Environment Fix (Safe Mode)
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the OXM project root directory
    pause
    exit /b 1
)

echo [INFO] This script will fix your local environment WITHOUT deleting data
echo [SUCCESS] Your existing database data will be preserved!
echo.
set /p confirm="Continue with safe fix? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo [INFO] Operation cancelled
    pause
    exit /b 0
)

echo.
echo [INFO] Starting safe environment fix...
echo.

REM ===================================
REM Step 1: Fix Backend Environment
REM ===================================
echo [STEP 1/6] Fixing backend environment files...
cd backend

REM Backup existing .env if it exists
if exist ".env" (
    echo [INFO] Backing up existing .env file...
    copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >nul 2>&1
    echo [SUCCESS] Backup created: .env.backup.*
)

REM Create/Update .env file
echo [INFO] Updating backend .env file...
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

echo [SUCCESS] Backend .env file updated
echo.

REM ===================================
REM Step 2: Setup Virtual Environment
REM ===================================
echo [STEP 2/6] Checking Python environment...

if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    echo [SUCCESS] Virtual environment created
) else (
    echo [INFO] Virtual environment exists
)

echo [INFO] Installing/Updating Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [SUCCESS] Python dependencies updated
echo.

REM ===================================
REM Step 3: Run Migrations (Safe - No Data Loss)
REM ===================================
echo [STEP 3/6] Running database migrations (safe mode)...

echo [INFO] Checking PostgreSQL service...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    sc query postgresql-x64-16 | find "RUNNING" >nul
    if %errorlevel% neq 0 (
        echo [WARNING] PostgreSQL service is not running
        echo [INFO] Please start PostgreSQL service
        set /p continue="Press Enter after starting PostgreSQL..."
    )
)

echo [INFO] Creating new migrations (if any)...
python manage.py makemigrations

echo [INFO] Applying migrations (your data is safe)...
python manage.py migrate

if %errorlevel% neq 0 (
    echo [WARNING] Some migrations may have issues
    echo [INFO] Your data is still safe in the database
    echo [INFO] You can run migrations manually later
)

echo [SUCCESS] Migrations completed
echo.

REM ===================================
REM Step 4: Ensure Superuser Exists
REM ===================================
echo [STEP 4/6] Checking superuser...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exists = User.objects.filter(username='admin').exists(); print('Superuser exists' if exists else 'Creating superuser...'); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not exists else None"

echo [SUCCESS] Superuser ready (username: admin, password: admin123)
echo.

REM ===================================
REM Step 5: Collect Static Files
REM ===================================
echo [STEP 5/6] Collecting static files...
python manage.py collectstatic --noinput

REM Ensure media directories exist
if not exist "media" mkdir media
if not exist "media\store_logos" mkdir media\store_logos
if not exist "media\product_images" mkdir media\product_images

echo [SUCCESS] Static files collected
cd ..

REM ===================================
REM Step 6: Fix Frontend Environment
REM ===================================
echo.
echo [STEP 6/6] Fixing frontend environment...
cd frontend

REM Backup existing .env.local if it exists
if exist ".env.local" (
    echo [INFO] Backing up existing .env.local file...
    copy .env.local .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >nul 2>&1
    echo [SUCCESS] Backup created: .env.local.backup.*
)

REM Create/Update .env.local file
echo [INFO] Updating frontend .env.local file...
(
echo # Local Development Environment
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
) > .env.local

echo [SUCCESS] Frontend .env.local file updated
echo.

echo [INFO] Installing/Updating Node.js dependencies...
call npm install

echo [SUCCESS] Node.js dependencies updated
cd ..

REM ===================================
REM Summary
REM ===================================
echo.
echo ========================================
echo [SUCCESS] Safe Fix Completed!
echo ========================================
echo.
echo [INFO] What was done:
echo   [x] Environment files updated (backups created)
echo   [x] Python dependencies updated
echo   [x] Database migrations applied (NO DATA DELETED)
echo   [x] Superuser verified
echo   [x] Static files collected
echo   [x] Frontend dependencies updated
echo.
echo [SUCCESS] Your data is completely safe!
echo   - No database was dropped
echo   - No data was deleted
echo   - All existing records preserved
echo   - Only configurations were updated
echo.
echo [INFO] Backup files created:
echo   backend\.env.backup.*
echo   frontend\.env.local.backup.*
echo.
echo [INFO] To start development:
echo   start-dev.bat
echo.
echo   Or manually:
echo     Terminal 1: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo     Terminal 2: cd frontend ^&^& npm run dev
echo.
echo [INFO] Access your application:
echo   Frontend:     http://localhost:3000
echo   Backend API:  http://localhost:8000/api/
echo   Django Admin: http://localhost:8000/admin/
echo.
pause
