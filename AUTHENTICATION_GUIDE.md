# Authentication Flow Guide

## 🔐 Complete Authentication System

Your OXM project now includes a full authentication system with the following components:

### Backend (Django) ✅
- **User Registration**: Creates new user accounts
- **User Login**: Authenticates users and returns tokens
- **Token Authentication**: Secures API endpoints
- **User Profile**: Returns authenticated user data
- **Logout**: Invalidates user tokens

### Frontend (Next.js) ✅
- **Auth Context**: Global authentication state management
- **Login Page**: User login form with validation
- **Register Page**: User registration form with validation
- **Dashboard**: Protected page for authenticated users
- **Navigation**: Dynamic nav based on auth status

## 🚀 Testing the Authentication Flow

### 1. Start Both Services
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Test Registration
1. Go to http://localhost:3000
2. Click "Sign up" 
3. Fill out the registration form
4. You'll be redirected to the dashboard upon success

### 3. Test Login
1. Go to http://localhost:3000/auth/login
2. Enter your credentials
3. You'll be redirected to the dashboard

### 4. Test Protected Routes
- Try accessing `/dashboard` without being logged in
- You should be redirected to the login page

### 5. Test Logout
- From the dashboard, click the "Logout" button
- You'll be redirected to the home page

## 🛠 API Testing with curl

### Register a new user:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### Get Profile (replace TOKEN with actual token):
```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Logout:
```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## 🔧 How It Works

### Token Flow
1. User registers/logs in → Django creates auth token
2. Token stored in browser localStorage
3. All API requests include: `Authorization: Token <token>`
4. Django validates token for protected endpoints
5. Logout deletes token from server and localStorage

### Frontend State Management
- **AuthContext** provides auth state globally
- **useAuth** hook accesses auth functions
- **ApiService** handles token attachment
- **Protected routes** check auth state

### Security Features
- ✅ CORS configured for frontend domain
- ✅ CSRF protection enabled
- ✅ Token-based authentication
- ✅ Password validation
- ✅ Secure token storage

## 🎯 Next Development Steps

### Immediate Features to Add:
1. **Profile Editing** - Allow users to update their info
2. **Password Reset** - Email-based password recovery  
3. **Email Verification** - Verify email addresses
4. **User Avatar** - Profile picture upload

### Advanced Features:
1. **Role-based Permissions** - Admin, user, etc.
2. **OAuth Integration** - Google, GitHub login
3. **Two-Factor Authentication** - Enhanced security
4. **Session Management** - Multiple device support

### Your App Logic:
1. **Create Models** - Define your data structures
2. **Add CRUD APIs** - Create, Read, Update, Delete
3. **Build Frontend Pages** - Your app's main features
4. **Add Business Logic** - Your specific requirements

## 📝 Code Examples

### Adding a Protected API Endpoint:
```python
# backend/core/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_protected_view(request):
    user = request.user
    return Response({'message': f'Hello {user.username}!'})
```

### Using Auth in Frontend Components:
```tsx
// frontend/src/components/MyComponent.tsx
import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {user?.username}!</div>;
}
```

### Making Authenticated API Calls:
```tsx
// frontend/src/lib/api.ts
// Add new methods to ApiService class
static async getMyData() {
  return this.get('/my-endpoint/'); // Token automatically included
}
```

## 🐛 Troubleshooting

### Common Issues:
1. **"Token not found"** - Check localStorage in DevTools
2. **CORS errors** - Verify frontend URL in Django settings
3. **401 Unauthorized** - Token might be expired/invalid
4. **Module not found** - Run `pip install -r requirements.txt`

### Debug Tips:
- Check Django logs for API errors
- Use browser DevTools Network tab
- Verify token format: `Token abc123...`
- Test API endpoints with curl first

---

**🎉 Your authentication system is complete and ready for development!**

Start building your app's unique features on top of this solid foundation.
