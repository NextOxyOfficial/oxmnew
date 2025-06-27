@echo off
echo Starting Django Backend...
cd /d "%~dp0backend"

echo.
echo Checking if virtual environment exists...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Running migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo Starting Django development server...
echo Backend will be available at: http://localhost:8000
echo Admin panel will be available at: http://localhost:8000/admin
echo API will be available at: http://localhost:8000/api
echo.
python manage.py runserver

pause
