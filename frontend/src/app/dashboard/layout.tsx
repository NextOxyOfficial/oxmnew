"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Add global styles for scrollbar hiding
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = scrollbarHideStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "📊",
      current: pathname === "/dashboard",
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: "📦",
      current: pathname === "/dashboard/products",
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: "🛒",
      current: pathname === "/dashboard/orders",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: "⚙️",
      current: pathname === "/dashboard/settings",
    },
    { name: "Reports", href: "/reports", icon: "📈", current: pathname === "/reports" },
    { name: "Customers", href: "/customers", icon: "👥", current: pathname === "/customers" },
    { name: "Banking", href: "/banking", icon: "🏦", current: pathname === "/banking" },
    { name: "Employees", href: "/employees", icon: "👨‍💼", current: pathname === "/employees" },
    { name: "Lending", href: "/lending", icon: "💳", current: pathname === "/lending" },
    { name: "Online Store", href: "/online-store", icon: "🏪", current: pathname === "/online-store" },
    { name: "Notebook", href: "/notebook", icon: "📓", current: pathname === "/notebook" },
    { name: "Scheduler", href: "/scheduler", icon: "⏰", current: pathname === "/scheduler" },
    { name: "SMS", href: "/sms", icon: "📱", current: pathname === "/sms" },
    { name: "Email", href: "/email", icon: "✉️", current: pathname === "/email" },
    {
      name: "Subscriptions",
      href: "/subscriptions",
      icon: "💎",
      current: pathname === "/subscriptions",
    },
  ];

  // Get page title based on current path
  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/dashboard/products":
        return "Products";
      case "/dashboard/orders":
        return "Orders";
      case "/dashboard/settings":
        return "Settings";
      case "/reports":
        return "Reports";
      case "/customers":
        return "Customers";
      case "/banking":
        return "Banking";
      case "/employees":
        return "Employees";
      case "/lending":
        return "Lending";
      case "/online-store":
        return "Online Store";
      case "/notebook":
        return "Notebook";
      case "/scheduler":
        return "Scheduler";
      case "/sms":
        return "SMS";
      case "/email":
        return "Email";
      case "/subscriptions":
        return "Subscriptions";
      default:
        return "Dashboard";
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-72 relative z-10">
        <Header
          user={user}
          onLogout={logout}
          onMenuClick={() => setSidebarOpen(true)}
          title={getPageTitle()}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>

        <Footer />
      </div>
    </div>
  );
}

// Custom scrollbar hide styles
const scrollbarHideStyles = `
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;
