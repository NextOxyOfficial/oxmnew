"use client";

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 text-center text-[13px] text-slate-500 sm:flex-row sm:justify-between sm:text-left">
          <div>© 2025 OxyManager — সব অধিকার সংরক্ষিত।</div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              প্রাইভেসি পলিসি
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              শর্তাবলী
            </Link>
            <a href="mailto:support@oxymanager.com" className="hover:text-slate-900 transition-colors">
              সাপোর্ট
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
