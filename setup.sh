#!/bin/bash

# OXM Project Development Setup Script
# This script sets up the development environment for both local and server environments

set -e

echo "🚀 Setting up OXM Project Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect if running on server or local
if [ -f "/etc/os-release" ]; then
    . /etc/os-release
    if [ "$ID" = "ubuntu" ] || [ "$ID" = "debian" ]; then
        ENVIRONMENT="server"
    else
        ENVIRONMENT="local"
    fi
else
    ENVIRONMENT="local"
fi

print_status "Detected environment: $ENVIRONMENT"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the OXM project root directory"
    exit 1
fi

# Backend Setup
print_status "Setting up Backend..."

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install backend dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    print_status "Creating backend environment file..."
    if [ "$ENVIRONMENT" = "server" ]; then
        cat > .env << EOF
SECRET_KEY=oxm-super-secure-secret-key-2025-change-this-in-production-12345678901234567890
DEBUG=False
ALLOWED_HOSTS=168.231.119.200,localhost,127.0.0.1

DB_NAME=oxm_user
DB_USER=postgres
DB_PASSWORD=pgPass7431
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://168.231.119.200:3000,http://168.231.119.200,https://168.231.119.200
STATIC_URL=/static/
MEDIA_URL=/media/

SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
EOF
    else
        cp .env.template .env
        print_warning "Please update backend/.env with your local database credentials"
    fi
else
    print_warning "Backend .env file already exists, skipping creation"
fi

cd ..

# Frontend Setup
print_status "Setting up Frontend..."

cd frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Setup environment file
if [ ! -f ".env.local" ]; then
    print_status "Creating frontend environment file..."
    if [ "$ENVIRONMENT" = "server" ]; then
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://168.231.119.200/api
NEXT_PUBLIC_MEDIA_URL=http://168.231.119.200/media
EOF
    else
        cp .env.template .env.local
    fi
else
    print_warning "Frontend .env.local file already exists, skipping creation"
fi

cd ..

# Create development scripts
print_status "Creating development scripts..."

# Development start script
cat > dev-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting OXM Development Environment..."

# Start backend in background
echo "Starting Django backend..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Start frontend in background
echo "Starting Next.js frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Development servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for Ctrl+C
trap 'echo "Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
EOF

chmod +x dev-start.sh

# Production deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying OXM Project to Production..."

# Pull latest changes
git pull origin main

# Update backend
echo "Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate
cd ..

# Update frontend
echo "Updating frontend..."
cd frontend
npm install
npm run build
cd ..

# Restart PM2 processes
echo "Restarting application..."
pm2 restart all

echo "✅ Deployment complete!"
echo "Your application is running at: http://168.231.119.200"
EOF

chmod +x deploy.sh

# Git hooks setup
print_status "Setting up Git hooks..."
mkdir -p .git/hooks

# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Check for environment files
if git diff --cached --name-only | grep -E "\.(env|env\.local|env\.production)$"; then
    echo "❌ Environment files should not be committed!"
    echo "Please remove environment files from staging:"
    echo "git reset HEAD backend/.env frontend/.env.local"
    exit 1
fi

# Check for Python syntax
if git diff --cached --name-only | grep "\.py$" | wc -l > 0; then
    echo "Checking Python syntax..."
    cd backend
    if [ -d "venv" ]; then
        source venv/bin/activate
        python -m py_compile $(git diff --cached --name-only --diff-filter=ACM | grep "\.py$") || exit 1
    fi
    cd ..
fi

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .git/hooks/pre-commit

# Create README for deployment
cat > DEPLOYMENT.md << 'EOF'
# OXM Project Deployment Guide

## Quick Start

### Local Development
```bash
# Setup environment
./dev-start.sh

# Or manually:
# Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Server Deployment
```bash
# Initial setup (run once)
./setup.sh

# Deploy updates
./deploy.sh

# Check status
pm2 status
sudo systemctl status nginx
```

## Environment Configuration

### Local Development
- Copy `backend/.env.template` to `backend/.env`
- Copy `frontend/.env.template` to `frontend/.env.local`
- Update with your local database credentials

### Server Production
- Environment files are automatically created by setup script
- Update server IP in configuration files if needed

## Git Workflow

### From Local to Server
```bash
# Local development
git add .
git commit -m "Your changes"
git push origin main

# On server
git pull origin main
./deploy.sh
```

### Server to Local
```bash
# On server (if changes made directly)
git add .
git commit -m "Server changes"
git push origin main

# On local
git pull origin main
```

## Troubleshooting

### Database Issues
```bash
# Reset database
cd backend
source venv/bin/activate
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
```

### Permission Issues
```bash
sudo chown -R $USER:www-data /var/www/oxmnew
sudo chmod -R 755 /var/www/oxmnew
```

### Service Issues
```bash
# Restart services
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
```
EOF

print_status "✅ Development environment setup complete!"
print_status ""
print_status "Next steps:"
print_status "1. Update environment files with your credentials"
print_status "2. Run './dev-start.sh' to start development servers"
print_status "3. For production deployment, use './deploy.sh'"
print_status ""
print_status "URLs:"
print_status "- Local Frontend: http://localhost:3000"
print_status "- Local Backend: http://localhost:8000"
print_status "- Production: http://168.231.119.200"
