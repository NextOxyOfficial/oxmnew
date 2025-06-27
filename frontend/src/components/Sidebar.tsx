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
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  navigation, 
  systemStatus = 85, 
  securityLevel = 92, 
  networkStatus = 78 
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
            <div className="p-4 flex-1">
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={onClose}
                  className="lg:hidden rounded-lg p-2 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-5 w-5" />
                </button>
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
        <div className="bg-slate-900 border border-slate-700/30 rounded-lg m-4 h-full flex flex-col">
          <div className="p-4 flex-1">
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
