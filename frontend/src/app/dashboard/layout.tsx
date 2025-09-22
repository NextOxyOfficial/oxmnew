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
      category: "main",
    },

    // Business Operations
    {
      name: "Products",
      href: "/dashboard/products",
      icon: Package,
      current: pathname.startsWith("/dashboard/products"),
      category: "business",
      badge: "inventory",
    },
    {
      name: "Sales",
      href: "/dashboard/orders",
      icon: ShoppingCart,
      current: pathname.startsWith("/dashboard/orders"),
      category: "business",
      badge: "sales",
    },
    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: Users,
      current: pathname.startsWith("/dashboard/customers"),
      category: "business",
    },
    {
      name: "Suppliers",
      href: "/dashboard/suppliers",
      icon: Truck,
      current: pathname.startsWith("/dashboard/suppliers"),
      category: "business",
    },

    // Financial Management
    {
      name: "Banking",
      href: "/dashboard/banking",
      icon: CreditCard,
      current: pathname.startsWith("/dashboard/banking"),
      category: "finance",
    },
    {
      name: "Due Book",
      href: "/dashboard/duebook",
      icon: CreditCard,
      current: pathname.startsWith("/dashboard/duebook"),
      category: "finance",
      badge: "payments",
    },

    // Human Resources
    {
      name: "Employees",
      href: "/dashboard/employees",
      icon: Briefcase,
      current: pathname.startsWith("/dashboard/employees"),
      category: "hr",
    },

    // Communication & Marketing
    {
      name: "SMS Center",
      href: "/dashboard/sms",
      icon: Smartphone,
      current: pathname.startsWith("/dashboard/sms"),
      category: "communication",
    },

    // Tools & Utilities
    {
      name: "Notebook",
      href: "/dashboard/notebook",
      icon: BookOpen,
      current: pathname.startsWith("/dashboard/notebook"),
      category: "tools",
    },
    {
      name: "Subscriptions",
      href: "/dashboard/subscriptions",
      icon: Diamond,
      current: pathname.startsWith("/dashboard/subscriptions"),
      category: "tools",
      badge: "pro",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: pathname.startsWith("/dashboard/settings"),
      category: "settings",
    },
  ];

  // Get page title based on current path
  const getPageTitle = () => {
    switch (true) {
      case pathname === "/dashboard":
        return "Dashboard Overview";
      case pathname.startsWith("/dashboard/products"):
        return "Product Management";
      case pathname.startsWith("/dashboard/orders"):
        return "Sales Management";
      case pathname.startsWith("/dashboard/suppliers"):
        return "Supplier Management";
      case pathname.startsWith("/dashboard/customers"):
        return "Customer Management";
      case pathname.startsWith("/dashboard/banking"):
        return "Banking Management";
      case pathname.startsWith("/dashboard/employees"):
        return "Human Resources";
      case pathname.startsWith("/dashboard/duebook"):
        return "Due Book & Payments";
      case pathname.startsWith("/dashboard/notebook"):
        return "Business Notebook";
      case pathname.startsWith("/dashboard/sms"):
        return "SMS Communication";
      case pathname.startsWith("/dashboard/subscriptions"):
        return "Subscriptions & Plans";
      case pathname.startsWith("/dashboard/settings"):
        return "System Settings";
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
          smsCredits={1250}
          darkMode={true}
        />
      </div>

      {/* Content area with sidebar and main content */}
      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          smsCredits={1250}
          productCount={1250}
          totalRevenue={125000}
          ordersCount={342}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 lg:pl-64 relative">
          {/* Main Content */}
          <main className="flex-1 bg-slate-900">{children}</main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
