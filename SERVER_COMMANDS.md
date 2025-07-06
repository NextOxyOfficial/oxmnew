# OXM Project - Server Commands

## Server Setup Commands

### Initial Server Setup
```bash
# Clone the repository
git clone https://github.com/NextOxyOfficial/oxmnew.git
cd oxmnew

# Run setup script
chmod +x setup.sh
./setup.sh

# Or manual setup:
chmod +x deploy.sh
./deploy.sh
```

### Server Management

#### Application Management
```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# Start applications
pm2 start all
```

#### System Services
```bash
# Nginx status/control
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl stop nginx
sudo systemctl start nginx

# PostgreSQL status/control
sudo systemctl status postgresql
sudo systemctl restart postgresql
sudo systemctl stop postgresql
sudo systemctl start postgresql
```

#### Database Management
```bash
# Connect to database
psql -h localhost -U postgres -d oxm_user

# Backup database
pg_dump -h localhost -U postgres oxm_user > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -h localhost -U postgres -d oxm_user < backup_file.sql
```

#### Git Operations
```bash
# Pull latest changes
git pull origin main

# Push changes (if made on server)
git add .
git commit -m "Server changes"
git push origin main

# Check git status
git status
git log --oneline -10
```

#### File Permissions
```bash
# Fix permissions
sudo chown -R $USER:www-data /var/www/oxmnew
sudo chmod -R 755 /var/www/oxmnew
sudo chmod -R 775 /var/www/oxmnew/backend/media
sudo chmod -R 775 /var/www/oxmnew/backend/staticfiles
```

#### Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tulpn | grep :80
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000
```

#### Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
pm2 logs oxm-backend
pm2 logs oxm-frontend

# System logs
sudo journalctl -u nginx
sudo journalctl -u postgresql
```

## Local Development Commands

### Local Setup
```bash
# Setup development environment
./dev-start.sh

# Or manually:
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Local Git Operations
```bash
# Regular development workflow
git add .
git commit -m "Your changes"
git push origin main

# Pull server changes
git pull origin main

# Check status
git status
git log --oneline -10
```

### Local Database
```bash
# Django database operations
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
```

## Quick Deployment Workflow

### From Local to Server
```bash
# On Local Machine
git add .
git commit -m "Feature: Add new functionality"
git push origin main

# On Server
git pull origin main
./deploy.sh
```

### Emergency Server Access
```bash
# SSH to server
ssh root@168.231.119.200

# Quick status check
pm2 status && sudo systemctl status nginx

# Quick restart
pm2 restart all && sudo systemctl restart nginx
```

## Troubleshooting Commands

### Common Issues
```bash
# Application not responding
pm2 restart all
sudo systemctl restart nginx

# Database connection issues
sudo systemctl restart postgresql
psql -h localhost -U postgres -d oxm_user

# Permission issues
sudo chown -R $USER:www-data /var/www/oxmnew
sudo chmod -R 755 /var/www/oxmnew

# Disk space issues
df -h
sudo du -sh /var/www/oxmnew/*
sudo apt clean
```

### Reset Everything
```bash
# Complete reset (USE WITH CAUTION)
pm2 stop all
cd /var/www/oxmnew
git reset --hard origin/main
./deploy.sh
```
