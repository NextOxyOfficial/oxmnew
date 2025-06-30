"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  Users,
  Building2,
  Briefcase,
  CreditCard,
  Store,
  BookOpen,
  Smartphone,
  Diamond,
  Truck,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      current: pathname === "/dashboard",
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: Package,
      current: pathname === "/dashboard/products",
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingCart,
      current: pathname === "/dashboard/orders",
    },
    {
      name: "Suppliers",
      href: "/dashboard/suppliers",
      icon: Truck,
      current: pathname === "/dashboard/suppliers",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: pathname === "/dashboard/settings",
    },
    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: Users,
      current: pathname === "/dashboard/customers",
    },
    {
      name: "Banking",
      href: "/dashboard/banking",
      icon: Building2,
      current: pathname === "/dashboard/banking",
    },
    {
      name: "Employees",
      href: "/dashboard/employees",
      icon: Briefcase,
      current: pathname === "/dashboard/employees",
    },
    {
      name: "Due Book",
      href: "/dashboard/duebook",
      icon: CreditCard,
      current: pathname === "/dashboard/duebook",
    },
    {
      name: "Online Store",
      href: "/dashboard/online-store",
      icon: Store,
      current: pathname === "/dashboard/online-store",
    },
    {
      name: "Notebook",
      href: "/dashboard/notebook",
      icon: BookOpen,
      current: pathname === "/dashboard/notebook",
    },
    {
      name: "SMS",
      href: "/dashboard/sms",
      icon: Smartphone,
      current: pathname === "/dashboard/sms",
    },
    {
      name: "Subscriptions",
      href: "/dashboard/subscriptions",
      icon: Diamond,
      current: pathname === "/dashboard/subscriptions",
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
      case "/dashboard/suppliers":
        return "Suppliers";
      case "/dashboard/settings":
        return "Settings";
      case "/dashboard/subscriptions":
        return "Subscriptions";
      case "/dashboard/customers":
        return "Customers";
      case "/dashboard/banking":
        return "Banking";
      case "/dashboard/employees":
        return "Employees";
      case "/dashboard/duebook":
        return "Due Book";
      case "/dashboard/online-store":
        return "Online Store";
      case "/dashboard/notebook":
        return "Notebook";
      case "/dashboard/sms":
        return "SMS";
      default:
        return "Dashboard";
    }
  };

  // Get breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    if (pathSegments.length > 1) {
      // Add intermediate segments
      for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const href = "/" + pathSegments.slice(0, i + 1).join("/");

        // Convert segment to readable name
        const name = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        breadcrumbs.push({
          name: name,
          href: i === pathSegments.length - 1 ? undefined : href, // Last item has no href
        });
      }
    }

    return breadcrumbs.length > 0 ? breadcrumbs : undefined;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Sticky full width header */}
      <div className="sticky top-0 z-50">
        <Header
          user={user}
          onLogout={logout}
          onMenuClick={() => setSidebarOpen(true)}
          title={getPageTitle()}
          breadcrumbs={getBreadcrumbs()}
        />
      </div>

      {/* Content area with sidebar and main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          smsCredits={1250}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 lg:pl-64 relative">
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-slate-900">{children}</main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
