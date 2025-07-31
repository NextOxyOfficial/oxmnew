#!/bin/bash

# OXM Image Configuration Diagnosis Script
echo "🔍 Diagnosing OXM Image Configuration..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "ℹ️  $1"
}

echo ""
echo "1. Checking project structure..."
if [ -d "backend" ] && [ -d "frontend" ]; then
    print_success "Project structure is correct"
else
    print_error "Project structure is incorrect - missing backend or frontend directories"
    exit 1
fi

echo ""
echo "2. Checking environment files..."

# Check backend .env
if [ -f "backend/.env" ]; then
    print_success "Backend .env file exists"
    
    if grep -q "SITE_URL" backend/.env; then
        SITE_URL=$(grep "SITE_URL" backend/.env | cut -d'=' -f2)
        print_info "SITE_URL: $SITE_URL"
    else
        print_warning "SITE_URL not configured in backend/.env"
    fi
else
    print_error "Backend .env file missing"
fi

# Check frontend environment files
if [ -f "frontend/.env.production" ]; then
    print_success "Frontend .env.production file exists"
    
    if grep -q "NEXT_PUBLIC_BACKEND_URL" frontend/.env.production; then
        BACKEND_URL=$(grep "NEXT_PUBLIC_BACKEND_URL" frontend/.env.production | cut -d'=' -f2)
        print_info "NEXT_PUBLIC_BACKEND_URL: $BACKEND_URL"
    fi
else
    print_warning "Frontend .env.production file missing"
fi

if [ -f "frontend/.env.local" ]; then
    print_success "Frontend .env.local file exists"
else
    print_warning "Frontend .env.local file missing"
fi

echo ""
echo "3. Checking media directory..."
if [ -d "backend/media" ]; then
    print_success "Media directory exists"
    
    # Check permissions
    MEDIA_PERMS=$(stat -c "%a" backend/media 2>/dev/null || stat -f "%A" backend/media 2>/dev/null)
    if [ ! -z "$MEDIA_PERMS" ]; then
        print_info "Media directory permissions: $MEDIA_PERMS"
        
        if [ "$MEDIA_PERMS" -ge "755" ]; then
            print_success "Media directory permissions are sufficient"
        else
            print_warning "Media directory permissions may be too restrictive"
            echo "  Run: chmod -R 755 backend/media"
        fi
    fi
    
    # Check for uploaded files
    if [ "$(find backend/media -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -o -name "*.webp" | wc -l)" -gt 0 ]; then
        print_success "Found uploaded image files"
        print_info "Sample files:"
        find backend/media -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -o -name "*.webp" | head -3 | while read file; do
            echo "    $file"
        done
    else
        print_warning "No image files found in media directory"
    fi
else
    print_error "Media directory does not exist"
    echo "  Run: mkdir -p backend/media"
fi

echo ""
echo "4. Checking Django settings..."
if [ -f "backend/backend/settings.py" ]; then
    if grep -q "MEDIA_URL.*=.*\"/media/\"" backend/backend/settings.py; then
        print_success "MEDIA_URL is configured correctly"
    else
        print_warning "MEDIA_URL configuration may be incorrect"
    fi
    
    if grep -q "MEDIA_ROOT.*=.*media" backend/backend/settings.py; then
        print_success "MEDIA_ROOT is configured"
    else
        print_warning "MEDIA_ROOT configuration may be missing"
    fi
fi

echo ""
echo "5. Checking Next.js configuration..."
if [ -f "frontend/next.config.ts" ] || [ -f "frontend/next.config.js" ]; then
    if grep -q "domains.*168.231.119.200" frontend/next.config.* 2>/dev/null; then
        print_success "Next.js image domains include production server"
    else
        print_warning "Production server not in Next.js image domains"
    fi
    
    if grep -q "unoptimized.*true" frontend/next.config.* 2>/dev/null; then
        print_success "Image optimization is disabled (good for debugging)"
    else
        print_info "Image optimization is enabled"
    fi
fi

echo ""
echo "6. Checking running services..."

# Check if Django is running
if pgrep -f "manage.py runserver" > /dev/null || pgrep -f "gunicorn" > /dev/null; then
    print_success "Django backend appears to be running"
else
    print_warning "Django backend doesn't appear to be running"
fi

# Check if Next.js is running
if pgrep -f "next" > /dev/null || pgrep -f "node.*3000" > /dev/null; then
    print_success "Next.js frontend appears to be running"
else
    print_warning "Next.js frontend doesn't appear to be running"
fi

# Check if nginx is running
if pgrep nginx > /dev/null; then
    print_success "Nginx is running"
else
    print_warning "Nginx is not running"
fi

echo ""
echo "7. Testing connectivity..."

# Test backend port
if command -v curl >/dev/null 2>&1; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health/ | grep -q "200"; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API is not responding on localhost:8000"
    fi
    
    # Test frontend port
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend is not responding on localhost:3000"
    fi
fi

echo ""
echo "========================================"
echo "🏁 Diagnosis complete!"
echo ""
echo "📋 Next steps if issues found:"
echo "1. Run ./setup-production.sh to configure environment"
echo "2. Check file permissions: chmod -R 755 backend/media"
echo "3. Restart services: pm2 restart all && sudo systemctl restart nginx"
echo "4. Check logs: pm2 logs"
echo ""
echo "📚 For detailed troubleshooting, see IMAGE_TROUBLESHOOTING.md"
