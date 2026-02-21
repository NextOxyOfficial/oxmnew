#!/bin/bash

# Production Environment Setup for OXM Project
echo "🔧 Setting up production environment for OXM Project..."

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

# Get production server IP/domain
read -p "Enter your production server IP/domain (default: 72.61.114.111): " PRODUCTION_HOST
PRODUCTION_HOST=${PRODUCTION_HOST:-72.61.114.111}

read -p "Enter your backend port (default: 8000): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8000}

read -p "Enter your frontend port (default: 3000): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

print_status "Setting up environment files..."

# Create backend .env file
cat > backend/.env << EOF
# Django Configuration
SECRET_KEY=your-production-secret-key-$(date +%s)
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,$PRODUCTION_HOST

# PostgreSQL Database Configuration
DB_NAME=oxm_production
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=http://$PRODUCTION_HOST,http://$PRODUCTION_HOST:$FRONTEND_PORT,https://$PRODUCTION_HOST

# Static and Media Files
STATIC_URL=/static/
MEDIA_URL=/media/
SITE_URL=http://$PRODUCTION_HOST:$BACKEND_PORT

# Production Settings
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
EOF

# Create frontend .env.production file
cat > frontend/.env.production << EOF
# Production environment
NEXT_PUBLIC_API_URL=http://$PRODUCTION_HOST:$BACKEND_PORT/api
NEXT_PUBLIC_BACKEND_URL=http://$PRODUCTION_HOST:$BACKEND_PORT
EOF

# Create frontend .env.local file for development
cat > frontend/.env.local << EOF
# Development environment
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF

print_status "✅ Environment files created successfully!"
print_status ""
print_status "📝 Files created:"
print_status "   backend/.env"
print_status "   frontend/.env.production"  
print_status "   frontend/.env.local"
print_status ""
print_warning "⚠️  Important: Update the following in backend/.env:"
print_warning "   - SECRET_KEY: Generate a secure secret key"
print_warning "   - DB_PASSWORD: Set your PostgreSQL password"
print_warning "   - Other database settings as needed"
print_status ""
print_status "🚀 Ready for deployment!"
print_status "   Run ./deploy.sh to deploy to production"
