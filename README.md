# OXM Project

A full-stack application with Django backend, Next.js frontend, and complete authentication system.

## Project Structure

```
oxmnew/
├── backend/           # Django REST API
│   ├── backend/       # Django project settings
│   ├── core/          # Main Django app with auth endpoints
│   ├── requirements.txt
│   ├── .env
│   └── manage.py
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   │   ├── auth/  # Login & Register pages
│   │   │   └── dashboard/ # Protected dashboard
│   │   ├── contexts/  # Auth context
│   │   └── lib/       # API service utilities
│   ├── package.json
│   └── .env.local
├── .vscode/
│   └── tasks.json     # VS Code tasks
├── start-backend.bat  # Backend start script
├── start-frontend.bat # Frontend start script
├── start-dev.bat      # Start both services
├── DATABASE_SETUP.md  # Database setup guide
└── README.md
```

## 🚀 Quick Start

### 1. Backend Setup (Django)

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # On Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   - Update `.env` file with your database credentials
   - Update `SECRET_KEY` and `DB_PASSWORD`

4. **Set up database:**
   - Follow instructions in `DATABASE_SETUP.md`
   - Create PostgreSQL database named `oxmdb_new`

5. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Start development server:**
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup (Next.js)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

### 3. Easy Start (Recommended)

Use the provided batch scripts:
- **`start-dev.bat`** - Starts both backend and frontend
- **`start-backend.bat`** - Starts only Django backend
- **`start-frontend.bat`** - Starts only Next.js frontend

## 🔐 Authentication System

### Features
- ✅ User registration and login
- ✅ JWT token authentication
- ✅ Protected routes and dashboard
- ✅ User profile management
- ✅ Logout functionality
- ✅ Real-time auth state management

### Pages
- **Home**: `/` - Landing page with auth status
- **Login**: `/auth/login` - User login form
- **Register**: `/auth/register` - User registration form
- **Dashboard**: `/dashboard` - Protected user dashboard

### API Endpoints

#### Authentication
- **POST** `/api/auth/register/` - User registration
- **POST** `/api/auth/login/` - User login
- **POST** `/api/auth/logout/` - User logout (requires auth)
- **GET** `/api/auth/profile/` - Get user profile (requires auth)

#### General
- **GET** `/api/` - API root with endpoint list
- **GET** `/api/health/` - Health check endpoint
- **GET** `/admin/` - Django admin panel

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

## 🛠 Technologies Used

### Backend
- Django 4.2.7
- Django REST Framework
- Token Authentication
- PostgreSQL
- django-cors-headers
- python-decouple

### Frontend
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Context API for state management

### Database
- PostgreSQL
- pgAdmin

## 🏗 Development Workflow

1. **Start PostgreSQL service**
2. **Start Django backend**: `python manage.py runserver`
3. **Start Next.js frontend**: `npm run dev`
4. **Access application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api
   - Admin: http://localhost:8000/admin

## 📝 VS Code Tasks

Press `Ctrl+Shift+P` and type "Tasks: Run Task" to access:
- Start Django Backend
- Start Next.js Frontend
- Install Backend Dependencies
- Install Frontend Dependencies
- Django Migrations
- Create Django Superuser

## 🎯 Next Steps for Development

### Immediate Tasks
1. Set up PostgreSQL database
2. Run migrations and create superuser
3. Test authentication flow
4. Start building your app features

### Suggested Features to Add
- [ ] Password reset functionality
- [ ] Profile editing
- [ ] Email verification
- [ ] Role-based permissions
- [ ] User avatar upload
- [ ] API pagination
- [ ] Search functionality
- [ ] Real-time notifications

### API Development
- [ ] Create your app-specific models
- [ ] Add CRUD endpoints
- [ ] Implement filtering and search
- [ ] Add data validation
- [ ] Create custom permissions

### Frontend Development
- [ ] Add more pages/components
- [ ] Implement form validation
- [ ] Add loading states
- [ ] Create reusable components
- [ ] Add responsive design
- [ ] Implement error handling

## 🔧 Troubleshooting

### Common Issues

1. **Module 'environ' not found**
   - Run: `pip install django-environ` or use the updated settings.py

2. **Database connection failed**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database `oxmdb_new` exists

3. **CORS errors**
   - Verify frontend URL in Django CORS settings
   - Check `CORS_ALLOWED_ORIGINS` in settings.py

4. **Token authentication issues**
   - Check if token is properly stored in localStorage
   - Verify Authorization header format: `Token <token>`

### Development Tips

- Use Django admin panel for quick data management
- Check browser DevTools for API request/response details
- Use Django shell for database operations: `python manage.py shell`
- Monitor backend logs for debugging API issues

## 📚 Documentation

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Ready to build something amazing! 🚀**
