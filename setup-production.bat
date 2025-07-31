@echo off
REM Production Environment Setup for OXM Project
echo 🔧 Setting up production environment for OXM Project...

REM Check if we're in the right directory
if not exist "README.md" (
    echo ❌ Please run this script from the OXM project root directory
    exit /b 1
)
if not exist "backend" (
    echo ❌ Please run this script from the OXM project root directory
    exit /b 1
)
if not exist "frontend" (
    echo ❌ Please run this script from the OXM project root directory
    exit /b 1
)

REM Get production server IP/domain
set /p PRODUCTION_HOST="Enter your production server IP/domain (default: 168.231.119.200): "
if "%PRODUCTION_HOST%"=="" set PRODUCTION_HOST=168.231.119.200

set /p BACKEND_PORT="Enter your backend port (default: 8000): "
if "%BACKEND_PORT%"=="" set BACKEND_PORT=8000

set /p FRONTEND_PORT="Enter your frontend port (default: 3000): "
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=3000

echo [INFO] Setting up environment files...

REM Create backend .env file
(
echo # Django Configuration
echo SECRET_KEY=your-production-secret-key-%RANDOM%
echo DEBUG=False
echo ALLOWED_HOSTS=localhost,127.0.0.1,%PRODUCTION_HOST%
echo.
echo # PostgreSQL Database Configuration
echo DB_NAME=oxm_production
echo DB_USER=postgres
echo DB_PASSWORD=your_postgres_password
echo DB_HOST=localhost
echo DB_PORT=5432
echo.
echo # CORS Settings
echo CORS_ALLOWED_ORIGINS=http://%PRODUCTION_HOST%,http://%PRODUCTION_HOST%:%FRONTEND_PORT%,https://%PRODUCTION_HOST%
echo.
echo # Static and Media Files
echo STATIC_URL=/static/
echo MEDIA_URL=/media/
echo SITE_URL=http://%PRODUCTION_HOST%:%BACKEND_PORT%
echo.
echo # Production Settings
echo SECURE_SSL_REDIRECT=False
echo SESSION_COOKIE_SECURE=False
echo CSRF_COOKIE_SECURE=False
) > backend\.env

REM Create frontend .env.production file
(
echo # Production environment
echo NEXT_PUBLIC_API_URL=http://%PRODUCTION_HOST%:%BACKEND_PORT%/api
echo NEXT_PUBLIC_BACKEND_URL=http://%PRODUCTION_HOST%:%BACKEND_PORT%
) > frontend\.env.production

REM Create frontend .env.local file for development
(
echo # Development environment
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
) > frontend\.env.local

echo [INFO] ✅ Environment files created successfully!
echo.
echo [INFO] 📝 Files created:
echo [INFO]    backend\.env
echo [INFO]    frontend\.env.production
echo [INFO]    frontend\.env.local
echo.
echo [WARNING] ⚠️  Important: Update the following in backend\.env:
echo [WARNING]    - SECRET_KEY: Generate a secure secret key
echo [WARNING]    - DB_PASSWORD: Set your PostgreSQL password
echo [WARNING]    - Other database settings as needed
echo.
echo [INFO] 🚀 Ready for deployment!
echo [INFO]    Run deploy.bat to deploy to production

pause
