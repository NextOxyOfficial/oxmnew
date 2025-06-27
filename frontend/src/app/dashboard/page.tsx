'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items for the sidebar
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', current: true },
    { name: 'Profile', href: '/profile', icon: '👤', current: false },
    { name: 'Settings', href: '/settings', icon: '⚙️', current: false },
    { name: 'Analytics', href: '/analytics', icon: '📈', current: false },
    { name: 'Projects', href: '/projects', icon: '📝', current: false },
    { name: 'Team', href: '/team', icon: '👥', current: false },
    { name: 'Support', href: '/support', icon: '🎧', current: false },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar navigation={navigation} />
      <div className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* ...existing dashboard content... */}
      </div>
    </div>
  );
}