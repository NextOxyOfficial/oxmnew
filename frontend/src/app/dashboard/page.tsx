'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl mb-8">
          <div className="px-6 py-8">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Welcome back, {user?.first_name || user?.username}!
            </h2>
            <p className="text-slate-300 text-lg mb-6">
              You're successfully logged in to the OXM platform. Your comprehensive dashboard is ready to help you manage your business efficiently.
            </p>
            
            {/* User Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-400/30">
                <h3 className="text-cyan-300 text-sm font-medium mb-1">Username</h3>
                <p className="text-slate-100 font-semibold">{user?.username}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                <h3 className="text-blue-300 text-sm font-medium mb-1">Email</h3>
                <p className="text-slate-100 font-semibold">{user?.email}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
                <h3 className="text-green-300 text-sm font-medium mb-1">First Name</h3>
                <p className="text-slate-100 font-semibold">{user?.first_name || 'Not provided'}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
                <h3 className="text-orange-300 text-sm font-medium mb-1">Last Name</h3>
                <p className="text-slate-100 font-semibold">{user?.last_name || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:bg-slate-900/50 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-slate-900 text-xl">📊</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-slate-400">Total Sales</h3>
                <p className="text-2xl font-bold text-slate-100">$12,345</p>
                <p className="text-xs text-green-400">+12% from last month</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📦</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-300">Products</h3>
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-xs text-green-300">+5 new this week</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">�</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-300">Orders</h3>
                <p className="text-2xl font-bold text-white">89</p>
                <p className="text-xs text-green-300">+23% this week</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">👥</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-300">Customers</h3>
                <p className="text-2xl font-bold text-white">2,341</p>
                <p className="text-xs text-green-300">+8% this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">🚀</span>
              System Status & Features
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-green-300 text-lg">✅ What's Working:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    User registration and login
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    JWT token authentication
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Protected routes
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Responsive sidebar navigation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Modern glassmorphism UI
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Comprehensive business modules
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-300 text-lg">🔧 Available Modules:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Products & Inventory Management
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Order Processing & Tracking
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Customer Relationship Management
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Banking & Financial Tools
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Employee Management System
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Communication Tools (SMS/Email)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}