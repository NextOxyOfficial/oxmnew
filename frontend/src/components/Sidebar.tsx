"use client";

import { Fragment, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  current: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  systemStatus?: number;
  securityLevel?: number;
  networkStatus?: number;
  smsCredits?: number;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  navigation, 
  systemStatus = 85, 
  securityLevel = 92, 
  networkStatus = 78,
  smsCredits = 1250
}: SidebarProps) {
  // Remove the scrollbar styles effect since we're using a different design
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
          <div className="bg-slate-900 border border-slate-700/30 rounded-lg m-4 h-full flex flex-col">
            <div className="p-3 flex-1">
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
                        <div className="text-xs text-emerald-400/70">{smsCredits.toLocaleString()} available</div>
                        <Link href="/dashboard/subscriptions">
                          <ShoppingCart className="h-4 w-4 text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              
              <nav className="space-y-1 mb-8">
                {navigation.map((item) => (
                  <NavItem
                    key={item.name}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    active={item.current}
                    onClick={onClose}
                  />
                ))}
              </nav>

              <div className="mt-auto pt-6">
                <div className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">SYSTEM STATUS</div>
                <div className="space-y-4">
                  <StatusItem label="Core Systems" value={systemStatus} color="cyan" />
                  <StatusItem label="Security" value={securityLevel} color="green" />
                  <StatusItem label="Network" value={networkStatus} color="blue" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-16 lg:bottom-0 z-40">
        <div className="bg-slate-900 border border-slate-700/30 rounded-lg my-6 mx-3 h-full flex flex-col">
          <div className="p-3 flex-1">
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
                        <div className="text-xs text-emerald-400/70">{smsCredits.toLocaleString()} available</div>
                        <Link href="/dashboard/subscriptions">
                          <ShoppingCart className="h-4 w-4 text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav className="space-y-1 mb-8">
              {navigation.map((item) => (
                <NavItem
                  key={item.name}
                  icon={item.icon}
                  label={item.name}
                  href={item.href}
                  active={item.current}
                />
              ))}
            </nav>

            <div className="mt-auto pt-6">
              <div className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">SYSTEM STATUS</div>
              <div className="space-y-4">
                <StatusItem label="Core Systems" value={systemStatus} color="cyan" />
                <StatusItem label="Security" value={securityLevel} color="green" />
                <StatusItem label="Network" value={networkStatus} color="blue" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

// Component for nav items
function NavItem({ 
  icon: Icon, 
  label, 
  href, 
  active, 
  onClick 
}: { 
  icon: LucideIcon; 
  label: string; 
  href: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center justify-start px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${
        active 
          ? "bg-slate-800/70 text-cyan-400 shadow-sm" 
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
      }`}
    >
      <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
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
