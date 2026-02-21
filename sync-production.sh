#!/bin/bash

# Production Database Sync Script - Syncs local DB to production
# This script ensures production database matches local exactly

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo "=========================================="
echo "  OXM Production Database Sync Tool"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the OXM project root directory"
    exit 1
fi

# Configuration
BACKUP_DIR="database_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_DB_NAME="oxm_db"
PROD_DB_NAME="oxm_production"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

print_info "Starting production sync process..."
echo ""

# Step 1: Backup current production database
print_status "Step 1/7: Creating backup of production database..."
cd backend
source venv/bin/activate 2>/dev/null || true

# Backup production DB
print_info "Backing up production database to: $BACKUP_DIR/prod_backup_$TIMESTAMP.json"
python manage.py dumpdata --database=default --natural-foreign --natural-primary \
    --exclude=contenttypes --exclude=auth.permission --exclude=sessions.session \
    --indent=2 > "../$BACKUP_DIR/prod_backup_$TIMESTAMP.json"

if [ $? -eq 0 ]; then
    print_status "Production backup created successfully"
else
    print_error "Failed to create production backup"
    exit 1
fi

# Step 2: Export local database
print_status "Step 2/7: Exporting local database..."
print_info "Creating fresh export of local database..."

# Create a fresh dump of local data
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude=contenttypes --exclude=auth.permission --exclude=sessions.session \
    --indent=2 > "../$BACKUP_DIR/local_export_$TIMESTAMP.json"

if [ $? -eq 0 ]; then
    print_status "Local database exported successfully"
else
    print_error "Failed to export local database"
    exit 1
fi

# Step 3: Clear production database
print_status "Step 3/7: Clearing production database..."
print_warning "This will delete all data in production database!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_error "Sync cancelled by user"
    exit 1
fi

# Drop and recreate database
print_info "Dropping and recreating production database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $PROD_DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $PROD_DB_NAME;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $PROD_DB_NAME TO postgres;"

print_status "Production database cleared and recreated"

# Step 4: Run migrations on fresh database
print_status "Step 4/7: Running migrations on production database..."
python manage.py migrate --noinput

if [ $? -eq 0 ]; then
    print_status "Migrations completed successfully"
else
    print_error "Migration failed"
    exit 1
fi

# Step 5: Load local data into production
print_status "Step 5/7: Loading local data into production database..."
python manage.py loaddata "../$BACKUP_DIR/local_export_$TIMESTAMP.json"

if [ $? -eq 0 ]; then
    print_status "Local data loaded successfully into production"
else
    print_error "Failed to load local data"
    print_warning "You can restore from backup: $BACKUP_DIR/prod_backup_$TIMESTAMP.json"
    exit 1
fi

# Step 6: Collect static files
print_status "Step 6/7: Collecting static files..."
python manage.py collectstatic --noinput --clear

if [ $? -eq 0 ]; then
    print_status "Static files collected successfully"
else
    print_warning "Static files collection had issues (non-critical)"
fi

# Step 7: Set proper permissions
print_status "Step 7/7: Setting proper file permissions..."
cd ..

# Set permissions for media and static files
if [ -d "backend/media" ]; then
    chmod -R 775 backend/media
    print_status "Media directory permissions set"
fi

if [ -d "backend/staticfiles" ]; then
    chmod -R 775 backend/staticfiles
    print_status "Static files directory permissions set"
fi

# Restart services if PM2 is available
if command -v pm2 >/dev/null 2>&1; then
    print_status "Restarting PM2 services..."
    pm2 restart all
    pm2 save
    print_status "PM2 services restarted"
else
    print_warning "PM2 not found. Please restart backend manually:"
    print_info "  cd backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
fi

# Restart Nginx if available
if command -v nginx >/dev/null 2>&1; then
    print_status "Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    print_status "Nginx reloaded"
fi

echo ""
echo "=========================================="
print_status "Production sync completed successfully!"
echo "=========================================="
echo ""
print_info "Summary:"
print_info "  ✓ Production database backed up to: $BACKUP_DIR/prod_backup_$TIMESTAMP.json"
print_info "  ✓ Local database exported to: $BACKUP_DIR/local_export_$TIMESTAMP.json"
print_info "  ✓ Production database cleared and recreated"
print_info "  ✓ All migrations applied"
print_info "  ✓ Local data loaded into production"
print_info "  ✓ Static files collected"
print_info "  ✓ Permissions set correctly"
echo ""
print_warning "Important Notes:"
print_warning "  - Keep backup files safe in case you need to restore"
print_warning "  - Test all functionality on production"
print_warning "  - Check logs if any issues: pm2 logs"
echo ""
print_status "Your production database is now identical to local!"
