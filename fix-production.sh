#!/bin/bash

# Complete Production Fix Script
# This ensures production environment matches local exactly

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }

echo "============================================"
echo "  OXM Complete Production Fix Tool"
echo "============================================"
echo ""

# Check directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Run from project root directory"
    exit 1
fi

# Get production server details
read -p "Enter production server IP/domain (default: 72.61.114.111): " PROD_HOST
PROD_HOST=${PROD_HOST:-72.61.114.111}

print_info "Production Host: $PROD_HOST"
echo ""

# Step 1: Fix Backend Environment
print_status "Step 1/8: Fixing backend environment..."
cd backend

# Ensure virtual environment exists
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Update .env file
print_info "Updating backend .env file..."
cat > .env << EOF
# Django Configuration
SECRET_KEY=django-insecure-prod-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-50)
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,$PROD_HOST,oxymanager.com,www.oxymanager.com

# Database Configuration
DB_NAME=oxm_production
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=http://$PROD_HOST,http://$PROD_HOST:3000,https://$PROD_HOST,http://localhost:3000

# URLs
SITE_URL=http://$PROD_HOST
STATIC_URL=/static/
MEDIA_URL=/media/

# Security (adjust for HTTPS if needed)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
EOF

print_status "Backend .env updated"

# Step 2: Install/Update Python Dependencies
print_status "Step 2/8: Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Step 3: Fix Database
print_status "Step 3/8: Fixing database..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    print_info "Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Recreate database
print_warning "Recreating production database..."
sudo -u postgres psql << EOSQL
DROP DATABASE IF EXISTS oxm_production;
CREATE DATABASE oxm_production;
GRANT ALL PRIVILEGES ON DATABASE oxm_production TO postgres;
ALTER USER postgres WITH PASSWORD 'postgres';
EOSQL

print_status "Database recreated"

# Step 4: Run Migrations
print_status "Step 4/8: Running migrations..."

# Remove old migration files if causing issues
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete 2>/dev/null || true
find . -path "*/migrations/*.pyc" -delete 2>/dev/null || true

# Create fresh migrations
python manage.py makemigrations core
python manage.py makemigrations customers
python manage.py makemigrations suppliers
python manage.py makemigrations products
python manage.py makemigrations banking
python manage.py makemigrations

# Apply all migrations
python manage.py migrate --noinput

print_status "Migrations completed"

# Step 5: Create Superuser
print_status "Step 5/8: Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

# Step 6: Collect Static Files
print_status "Step 6/8: Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create media directories
mkdir -p media/store_logos media/product_images
chmod -R 775 media staticfiles 2>/dev/null || true

cd ..

# Step 7: Fix Frontend
print_status "Step 7/8: Fixing frontend..."
cd frontend

# Update .env.production
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://$PROD_HOST:8000/api
NEXT_PUBLIC_BACKEND_URL=http://$PROD_HOST:8000
EOF

# Update .env.local for development
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF

print_status "Frontend environment updated"

# Install dependencies
print_info "Installing Node.js dependencies..."
npm install

# Build for production
print_info "Building frontend..."
npm run build

cd ..

# Step 8: Setup PM2 and Services
print_status "Step 8/8: Setting up services..."

# Install PM2 if not available
if ! command -v pm2 >/dev/null 2>&1; then
    print_info "Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start backend with PM2
print_info "Starting backend with PM2..."
cd backend
pm2 start "source venv/bin/activate && python manage.py runserver 0.0.0.0:8000" \
    --name "oxm-backend" \
    --interpreter bash

cd ../frontend
# Start frontend with PM2
print_info "Starting frontend with PM2..."
pm2 start npm --name "oxm-frontend" -- start

cd ..

# Save PM2 configuration
pm2 save
pm2 startup | tail -n 1 | sudo bash 2>/dev/null || true

print_status "Services started with PM2"

# Configure Nginx if available
if command -v nginx >/dev/null 2>&1; then
    print_info "Configuring Nginx..."
    
    sudo tee /etc/nginx/sites-available/oxm << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://localhost:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files
    location /static/ {
        alias /var/www/oxmnew/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/oxmnew/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

    sudo ln -sf /etc/nginx/sites-available/oxm /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx
    print_status "Nginx configured and restarted"
fi

# Set permissions
print_info "Setting file permissions..."
sudo chown -R $USER:www-data . 2>/dev/null || chown -R $USER:$USER .
chmod -R 755 .
chmod -R 775 backend/media backend/staticfiles 2>/dev/null || true

# Health check
print_status "Performing health check..."
sleep 5

echo ""
echo "============================================"
print_status "Production Fix Completed!"
echo "============================================"
echo ""
print_info "Services Status:"
pm2 status
echo ""
print_info "Access your application:"
print_info "  Frontend: http://$PROD_HOST"
print_info "  Backend API: http://$PROD_HOST/api/"
print_info "  Django Admin: http://$PROD_HOST/admin/"
print_info "  Admin Login: admin / admin123"
echo ""
print_info "Useful Commands:"
print_info "  View logs: pm2 logs"
print_info "  Restart: pm2 restart all"
print_info "  Stop: pm2 stop all"
print_info "  Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
print_warning "Next Steps:"
print_warning "  1. Test all functionality"
print_warning "  2. Change admin password"
print_warning "  3. Load your data if needed"
print_warning "  4. Configure firewall if needed"
echo ""
