# OXM Project

A full-stack application with Django backend, Next.js frontend, and complete authentication system.

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/NextOxyOfficial/oxmnew.git
cd oxmnew

# Quick start (recommended)
chmod +x dev-start.sh
./dev-start.sh
```

### Server Deployment
```bash
# On your Linux server
git clone https://github.com/NextOxyOfficial/oxmnew.git
cd oxmnew

# Setup and deploy
chmod +x setup.sh deploy.sh
./setup.sh
./deploy.sh
```

## 📁 Project Structure

```
oxmnew/
├── backend/           # Django REST API
│   ├── backend/       # Django project settings
│   ├── core/          # Main Django app with auth endpoints
│   ├── banking/       # Banking module
│   ├── customers/     # Customer management
│   ├── employees/     # Employee management
│   ├── products/      # Product management
│   ├── suppliers/     # Supplier management
│   ├── subscription/  # Subscription system
│   ├── requirements.txt
│   ├── .env.template  # Environment template
│   └── manage.py
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   │   ├── auth/  # Login & Register pages
│   │   │   └── dashboard/ # Protected dashboard
│   │   ├── components/ # Reusable components
│   │   ├── contexts/  # React contexts (Auth, etc.)
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # API service utilities
│   │   └── types/     # TypeScript type definitions
│   ├── package.json
│   └── .env.template  # Environment template
├── setup.sh           # Development setup script
├── dev-start.sh       # Local development start script
├── deploy.sh          # Production deployment script
├── SERVER_COMMANDS.md # Server management commands
└── DEPLOYMENT.md      # Detailed deployment guide
```

## � Environment Setup

### Backend Environment (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,168.231.119.200

DB_NAME=oxm_user
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://168.231.119.200
```

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_URL=http://localhost:8000/media
```

## 🏗️ Development Workflow

### Local Development
1. **Setup**: Run `./dev-start.sh` to start both servers
2. **Development**: Make changes and test locally
3. **Commit**: `git add . && git commit -m "Your changes"`
4. **Push**: `git push origin main`

### Server Deployment
1. **Pull**: `git pull origin main` (on server)
2. **Deploy**: `./deploy.sh` (on server)
3. **Verify**: Check application at http://168.231.119.200

## 🌐 Application URLs

### Local Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

### Production Server
- **Frontend**: http://168.231.119.200
- **Backend API**: http://168.231.119.200/api/
- **Django Admin**: http://168.231.119.200/admin/

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
- **Login**: `/auth/login` - User authentication
- **Register**: `/auth/register` - User registration
- **Dashboard**: `/dashboard` - Protected main dashboard
- **Profile**: `/dashboard/profile` - User profile management

## 💼 Business Modules

### Core Features
- **Banking**: Financial transaction management
- **Customers**: Customer relationship management
- **Employees**: Staff management system
- **Products**: Inventory and product management
- **Suppliers**: Vendor and supplier management
- **Subscriptions**: Subscription billing system

### Dashboard Features
- **Analytics**: Business metrics and reporting
- **SMS**: Bulk messaging system
- **Settings**: Application configuration
- **Help**: Documentation and support

## 🛠️ Technology Stack

### Backend
- **Django 4.2.7**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL**: Database
- **Gunicorn**: WSGI server
- **python-decouple**: Environment management

### Frontend
- **Next.js 15.3.4**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **React Context**: State management

### Infrastructure
- **Nginx**: Reverse proxy and static files
- **PM2**: Process management
- **Ubuntu/Linux**: Server OS

## 🔍 Development Commands

### Backend (Django)
```bash
cd backend
source venv/bin/activate

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Collect static files
python manage.py collectstatic
```

### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Server Management
```bash
# Application status
pm2 status

# View logs
pm2 logs

# Restart applications
pm2 restart all

# System services
sudo systemctl status nginx
sudo systemctl status postgresql
```

## 📝 Git Workflow

### Branching Strategy
- **main**: Production-ready code
- **develop**: Development branch
- **feature/***: Feature branches

### Commit Guidelines
```bash
# Feature
git commit -m "feat: add user authentication"

# Bug fix
git commit -m "fix: resolve login redirect issue"

# Documentation
git commit -m "docs: update deployment guide"

# Style
git commit -m "style: format code with prettier"
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Reset database
cd backend
source venv/bin/activate
python manage.py flush
python manage.py migrate
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:www-data /var/www/oxmnew
sudo chmod -R 755 /var/www/oxmnew
```

#### Service Issues
```bash
# Restart all services
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

#### Build Issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

## � Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [SERVER_COMMANDS.md](SERVER_COMMANDS.md) - Server management commands
- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check DEPLOYMENT.md and SERVER_COMMANDS.md
- **Server Status**: http://168.231.119.200

---

**Happy coding! 🚀**
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
