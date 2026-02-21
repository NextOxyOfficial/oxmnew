# Production Sync Guide - OXM Project

এই guide তোমাকে দেখাবে কিভাবে তোমার local database এবং configuration Linux production server-এ exactly same করবে।

## 🎯 সমস্যা যা solve হবে

- ✅ Local-এ যা কাজ করে production-এ তাই কাজ করবে
- ✅ Database migration issues fix হবে
- ✅ Static files এবং media files properly serve হবে
- ✅ Environment configuration সঠিক হবে
- ✅ Services (PM2, Nginx) properly configure হবে

## 📋 Prerequisites

তোমার Linux server-এ এগুলো installed থাকতে হবে:
- Python 3.8+
- PostgreSQL
- Node.js 18+
- npm
- Git

## 🚀 Quick Start - Complete Production Fix

যদি তোমার production server সম্পূর্ণভাবে fix করতে চাও (recommended):

### Step 1: Upload Scripts to Server

তোমার local machine থেকে:

```bash
# Server-এ scripts upload করো
scp fix-production.sh sync-production.sh root@72.61.114.111:/var/www/oxmnew/
```

### Step 2: Run Complete Fix Script

Server-এ SSH করো এবং:

```bash
cd /var/www/oxmnew
chmod +x fix-production.sh
./fix-production.sh
```

এই script করবে:
1. ✅ Backend environment setup
2. ✅ Python dependencies install
3. ✅ Database recreate এবং migrate
4. ✅ Superuser create (admin/admin123)
5. ✅ Static files collect
6. ✅ Frontend build
7. ✅ PM2 services setup
8. ✅ Nginx configure

**সময় লাগবে: 5-10 minutes**

## 🔄 Database Sync Only

যদি শুধু database sync করতে চাও (local থেকে production-এ):

### Step 1: Local Database Export

তোমার local machine-এ:

```bash
cd backend
source venv/bin/activate  # Windows-এ: venv\Scripts\activate
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude=contenttypes --exclude=auth.permission \
    --exclude=sessions.session --indent=2 > local_data.json
```

### Step 2: Upload to Server

```bash
scp local_data.json root@72.61.114.111:/var/www/oxmnew/backend/
```

### Step 3: Load on Server

Server-এ:

```bash
cd /var/www/oxmnew
chmod +x sync-production.sh
./sync-production.sh
```

অথবা manually:

```bash
cd /var/www/oxmnew/backend
source venv/bin/activate

# Backup current data
python manage.py dumpdata > backup_$(date +%Y%m%d_%H%M%S).json

# Clear database
python manage.py flush --noinput

# Load local data
python manage.py loaddata local_data.json

# Restart services
pm2 restart all
```

## 🔧 Manual Fix Steps

যদি scripts কাজ না করে, manually করতে পারো:

### 1. Fix Backend Environment

```bash
cd /var/www/oxmnew/backend

# Create/update .env file
nano .env
```

`.env` file-এ এগুলো থাকতে হবে:

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,72.61.114.111,oxymanager.com

DB_NAME=oxm_production
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://72.61.114.111,http://72.61.114.111:3000

SITE_URL=http://72.61.114.111
STATIC_URL=/static/
MEDIA_URL=/media/
```

### 2. Fix Database

```bash
# PostgreSQL-এ login করো
sudo -u postgres psql

# Database recreate করো
DROP DATABASE IF EXISTS oxm_production;
CREATE DATABASE oxm_production;
GRANT ALL PRIVILEGES ON DATABASE oxm_production TO postgres;
\q

# Migrations run করো
cd /var/www/oxmnew/backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

### 3. Fix Frontend Environment

```bash
cd /var/www/oxmnew/frontend

# Create .env.production
nano .env.production
```

`.env.production` file-এ:

```env
NEXT_PUBLIC_API_URL=http://72.61.114.111:8000/api
NEXT_PUBLIC_BACKEND_URL=http://72.61.114.111:8000
```

```bash
# Rebuild frontend
npm install
npm run build
```

### 4. Restart Services

```bash
# PM2 restart
pm2 restart all
pm2 save

# Nginx restart
sudo systemctl restart nginx
```

## 🐛 Common Issues & Solutions

### Issue 1: Migration Conflicts

```bash
cd backend
source venv/bin/activate

# Remove all migrations
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete

# Recreate migrations
python manage.py makemigrations
python manage.py migrate --fake-initial
```

### Issue 2: Static Files Not Loading

```bash
cd backend
source venv/bin/activate
python manage.py collectstatic --clear --noinput

# Set permissions
chmod -R 775 staticfiles media
```

### Issue 3: CORS Errors

Backend `.env` file-এ check করো:

```env
CORS_ALLOWED_ORIGINS=http://72.61.114.111,http://72.61.114.111:3000,http://localhost:3000
```

### Issue 4: Database Connection Error

```bash
# PostgreSQL running check করো
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Password reset করো
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### Issue 5: PM2 Services Not Starting

```bash
# Delete all PM2 processes
pm2 delete all

# Start backend
cd /var/www/oxmnew/backend
pm2 start "source venv/bin/activate && python manage.py runserver 0.0.0.0:8000" --name oxm-backend --interpreter bash

# Start frontend
cd /var/www/oxmnew/frontend
pm2 start npm --name oxm-frontend -- start

# Save
pm2 save
```

## 📊 Verify Everything is Working

### Check Services Status

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql
```

### Check Logs

```bash
# Backend logs
pm2 logs oxm-backend

# Frontend logs
pm2 logs oxm-frontend

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Test URLs

Browser-এ এগুলো check করো:

- Frontend: `http://72.61.114.111`
- Backend API: `http://72.61.114.111/api/`
- Django Admin: `http://72.61.114.111/admin/`

## 🔐 Security Notes

Production-এ deploy করার পর:

1. **Change Admin Password**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py changepassword admin
   ```

2. **Update SECRET_KEY**
   - `.env` file-এ একটা strong secret key use করো
   - Generate করতে পারো: `openssl rand -base64 50`

3. **Enable HTTPS** (optional but recommended)
   - Let's Encrypt SSL certificate install করো
   - Nginx-এ HTTPS configure করো

## 📞 Need Help?

যদি কোনো সমস্যা হয়:

1. Logs check করো: `pm2 logs`
2. Database connection test করো
3. Environment variables verify করো
4. Permissions check করো: `ls -la backend/media backend/staticfiles`

## 🎉 Success Checklist

- [ ] Scripts uploaded to server
- [ ] `fix-production.sh` successfully run হয়েছে
- [ ] PM2 services running (green status)
- [ ] Frontend accessible at http://72.61.114.111
- [ ] Backend API responding at http://72.61.114.111/api/
- [ ] Django admin accessible
- [ ] Can login with admin credentials
- [ ] Static files loading properly
- [ ] Media files (images) loading properly
- [ ] All features working same as local

---

**তোমার production এখন local-এর মতো exactly same হবে!** 🚀
