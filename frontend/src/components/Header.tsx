"use client";

import React from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface HeaderProps {
  user: User;
  onLogout: () => Promise<void>;
  onMenuClick: () => void;
  title: string;
}

export default function Header({ user, onLogout, onMenuClick, title }: HeaderProps) {
  return (
    <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden rounded-md p-2 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-slate-100">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden md:flex items-center space-x-2 text-slate-300">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-slate-900 font-medium text-sm">
                {(user.first_name?.[0] || user.username[0]).toUpperCase()}
              </div>
              <span className="text-sm">
                {user.first_name || user.username}
              </span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={onLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-500/30 hover:border-red-400/50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
