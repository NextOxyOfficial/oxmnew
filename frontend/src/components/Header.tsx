"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Home, 
  Settings, 
  HelpCircle, 
  Sun, 
  Moon, 
  User,
  LogOut,
  Crown,
  Activity,
  Calendar,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

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

// Notifications removed

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
  const { subscriptionStatus, isPro, isLoading: subscriptionLoading } = useSubscription();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  
  // Add click outside handlers for dropdowns
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  // Handle escape key to close dropdowns
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Function to update Dhaka time
  const updateDhakaTime = () => {
    const now = new Date();
    const dhakaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}));
    
    setCurrentTime(dhakaTime.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));

    setCurrentDate(dhakaTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }));
  };

  // Update time every second
  useEffect(() => {
    updateDhakaTime(); // Initial update
    const interval = setInterval(updateDhakaTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current time
  // Removed old static declarations
  
  return (
    <header className="bg-slate-950 border-b border-slate-800 relative z-50">
      <div className="px-[2px] py-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Left Section - Logo & Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo & Brand */}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xs">OX</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-white">OxyManager</span>
                <div className="text-[10px] text-slate-500 -mt-0.5">Business Suite</div>
              </div>
            </Link>

            {/* Breadcrumb Separator */}
            <div className="hidden lg:block h-5 w-px bg-slate-700"></div>

            {/* Breadcrumbs */}
            <nav className="hidden lg:flex items-center gap-1.5 text-sm">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              {breadcrumbs && breadcrumbs.map((item, index) => (
                <React.Fragment key={`${item.name}-${index}`}>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  {item.href ? (
                    <Link 
                      href={item.href} 
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="text-white">{item.name}</span>
                  )}
                </React.Fragment>
              ))}
              {!breadcrumbs && pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-white">{title}</span>
                </>
              )}
            </nav>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Time & Date Display */}
            <div className="hidden md:flex items-center gap-4 text-slate-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">{currentTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">{currentDate}</span>
              </div>
            </div>

            {/* Online Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-medium">Online</span>
            </div>

            {/* Help Button */}
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer">
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center text-slate-900 font-semibold text-xs">
                  {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white leading-tight">
                    {user.first_name || user.username}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Crown className={`h-2.5 w-2.5 ${isPro ? 'text-amber-400' : 'text-slate-500'}`} />
                    {subscriptionLoading ? '...' : (isPro ? 'Pro Account' : 'Free Account')}
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
                        <div className={`text-xs flex items-center gap-1 mt-1 ${isPro ? 'text-amber-400' : 'text-slate-500'}`}>
                          <Crown className="h-3 w-3" />
                          {subscriptionLoading ? 'Loading...' : (isPro ? 'Pro Account' : 'Free Account')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/subscriptions"
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <Crown className="h-4 w-4 mr-3 text-amber-400" />
                      Subscription
                    </Link>
                  </div>
                  
                  <div className="border-t border-slate-700/50">
                    <button
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors cursor-pointer"
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
