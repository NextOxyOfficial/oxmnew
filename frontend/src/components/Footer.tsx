"use client";

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900/50 backdrop-blur-xl border-t border-slate-700/50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <div className="text-sm text-slate-400">
            © 2025 OXM Project. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
