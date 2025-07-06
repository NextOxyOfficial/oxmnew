"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import {
  Activity,
  Command,
  Database,
  Globe,
  MessageSquare,
  Settings,
  Shield,
  Terminal,
  type LucideIcon,
  X,
  Crown,
  MessageCircle,
  ShoppingCart,
  Package,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  current: boolean;
  category: string;
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  systemStatus?: number;
  securityLevel?: number;
  networkStatus?: number;
  smsCredits?: number;
  productCount?: number;
  totalRevenue?: number;
  ordersCount?: number;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  navigation, 
  systemStatus = 85, 
  securityLevel = 92, 
  networkStatus = 78,
  smsCredits: initialSmsCredits = 1250
}: SidebarProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [smsCredits, setSmsCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSmsCredits(null);
      return;
    }
    async function fetchSmsCredits() {
      try {
        const data = await ApiService.get("/my-sms-credits/");
        setSmsCredits(typeof data.credits === "number" ? data.credits : 0);
      } catch {
        setSmsCredits(0);
      }
    }
    fetchSmsCredits();
  }, [isAuthenticated]);

  return (
    <Fragment>
      {/* Mobile sidebar */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } fixed inset-0 z-50 lg:hidden mt-16`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm mt-16"
          onClick={onClose}
        ></div>
        <div className="fixed top-16 bottom-0 left-0 flex w-64 flex-col transform transition-transform duration-300 ease-out">
          <div className="bg-slate-900 border border-slate-700/30 rounded-lg m-4 h-full flex flex-col overflow-hidden">
            <div className="p-3 flex-1 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={onClose}
                  className="lg:hidden rounded-lg p-2 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subscription & SMS Credits Section */}
              <div className="mb-6">
                {/* SMS Credits with Pro Badge */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
                  {/* Pro Badge */}
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      <Crown className="h-3 w-3" />
                      PRO
                    </div>
                  </div>
                      <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-500/20 p-2">
                      <MessageCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-300">SMS Credits</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-emerald-400/70">{smsCredits === null ? (authLoading ? "..." : "Login to view") : smsCredits.toLocaleString()} available</div>
                        <Link href="/dashboard/subscriptions">
                          <ShoppingCart className="h-4 w-4 text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              
              <nav className="space-y-1 mb-8 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <CategorizedNavigation navigation={navigation} onItemClick={onClose} />
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-16 lg:bottom-0 z-40">
        <div className="bg-slate-900 border border-slate-700/30 rounded-lg my-6 mx-3 h-full flex flex-col overflow-hidden">
          <div className="p-3 flex-1 flex flex-col overflow-y-auto">
            {/* Subscription & SMS Credits Section */}
            <div className="mb-6">
              {/* SMS Credits with Pro Badge */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/30 rounded-xl py-5 px-2 relative overflow-hidden">
                {/* Pro Badge */}
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                    <Crown className="h-3 w-3" />
                    PRO
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-500/20 p-2">
                      <MessageCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-300">SMS Credits</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-emerald-400/70">{smsCredits === null ? (authLoading ? "..." : "Login to view") : smsCredits.toLocaleString()} available</div>
                        <Link href="/dashboard/subscriptions">
                          <ShoppingCart className="h-4 w-4 text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav className="space-y-1 mb-8 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategorizedNavigation navigation={navigation} onItemClick={onClose} />
            </nav>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

// Component for categorized navigation
function CategorizedNavigation({ 
  navigation, 
  onItemClick 
}: { 
  navigation: NavigationItem[]; 
  onItemClick?: () => void;
}) {
  const categories = {
    main: { label: "Overview", items: [] as NavigationItem[] },
    business: { label: "Business Operations", items: [] as NavigationItem[] },
    finance: { label: "Financial Management", items: [] as NavigationItem[] },
    hr: { label: "Human Resources", items: [] as NavigationItem[] },
    communication: { label: "Communication & Sales", items: [] as NavigationItem[] },
    tools: { label: "Tools & Utilities", items: [] as NavigationItem[] },
    settings: { label: "Settings", items: [] as NavigationItem[] },
  };

  // Group navigation items by category
  navigation.forEach(item => {
    if (categories[item.category as keyof typeof categories]) {
      categories[item.category as keyof typeof categories].items.push(item);
    }
  });

  return (
    <div>
      {Object.entries(categories).map(([key, category]) => {
        if (category.items.length === 0) return null;
        
        return (
          <div key={key}>
            <div>
              {category.items.map((item) => (
                <NavItem
                  key={item.name}
                  icon={item.icon}
                  label={item.name}
                  href={item.href}
                  active={item.current}
                  badge={item.badge}
                  onClick={onItemClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component for nav items
function NavItem({ 
  icon: Icon, 
  label, 
  href, 
  active,
  badge,
  onClick 
}: { 
  icon: LucideIcon; 
  label: string; 
  href: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  const getBadgeColors = (badgeType?: string) => {
    switch (badgeType) {
      case 'inventory':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'sales':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'payments':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'e-commerce':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'pro':
        return 'bg-gradient-to-r from-amber-400 to-orange-500 text-black border-0';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${
        active 
          ? "bg-slate-800/70 text-cyan-400 shadow-sm" 
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
      }`}
    >
      <div className="flex items-center">
        <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      
      {badge && (
        <span className={`
          px-2 py-0.5 text-xs font-medium rounded-full border
          ${getBadgeColors(badge)}
          ${badge === 'pro' ? 'font-bold' : ''}
        `}>
          {badge === 'inventory' && 'INV'}
          {badge === 'sales' && 'SALE'}
          {badge === 'payments' && 'PAY'}
          {badge === 'e-commerce' && 'WEB'}
          {badge === 'pro' && 'PRO'}
        </span>
      )}
    </Link>
  );
}

// Component for status items
function StatusItem({ label, value, color }: { label: string; value: number; color: string }) {
  const getColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-400 to-cyan-500"
      case "green":
        return "from-green-400 to-green-500"
      case "blue":
        return "from-blue-400 to-blue-500"
      case "purple":
        return "from-purple-400 to-purple-500"
      default:
        return "from-cyan-400 to-cyan-500"
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        <div className="text-xs text-slate-400 font-mono">{value}%</div>
      </div>
      <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}
