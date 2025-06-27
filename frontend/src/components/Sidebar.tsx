"use client";

import { Fragment, useEffect } from "react";
import Link from "next/link";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  current: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
}

export default function Sidebar({ isOpen, onClose, navigation }: SidebarProps) {
  // Add global styles for scrollbar hiding
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = scrollbarHideStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Fragment>
      {/* Mobile sidebar */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } fixed inset-0 z-50 lg:hidden`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col transform transition-transform duration-300 ease-out">
          <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border-r border-white/20 shadow-2xl">
            <div className="flex h-16 flex-shrink-0 items-center justify-between px-6 border-b border-white/20">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                OxyManager
              </h1>
              <button
                onClick={onClose}
                className="lg:hidden rounded-lg p-2 inline-flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto scrollbar-hide">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`${
                      item.current
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-l-4 border-blue-400 text-white shadow-lg"
                        : "border-l-4 border-transparent text-gray-300 hover:bg-white/10 hover:text-white hover:border-l-4 hover:border-blue-400/50"
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-r-lg transition-all duration-200 backdrop-blur-sm hover:shadow-md`}
                  >
                    <span className="mr-4 text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span className="truncate font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-white/20">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OxyManager
            </h1>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-l-4 border-blue-400 text-white shadow-lg"
                      : "border-l-4 border-transparent text-gray-300 hover:bg-white/10 hover:text-white hover:border-l-4 hover:border-blue-400/50"
                  } group flex items-center px-4 py-3 text-sm font-medium rounded-r-lg transition-all duration-200 backdrop-blur-sm hover:shadow-md`}
                >
                  <span className="mr-4 text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span className="truncate font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

const scrollbarHideStyles = `
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    scroll-behavior: smooth; /* Smooth scrolling */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  
  /* Ensure smooth scrolling and proper touch behavior on mobile */
  .scrollbar-hide {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
`;
