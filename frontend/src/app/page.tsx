'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ApiStatus {
  message: string;
  isConnected: boolean;
  error?: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    message: 'Checking connection...',
    isConnected: false,
  });

  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await ApiService.healthCheck();
      setApiStatus({
        message: response.message || 'Connected to Django backend',
        isConnected: true,
      });
    } catch (error) {
      setApiStatus({
        message: 'Failed to connect to backend',
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                OXM Project
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
              ) : isAuthenticated ? (
                <>
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {user?.first_name || user?.username}!
                  </span>
                  <Link
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OXM Project
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Full-stack application with Django backend and Next.js frontend
          </p>
        </div>

        {/* Authentication Status */}
        {isAuthenticated && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-800 dark:text-green-200 font-medium">
                  You are logged in as {user?.username}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* API Connection Status */}
        <div className="mb-12 max-w-md mx-auto">
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Backend Connection</h2>
            <div className="flex items-center gap-3 mb-3">
              <div 
                className={`w-3 h-3 rounded-full ${
                  apiStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className={`font-medium ${
                apiStatus.isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {apiStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {apiStatus.message}
            </p>
            {apiStatus.error && (
              <p className="text-xs text-red-500 mb-3">
                Error: {apiStatus.error}
              </p>
            )}
            <button
              onClick={checkApiConnection}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 text-blue-600">Backend (Django)</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Django REST Framework
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                PostgreSQL Database (oxmdb_new)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Admin Panel
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                CORS Enabled
              </li>
            </ul>
            <div className="space-y-2">
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🔗 Open Admin Panel →
              </a>
              <a
                href="http://localhost:8000/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🔗 View API →
              </a>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 text-purple-600">Frontend (Next.js)</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                React 18 with TypeScript
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Tailwind CSS
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                App Router
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                API Integration
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <h3 className="text-2xl font-semibold mb-6 text-center">🚀 Quick Start Guide</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-600">1. Backend Setup</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <div className="space-y-1">
                  <div>cd backend</div>
                  <div>python -m venv venv</div>
                  <div>venv\\Scripts\\activate</div>
                  <div>pip install -r requirements.txt</div>
                  <div>python manage.py migrate</div>
                  <div>python manage.py createsuperuser</div>
                  <div>python manage.py runserver</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-600">2. Frontend Setup</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <div className="space-y-1">
                  <div>cd frontend</div>
                  <div>npm install</div>
                  <div>npm run dev</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200">📋 Database Setup Required</h4>
            <p className="text-yellow-700 dark:text-yellow-300 mb-3">
              Before running the backend, make sure to:
            </p>
            <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 text-sm">
              <li>• Install PostgreSQL and pgAdmin</li>
              <li>• Create database: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">oxmdb_new</code></li>
              <li>• Update <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">.env</code> file with your database credentials</li>
              <li>• Check <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">DATABASE_SETUP.md</code> for detailed instructions</li>
            </ul>
          </div>
        </div>

        {/* Service URLs */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">🌐 Service URLs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="font-medium text-blue-800 dark:text-blue-200">Frontend</div>
              <div className="text-sm text-blue-600 dark:text-blue-300">http://localhost:3000</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="font-medium text-green-800 dark:text-green-200">Backend API</div>
              <div className="text-sm text-green-600 dark:text-green-300">http://localhost:8000/api</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="font-medium text-purple-800 dark:text-purple-200">Admin Panel</div>
              <div className="text-sm text-purple-600 dark:text-purple-300">http://localhost:8000/admin</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
