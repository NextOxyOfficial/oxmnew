"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { can } from "@/lib/access";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  BarChart3,
  Bike,
  LineChart,
  Package,
  ShoppingCart,
  Settings,
  Users,
  Briefcase,
  CreditCard,
  BookOpen,
  FolderLock,
  Building2,
  Smartphone,
  Diamond,
  Truck,
  Wallet,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const { isPro } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: "ড্যাশবোর্ড",
      href: "/dashboard",
      icon: BarChart3,
      current: pathname === "/dashboard",
      category: "main",
    },

    // Business Operations
    {
      name: "প্রোডাক্ট",
      href: "/dashboard/products",
      permission: "products.view",
      icon: Package,
      current: pathname.startsWith("/dashboard/products"),
      category: "business",
      badge: "inventory",
    },
    {
      name: "মোটর বাইক",
      href: "/dashboard/vehicles",
      permission: "vehicles.view",
      icon: Bike,
      current: pathname.startsWith("/dashboard/vehicles"),
      category: "business",
    },
    {
      name: "বিক্রি",
      href: "/dashboard/orders",
      permission: "orders.view",
      icon: ShoppingCart,
      current: pathname.startsWith("/dashboard/orders"),
      category: "business",
      badge: "sales",
    },
    {
      name: "কাস্টমার",
      href: "/dashboard/customers",
      permission: "customers.view",
      icon: Users,
      current: pathname.startsWith("/dashboard/customers"),
      category: "business",
    },
    {
      name: "সাপ্লায়ার",
      href: "/dashboard/suppliers",
      permission: "suppliers.view",
      icon: Truck,
      current: pathname.startsWith("/dashboard/suppliers"),
      category: "business",
    },

    // Financial Management
    {
      name: "অ্যানালিটিক্স",
      href: "/dashboard/analytics",
      permission: "analytics.view",
      icon: LineChart,
      current: pathname.startsWith("/dashboard/analytics"),
      category: "finance",
    },
    {
      name: "ব্যাংকিং",
      href: "/dashboard/banking",
      permission: "banking.view",
      icon: CreditCard,
      current: pathname.startsWith("/dashboard/banking"),
      category: "finance",
    },
    {
      name: "বাকির খাতা",
      href: "/dashboard/duebook",
      permission: "customers.due",
      icon: CreditCard,
      current: pathname.startsWith("/dashboard/duebook"),
      category: "finance",
      badge: "payments",
    },

    // Human Resources
    {
      name: "অফিস ম্যানেজমেন্ট",
      href: "/dashboard/employees/office-rent",
      permission: "banking.costs",
      icon: Building2,
      current: pathname.startsWith("/dashboard/employees/office-rent"),
      category: "hr",
    },
    {
      name: "কর্মচারী",
      href: "/dashboard/employees",
      permission: "employees.view",
      icon: Briefcase,
      // Exact-ish match, otherwise the rent page would light up this item too.
      current:
        pathname.startsWith("/dashboard/employees") &&
        !pathname.startsWith("/dashboard/employees/office-rent") &&
        !pathname.startsWith("/dashboard/employees/payroll"),
      category: "hr",
    },

    // Communication & Marketing
    {
      name: "এসএমএস সেন্টার",
      href: "/dashboard/sms",
      permission: "sms.send",
      icon: Smartphone,
      current: pathname.startsWith("/dashboard/sms"),
      category: "communication",
    },

    // Tools & Utilities
    {
      name: "জরুরি কাগজপত্র",
      href: "/dashboard/documents",
      permission: "documents.use",
      icon: FolderLock,
      current: pathname.startsWith("/dashboard/documents"),
      category: "tools",
    },
    {
      name: "নোটবুক",
      href: "/dashboard/notebook",
      permission: "notebook.use",
      icon: BookOpen,
      current: pathname.startsWith("/dashboard/notebook"),
      category: "tools",
    },
    {
      name: "সাবস্ক্রিপশন",
      href: "/dashboard/subscriptions",
      icon: Diamond,
      current: pathname.startsWith("/dashboard/subscriptions"),
      category: "tools",
      badge: isPro ? "pro" : undefined,
    },
    {
      name: "সেটিংস",
      href: "/dashboard/settings",
      permission: "settings.view",
      icon: Settings,
      current: pathname.startsWith("/dashboard/settings"),
      category: "settings",
    },
  ]
    // A staff login only sees what it may open. The server refuses the rest
    // anyway; hiding it keeps them out of dead ends.
    .filter((item) => !item.permission || can(user, item.permission));

  // Bangla labels for URL segments, used by the breadcrumb builder below.
  const segmentLabels: Record<string, string> = {
    dashboard: "ড্যাশবোর্ড",
    products: "প্রোডাক্ট",
    orders: "বিক্রি",
    customers: "কাস্টমার",
    suppliers: "সাপ্লায়ার",
    banking: "ব্যাংকিং",
    duebook: "বাকির খাতা",
    employees: "কর্মচারী",
    "office-rent": "অফিস ম্যানেজমেন্ট",
    payroll: "বেতন ম্যানেজমেন্ট",
    sms: "এসএমএস সেন্টার",
    documents: "জরুরি কাগজপত্র",
    notebook: "নোটবুক",
    subscriptions: "সাবস্ক্রিপশন",
    vehicles: "মোটর বাইক",
    analytics: "অ্যানালিটিক্স",
    settings: "সেটিংস",
    profile: "প্রোফাইল",
    add: "নতুন",
    new: "নতুন",
    edit: "এডিট",
    details: "বিস্তারিত",
    reports: "রিপোর্ট",
    categories: "ক্যাটাগরি",
  };

  // Get page title based on current path
  const getPageTitle = () => {
    switch (true) {
      case pathname === "/dashboard":
        return "ড্যাশবোর্ড";
      case pathname.startsWith("/dashboard/products"):
        return "প্রোডাক্ট ও স্টক";
      case pathname.startsWith("/dashboard/orders"):
        return "বিক্রি ও অর্ডার";
      case pathname.startsWith("/dashboard/vehicles"):
        return "মোটর বাইক";
      case pathname.startsWith("/dashboard/suppliers"):
        return "সাপ্লায়ার";
      case pathname.startsWith("/dashboard/customers"):
        return "কাস্টমার";
      case pathname.startsWith("/dashboard/analytics"):
        return "অ্যানালিটিক্স";
      case pathname.startsWith("/dashboard/banking"):
        return "ব্যাংকিং";
      case pathname.startsWith("/dashboard/employees/office-rent"):
        return "অফিস ম্যানেজমেন্ট";
      case pathname.startsWith("/dashboard/employees"):
        return "কর্মচারী";
      case pathname.startsWith("/dashboard/duebook"):
        return "বাকির খাতা";
      case pathname.startsWith("/dashboard/documents"):
        return "জরুরি কাগজপত্র";
      case pathname.startsWith("/dashboard/notebook"):
        return "নোটবুক";
      case pathname.startsWith("/dashboard/sms"):
        return "এসএমএস সেন্টার";
      case pathname.startsWith("/dashboard/subscriptions"):
        return "সাবস্ক্রিপশন";
      case pathname.startsWith("/dashboard/settings"):
        return "সেটিংস";
      default:
        return "ড্যাশবোর্ড";
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
        const name =
          segmentLabels[segment] ||
          segment
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

  // Show loading spinner during auth check or when redirecting
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center app-shell">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-cyan-600 mx-auto"
            role="status"
            aria-label="লোড হচ্ছে"
          ></div>
          <p className="mt-3 text-sm text-slate-500">লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  return (
    // Sidebar owns the full viewport height on the left; the header sits to
    // its RIGHT and spans only the content column. Previously the header ran
    // edge-to-edge above the sidebar, which left a gap at the top of the nav
    // when the page scrolled.
    //
    // overflow-x-clip, not -hidden: `hidden` makes this a scroll container,
    // and a sticky child sticks to that box instead of the viewport — which is
    // why the header stopped pinning.
    <div className="min-h-screen app-shell overflow-x-clip">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        smsCredits={1250}
        productCount={1250}
        totalRevenue={125000}
        ordersCount={342}
      />

      {/* Content column, offset by the sidebar's width on desktop */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <div className="sticky top-0 z-40">
          <Header
            user={user}
            onLogout={logout}
            onMenuClick={() => setSidebarOpen(true)}
            title={getPageTitle()}
            breadcrumbs={getBreadcrumbs()}
            smsCredits={1250}
            darkMode={false}
          />
        </div>

        <main className="flex-1 min-w-0">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
