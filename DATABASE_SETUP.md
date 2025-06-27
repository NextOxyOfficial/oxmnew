# PostgreSQL Database Setup Guide

## Prerequisites
1. Install PostgreSQL on your system
2. Install pgAdmin (if not already installed)

## Database Setup Steps

### 1. Create Database
Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE oxmdb_new;
```

### 2. Create User (Optional)
If you want to create a specific user for this project:

```sql
CREATE USER oxm_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE oxmdb_new TO oxm_user;
```

### 3. Update Environment Variables
Update the `.env` file in the backend directory with your database credentials:

```
DB_NAME=oxmdb_new
DB_USER=postgres  # or oxm_user if you created a specific user
DB_PASSWORD=your_actual_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. pgAdmin Configuration
1. Open pgAdmin
2. Right-click on "Servers" → "Create" → "Server"
3. In the "General" tab:
   - Name: OXM Development
4. In the "Connection" tab:
   - Host name/address: localhost
   - Port: 5432
   - Username: postgres (or your username)
   - Password: your_password

### 5. Run Django Migrations
After setting up the database, run:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```
