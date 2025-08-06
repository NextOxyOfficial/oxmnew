"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Home, 
  Bell, 
  Settings, 
  HelpCircle, 
  Sun, 
  Moon, 
  User,
  LogOut,
  Crown,
  MessageSquare,
  Activity,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiService } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

interface HeaderProps {
  user: User;
  onLogout: () => Promise<void>;
  onMenuClick: () => void;
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  smsCredits?: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Header({ 
  user, 
  onLogout, 
  onMenuClick, 
  title, 
  breadcrumbs,
  smsCredits = 1250,
  darkMode = true,
  onToggleDarkMode
}: HeaderProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await ApiService.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set empty array if fetch fails
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh notifications periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Add click outside handlers for dropdowns
  const notificationRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(notificationRef, () => setShowNotifications(false));
  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  // Handle escape key to close dropdowns
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Get current time
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <header className="bg-slate-900/98 backdrop-blur-xl border-b border-slate-700/50 shadow-xl relative z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden rounded-lg p-2 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo & Brand */}
            <Link href="/dashboard" className="flex items-center group">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300">
                <span className="text-slate-900 font-bold text-sm">OX</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  OxyManager
                </span>
                <div className="text-xs text-slate-500 font-medium">Business Suite</div>
              </div>
            </Link>

            {/* Breadcrumbs */}
            <nav className="hidden lg:flex items-center space-x-1 text-sm ml-6 pl-6 border-l border-slate-700/50">
              <Link 
                href="/dashboard" 
                className="flex items-center text-slate-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/40"
              >
                <Home className="h-4 w-4 mr-1" />
                <span className="font-medium">Dashboard</span>
              </Link>
              {breadcrumbs && breadcrumbs.map((item, index) => (
                <React.Fragment key={`${item.name}-${index}`}>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                  {item.href ? (
                    <Link 
                      href={item.href} 
                      className="text-slate-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/40 font-medium"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="text-slate-200 font-medium px-2 py-1 bg-slate-800/40 rounded-md">
                      {item.name}
                    </span>
                  )}
                </React.Fragment>
              ))}
              {!breadcrumbs && pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                  <span className="text-slate-200 font-medium px-2 py-1 bg-slate-800/40 rounded-md">
                    {title}
                  </span>
                </>
              )}
            </nav>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Time & Date Display */}
            <div className="hidden xl:flex items-center space-x-3 text-slate-400 border-r border-slate-700/50 pr-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">{currentTime}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{currentDate}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
                <Activity className="h-3 w-3" />
                <span className="font-medium">Online</span>
              </div>
            </div>

            {/* Help Button */}
            <Link
              href="/dashboard/help"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </Link>

            {/* Theme Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-slate-900 font-medium text-sm shadow-lg">
                  {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                    {user.first_name || user.username}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" />
                    Pro Account
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-slate-900 font-bold">
                        {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user.username}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                        <div className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                          <Crown className="h-3 w-3" />
                          Pro Account
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/subscriptions"
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                      <Crown className="h-4 w-4 mr-3 text-amber-400" />
                      Subscription
                    </Link>
                  </div>
                  
                  <div className="border-t border-slate-700/50">
                    <button
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper function to close dropdowns when clicking outside
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
