"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Home, 
  Search, 
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
  Clock,
  Package,
  Users,
  ShoppingCart,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { searchData, getRecentSearches, addToRecentSearches, type SearchResult } from '@/lib/searchData';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  // Handle search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchData(searchQuery);
          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce by 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery.trim().length === 0) {
      // Show recent searches when focused with no query
      const recentSearches = getRecentSearches();
      setSearchResults(recentSearches);
      setShowSearchResults(true);
    }
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setIsSearchFocused(false);
      setShowSearchResults(false);
    }, 200);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult) => {
    addToRecentSearches(result);
    setShowSearchResults(false);
    setSearchQuery('');
  };
  
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
          
          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 justify-center max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 transition-colors ${
                  isSearching ? 'text-cyan-400 animate-pulse' : 
                  isSearchFocused ? 'text-cyan-400' : 'text-slate-500'
                }`} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search products, customers, orders..."
                className="block w-full pl-10 pr-4 py-2 border border-slate-700/50 rounded-lg bg-slate-800/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-sm"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl max-h-80 overflow-hidden z-50">
                  {isSearching ? (
                    // Loading state
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      <Search className="h-8 w-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                      <p>Searching...</p>
                    </div>
                  ) : searchQuery.trim().length === 0 ? (
                    // Show recent searches when no query
                    <div>
                      <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50 bg-slate-900/50">
                        Recent Searches
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          searchResults.map((item) => (
                            <SearchResultItem 
                              key={`${item.type}-${item.id}`} 
                              item={item} 
                              onSelect={() => handleSearchResultSelect(item)} 
                            />
                          ))
                        ) : (
                          <div className="px-4 py-4 text-center text-slate-500 text-sm">
                            <p>No recent searches</p>
                            <p className="text-xs mt-1">Start typing to search for products, customers, or suppliers</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    // Show search results
                    <div>
                      <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50 bg-slate-900/50">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {searchResults.map((item) => (
                          <SearchResultItem 
                            key={`${item.type}-${item.id}`} 
                            item={item} 
                            onSelect={() => handleSearchResultSelect(item)} 
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    // No results found
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      <Search className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                      <p>No results found for "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try searching for products, customers, or suppliers</p>
                    </div>
                  )}
                </div>
              )}
            </div>
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

            {/* Mobile Search Button */}
            <button className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                    {unreadNotifications > 0 && (
                      <p className="text-xs text-slate-500 mt-1">{unreadNotifications} unread</p>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        <div className="animate-spin h-5 w-5 mx-auto mb-2 border-2 border-slate-600 border-t-cyan-400 rounded-full"></div>
                        <p>Loading notifications...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="p-3 border-b border-slate-700/30 hover:bg-slate-700/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-slate-200">{notification.title}</h4>
                              <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notification.timestamp}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-700/50">
                    <Link href="/dashboard/notifications" className="text-xs text-cyan-400 hover:text-cyan-300">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
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

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-slate-700/50 px-4 py-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder="Search..."
            className="block w-full pl-10 pr-4 py-2 border border-slate-700/50 rounded-lg bg-slate-800/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-sm"
          />
          
          {/* Mobile Search Results */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl max-h-64 overflow-hidden z-50">
              {isSearching ? (
                // Loading state
                <div className="px-4 py-4 text-center text-slate-500 text-sm">
                  <Search className="h-6 w-6 mx-auto mb-2 text-slate-600 animate-pulse" />
                  <p>Searching...</p>
                </div>
              ) : searchQuery.trim().length === 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50 bg-slate-900/50">
                    Recent Searches
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <SearchResultItem 
                          key={`mobile-${item.type}-${item.id}`} 
                          item={item} 
                          onSelect={() => handleSearchResultSelect(item)} 
                        />
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center text-slate-500 text-sm">
                        <p>No recent searches</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50 bg-slate-900/50">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {searchResults.map((item) => (
                      <SearchResultItem 
                        key={`mobile-${item.type}-${item.id}`} 
                        item={item} 
                        onSelect={() => handleSearchResultSelect(item)} 
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 text-center text-slate-500 text-sm">
                  <Search className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  <p>No results found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Component for search result items
function SearchResultItem({ 
  item, 
  onSelect 
}: { 
  item: SearchResult; 
  onSelect: () => void;
}) {
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'product':
        return Package;
      case 'customer':
        return Users;
      case 'order':
        return ShoppingCart;
      case 'supplier':
        return Building2;
      default:
        return Search;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'product':
        return 'text-blue-400 bg-blue-500/10';
      case 'customer':
        return 'text-green-400 bg-green-500/10';
      case 'order':
        return 'text-purple-400 bg-purple-500/10';
      case 'supplier':
        return 'text-orange-400 bg-orange-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'HIGH_STOCK':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'MEDIUM_STOCK':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'LOW_STOCK':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'OUT_OF_STOCK':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PROCESSING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'SHIPPED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const Icon = getIcon(item.type);

  return (
    <Link
      href={item.href}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0"
    >
      {item.avatar ? (
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-slate-900 font-medium text-sm">
          {item.avatar}
        </div>
      ) : (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-slate-200 truncate">{item.title}</h4>
          {item.badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(item.badge)}`}>
              {item.badge.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
      </div>
      
      <div className="text-xs text-slate-500 capitalize">
        {item.type}
      </div>
    </Link>
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
