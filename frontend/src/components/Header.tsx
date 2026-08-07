"use client";

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Home,
  Settings,
  HelpCircle,
  Menu,
  User,
  LogOut,
  Crown,
  Calendar,
  Clock
} from 'lucide-react';
import Image from 'next/image';
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
}: HeaderProps) {
  const pathname = usePathname();
  const { isPro, isLoading: subscriptionLoading } = useSubscription();
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

  const planLabel = subscriptionLoading ? '…' : isPro ? 'প্রো অ্যাকাউন্ট' : 'ফ্রি অ্যাকাউন্ট';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Left Section - Logo & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              aria-label="মেনু খুলুন"
              className="lg:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* On mobile the sidebar is hidden, so the brand still needs a
                home here; on desktop the rail carries it. */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 min-w-0 lg:hidden"
            >
              <Image
                src="/logo-mark.png"
                alt="OxyManager"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-lg"
                priority
              />
              <span className="text-[15px] font-semibold text-slate-900 truncate">
                OxyManager
              </span>
            </Link>

            {/* Breadcrumbs */}
            <nav aria-label="ব্রেডক্রাম্ব" className="hidden lg:flex items-center gap-1.5 text-[13px] min-w-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>ড্যাশবোর্ড</span>
              </Link>
              {breadcrumbs && breadcrumbs.map((item, index) => (
                <React.Fragment key={`${item.name}-${index}`}>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-slate-500 hover:text-slate-900 transition-colors truncate max-w-[10rem]"
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium truncate max-w-[12rem]" title={item.name}>
                      {item.name}
                    </span>
                  )}
                </React.Fragment>
              ))}
              {!breadcrumbs && pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-900 font-medium truncate max-w-[12rem]" title={title}>{title}</span>
                </>
              )}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Time & Date Display */}
            <div className="hidden xl:flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs num">{currentTime}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">{currentDate}</span>
              </span>
            </div>

            {/* Online Status */}
            <span className="hidden sm:block">
              <span className="badge badge-success">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                অনলাইন
              </span>
            </span>

            {/* Help — routes to the in-app help page (was a dead button) */}
            <Link
              href="/dashboard/help"
              aria-label="সাহায্য"
              title="সাহায্য"
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="অ্যাকাউন্ট মেনু"
                aria-expanded={showUserMenu}
                className="flex items-center gap-2 h-9 pl-1 pr-1.5 sm:pr-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="h-7 w-7 shrink-0 bg-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                </span>
                <span className="hidden md:block text-left">
                  <span className="block text-[13px] font-medium text-slate-900 leading-tight truncate max-w-[9rem]">
                    {user.first_name || user.username}
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-tight">
                    {planLabel}
                  </span>
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 bg-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-slate-900 truncate">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.username}
                        </div>
                        <div className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</div>
                        <div className="mt-1.5">
                          <span className={`badge ${isPro ? 'badge-warn' : 'badge-muted'}`}>
                            <Crown className="h-3 w-3" />
                            {subscriptionLoading ? 'লোড হচ্ছে…' : isPro ? 'প্রো' : 'ফ্রি'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 h-9 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      আমার প্রোফাইল
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 h-9 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      সেটিংস
                    </Link>
                    <Link
                      href="/dashboard/subscriptions"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 h-9 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Crown className="h-4 w-4 text-slate-400" />
                      সাবস্ক্রিপশন
                    </Link>
                  </div>

                  <div className="border-t border-slate-200 py-1">
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-3 w-full px-4 h-9 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      লগ আউট
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
