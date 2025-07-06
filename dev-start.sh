#!/bin/bash

# OXM Project Quick Start Development Script
echo "🚀 Starting OXM Development Environment..."

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the OXM project root directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup INT

# Start backend
echo "🔧 Starting Django backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Backend .env file not found. Creating from template..."
    cp .env.template .env
    echo "📝 Please update backend/.env with your database credentials"
fi

python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "⚛️  Starting Next.js frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Frontend .env.local file not found. Creating from template..."
    cp .env.template .env.local
fi

npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a bit for servers to start
sleep 3

echo ""
echo "✅ Development servers started!"
echo "📊 Backend (Django):  http://localhost:8000"
echo "🌐 Frontend (Next.js): http://localhost:3000"
echo "👑 Django Admin:      http://localhost:8000/admin"
echo ""
echo "🔧 Useful commands:"
echo "   Backend logs:  tail -f backend/django.log"
echo "   Frontend logs: Check the terminal output above"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for user to stop
wait
