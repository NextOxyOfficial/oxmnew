#!/bin/bash
# Quick Production Fix - Single Command Solution
# Run this on server: curl -sSL https://raw.githubusercontent.com/... | bash
# Or copy-paste this entire script

echo "🚀 Starting Quick Production Fix..."
echo "📍 Location: $(pwd)"
echo ""

# Navigate to project directory
cd /var/www/oxmnew || { echo "❌ Project directory not found"; exit 1; }

echo "✅ Found project directory"
echo ""

# Backend Fix
echo "🔧 Fixing Backend..."
cd backend

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found"
    exit 1
fi

# Backup data
echo "💾 Creating backup..."
mkdir -p ../backups
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude=contenttypes --exclude=auth.permission \
    --exclude=sessions.session --indent=2 > ../backups/backup_$(date +%Y%m%d_%H%M%S).json 2>/dev/null
echo "✅ Backup created"

# Update dependencies
echo "📦 Updating dependencies..."
pip install -q -r requirements.txt
echo "✅ Dependencies updated"

# Run migrations
echo "🗄️  Running migrations..."
python manage.py makemigrations 2>/dev/null
python manage.py migrate --noinput
echo "✅ Migrations completed"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null
echo "✅ Static files collected"

# Ensure media directories
mkdir -p media/store_logos media/product_images
chmod -R 775 media staticfiles 2>/dev/null

cd ..

# Frontend Fix
echo ""
echo "🎨 Fixing Frontend..."
cd frontend

# Install dependencies
echo "📦 Installing Node dependencies..."
npm install --silent 2>/dev/null
echo "✅ Dependencies installed"

# Build frontend
echo "🏗️  Building frontend..."
npm run build 2>/dev/null
echo "✅ Frontend built"

cd ..

# Restart services
echo ""
echo "🔄 Restarting services..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart all 2>/dev/null
    pm2 save 2>/dev/null
    echo "✅ PM2 services restarted"
fi

if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null
    echo "✅ Nginx reloaded"
fi

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 .
chmod -R 775 backend/media backend/staticfiles 2>/dev/null

echo ""
echo "============================================"
echo "✅ Production Fix Completed!"
echo "============================================"
echo ""
echo "🌐 Your application: http://72.61.114.111"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs"
echo ""
