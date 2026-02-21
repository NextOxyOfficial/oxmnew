#!/bin/bash

# OXM Project Production Deployment Script
echo "🚀 Deploying OXM Project to Production..."

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the OXM project root directory"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Some commands may need adjustment."
fi

# Pull latest changes
print_status "Pulling latest changes from Git..."
git fetch origin
git pull origin main

# Update backend
print_status "Updating backend..."
cd backend

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    print_error "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Install/update Python dependencies
print_status "Installing/updating Python dependencies..."
pip install -r requirements.txt

# Django operations
print_status "Running Django migrations and collecting static files..."
python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate

cd ..

# Update frontend
print_status "Updating frontend..."
cd frontend

# Install/update Node.js dependencies
print_status "Installing/updating Node.js dependencies..."
npm install

# Build frontend
print_status "Building frontend for production..."
npm run build

cd ..

# Check if PM2 is installed and running
if command -v pm2 >/dev/null 2>&1; then
    print_status "Restarting PM2 applications..."
    pm2 restart all
    pm2 save
else
    print_warning "PM2 not found. Please install PM2 or start applications manually."
fi

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    print_status "Reloading Nginx configuration..."
    sudo nginx -t && sudo systemctl reload nginx
else
    print_warning "Nginx is not running. Please start Nginx manually."
fi

# Set proper permissions
print_status "Setting proper file permissions..."
if [ -w "/var/www/oxmnew" ]; then
    sudo chown -R $USER:www-data /var/www/oxmnew 2>/dev/null || chown -R $USER:$USER /var/www/oxmnew
    chmod -R 755 /var/www/oxmnew
    chmod -R 775 /var/www/oxmnew/backend/media 2>/dev/null || true
    chmod -R 775 /var/www/oxmnew/backend/staticfiles 2>/dev/null || true
fi

# Health check
print_status "Performing health check..."
sleep 5

# Check if services are running
if command -v pm2 >/dev/null 2>&1; then
    PM2_STATUS=$(pm2 list | grep "online" | wc -l)
    if [ $PM2_STATUS -gt 0 ]; then
        print_status "✅ PM2 applications are running"
    else
        print_warning "⚠️  Some PM2 applications may not be running properly"
        pm2 status
    fi
fi

# Check if ports are listening
if netstat -tuln | grep -q ":8000 "; then
    print_status "✅ Backend is listening on port 8000"
else
    print_warning "⚠️  Backend may not be running on port 8000"
fi

if netstat -tuln | grep -q ":3000 "; then
    print_status "✅ Frontend is listening on port 3000"
else
    print_warning "⚠️  Frontend may not be running on port 3000"
fi

if netstat -tuln | grep -q ":80 "; then
    print_status "✅ Nginx is listening on port 80"
else
    print_warning "⚠️  Nginx may not be running on port 80"
fi

print_status ""
print_status "🎉 Deployment complete!"
print_status ""
print_status "🌐 Your application should be available at:"
print_status "   Frontend: http://72.61.114.111"
print_status "   Backend API: http://72.61.114.111/api/"
print_status "   Django Admin: http://72.61.114.111/admin/"
print_status ""
print_status "📊 To check status:"
print_status "   pm2 status"
print_status "   sudo systemctl status nginx"
print_status "   sudo systemctl status postgresql"
print_status ""
print_status "📝 To view logs:"
print_status "   pm2 logs"
print_status "   sudo tail -f /var/log/nginx/error.log"
