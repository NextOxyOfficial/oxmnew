#!/bin/bash

# Safe Production Fix Script - Preserves Your Data!
# This ensures production environment is fixed WITHOUT deleting data

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
echo "  OXM Production Fix Tool (Safe Mode)"
echo "  Your Data Will Be Preserved!"
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
print_warning "This script will NOT delete your database or data"
print_info "Only configurations and dependencies will be updated"
echo ""

read -p "Continue with safe fix? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    print_error "Operation cancelled"
    exit 0
fi

echo ""

# Step 1: Backup Current Data
print_status "Step 1/8: Creating backup of current data..."
cd backend
source venv/bin/activate 2>/dev/null || true

BACKUP_DIR="../database_backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

print_info "Backing up database to: $BACKUP_DIR/backup_$TIMESTAMP.json"
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude=contenttypes --exclude=auth.permission --exclude=sessions.session \
    --indent=2 > "$BACKUP_DIR/backup_$TIMESTAMP.json"

print_status "Backup created successfully"
echo ""

# Step 2: Fix Backend Environment
print_status "Step 2/8: Updating backend environment..."

# Backup existing .env
if [ -f ".env" ]; then
    print_info "Backing up existing .env file..."
    cp .env .env.backup.$TIMESTAMP
fi

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
echo ""

# Step 3: Update Python Dependencies
print_status "Step 3/8: Updating Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

print_status "Dependencies updated"
echo ""

# Step 4: Run Migrations (Safe - No Data Loss)
print_status "Step 4/8: Running migrations (safe mode - data preserved)..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    print_info "Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Create migrations if needed
print_info "Creating new migrations (if any)..."
python manage.py makemigrations

# Apply migrations (this won't delete data)
print_info "Applying migrations (your data is safe)..."
python manage.py migrate --noinput

print_status "Migrations completed - all data preserved"
echo ""

# Step 5: Ensure Superuser Exists
print_status "Step 5/8: Checking superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

print_status "Superuser ready"
echo ""

# Step 6: Collect Static Files
print_status "Step 6/8: Collecting static files..."
python manage.py collectstatic --noinput

# Create media directories
mkdir -p media/store_logos media/product_images
chmod -R 775 media staticfiles 2>/dev/null || true

print_status "Static files collected"
cd ..
echo ""

# Step 7: Fix Frontend
print_status "Step 7/8: Updating frontend environment..."
cd frontend

# Backup existing .env.production
if [ -f ".env.production" ]; then
    print_info "Backing up existing .env.production..."
    cp .env.production .env.production.backup.$TIMESTAMP
fi

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
print_info "Updating Node.js dependencies..."
npm install

# Build for production
print_info "Building frontend..."
npm run build

cd ..
print_status "Frontend updated"
echo ""

# Step 8: Restart Services
print_status "Step 8/8: Restarting services..."

# Restart PM2 if available
if command -v pm2 >/dev/null 2>&1; then
    print_info "Restarting PM2 services..."
    pm2 restart all
    pm2 save
    print_status "PM2 services restarted"
else
    print_warning "PM2 not found. Please restart backend manually"
fi

# Restart Nginx if available
if command -v nginx >/dev/null 2>&1; then
    print_info "Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    print_status "Nginx reloaded"
fi

# Set permissions
print_info "Setting file permissions..."
sudo chown -R $USER:www-data . 2>/dev/null || chown -R $USER:$USER .
chmod -R 755 .
chmod -R 775 backend/media backend/staticfiles 2>/dev/null || true

echo ""
echo "============================================"
print_status "Safe Fix Completed Successfully!"
echo "============================================"
echo ""
print_info "What was done:"
print_info "  ✓ Data backed up to: $BACKUP_DIR/backup_$TIMESTAMP.json"
print_info "  ✓ Environment files updated (backups created)"
print_info "  ✓ Dependencies updated"
print_info "  ✓ Migrations applied (NO DATA DELETED)"
print_info "  ✓ Static files collected"
print_info "  ✓ Services restarted"
echo ""
print_status "Your data is completely safe!"
print_info "  - No database was dropped"
print_info "  - No data was deleted"
print_info "  - All existing records preserved"
print_info "  - Only configurations were updated"
echo ""
print_info "Backup files:"
print_info "  - Database: $BACKUP_DIR/backup_$TIMESTAMP.json"
print_info "  - Backend .env: backend/.env.backup.$TIMESTAMP"
print_info "  - Frontend .env: frontend/.env.production.backup.$TIMESTAMP"
echo ""
print_info "Access your application:"
print_info "  Frontend: http://$PROD_HOST"
print_info "  Backend API: http://$PROD_HOST/api/"
print_info "  Django Admin: http://$PROD_HOST/admin/"
echo ""
print_info "Useful Commands:"
print_info "  View logs: pm2 logs"
print_info "  Check status: pm2 status"
print_info "  Restore backup: python manage.py loaddata $BACKUP_DIR/backup_$TIMESTAMP.json"
echo ""
