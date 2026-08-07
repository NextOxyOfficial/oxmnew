"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  type LucideIcon,
  X,
  Crown,
  MessageCircle,
  Plus,
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

export default function Sidebar({ isOpen, onClose, navigation }: SidebarProps) {
  const { isAuthenticated, loading: authLoading, profile } = useAuth();
  const { isPro, isLoading: subscriptionLoading } = useSubscription();
  const [smsCredits, setSmsCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSmsCredits(null);
      return;
    }
    if (profile && typeof profile.sms_credits === "number") {
      setSmsCredits(profile.sms_credits);
    } else {
      setSmsCredits(0);
    }
  }, [isAuthenticated, profile]);

  // Credit figure shown in the SMS strip: "…" while we do not know it yet.
  const creditLabel =
    smsCredits === null
      ? authLoading || isAuthenticated
        ? "…"
        : "লগইন করুন"
      : smsCredits.toLocaleString();

  const smsPanel = (
    <div className="px-3 py-3 border-b border-slate-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          এসএমএস ব্যালেন্স
        </span>
        <span className={`badge ${isPro ? "badge-warn" : "badge-muted"}`}>
          <Crown className="h-3 w-3" />
          {subscriptionLoading ? "…" : isPro ? "প্রো" : "ফ্রি"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="text-[15px] font-semibold text-slate-900 num truncate">
            {creditLabel}
          </span>
        </span>
        <Link
          href="/dashboard/subscriptions"
          onClick={onClose}
          className="btn btn-ghost btn-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          কিনুন
        </Link>
      </div>

      {!isPro && !subscriptionLoading && (
        <Link
          href="/dashboard/subscriptions"
          onClick={onClose}
          className="mt-2 inline-block text-xs font-medium text-cyan-600 hover:text-cyan-700"
        >
          প্রো তে আপগ্রেড করুন
        </Link>
      )}
    </div>
  );

  return (
    <Fragment>
      {/* Mobile sidebar — off-canvas drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-slate-900/30 transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white border-r border-slate-200 shadow-xl transition-transform duration-200 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3">
            <span className="flex items-center gap-2">
              <Image
                src="/logo-mark.png"
                alt="OxyManager"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-lg"
                priority
              />
              <span className="text-[15px] font-semibold text-slate-900">
                OxyManager
              </span>
            </span>
            <button
              onClick={onClose}
              aria-label="মেনু বন্ধ করুন"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {smsPanel}

          <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide">
            <CategorizedNavigation navigation={navigation} onItemClick={onClose} />
          </nav>
        </aside>
      </div>

      {/* Desktop sidebar */}
      {/* Full viewport height — the header now sits to the right of this rail,
          not above it, so the nav starts at the very top of the screen. */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-50 bg-white border-r border-slate-200">
        {/* The brand lives here, at the top of the rail. The header used to
            carry a second copy, which read as two logos on one screen. */}
        <Link
          href="/dashboard"
          className="flex h-16 shrink-0 items-center border-b border-slate-200 px-3"
        >
          {/* The full lockup, same as the public site — it already carries the
              wordmark, so no separate text sits beside it. */}
          <Image
            src="/logo.png"
            alt="OxyManager — Your Smart Assistant"
            width={378}
            height={96}
            className="h-11 w-auto"
            priority
          />
        </Link>

        {smsPanel}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide">
          <CategorizedNavigation navigation={navigation} />
        </nav>
      </aside>
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
    main: { label: "এক নজরে", items: [] as NavigationItem[] },
    business: { label: "ব্যবসা", items: [] as NavigationItem[] },
    finance: { label: "হিসাব-নিকাশ", items: [] as NavigationItem[] },
    hr: { label: "কর্মচারী", items: [] as NavigationItem[] },
    communication: { label: "যোগাযোগ", items: [] as NavigationItem[] },
    tools: { label: "টুলস", items: [] as NavigationItem[] },
    settings: { label: "সেটিংস", items: [] as NavigationItem[] },
  };

  // Group navigation items by category
  navigation.forEach(item => {
    if (categories[item.category as keyof typeof categories]) {
      categories[item.category as keyof typeof categories].items.push(item);
    }
  });

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([key, category]) => {
        if (category.items.length === 0) return null;

        return (
          <div key={key}>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {category.label}
            </div>
            <div className="space-y-0.5">
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
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 w-full items-center justify-between gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors ${
        active
          ? "bg-cyan-50 text-cyan-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon
          className={`h-4 w-4 shrink-0 ${active ? "text-cyan-600" : "text-slate-400"}`}
        />
        <span className="truncate" title={label}>{label}</span>
      </span>

      {badge === "pro" && (
        <span className="badge badge-warn">প্রো</span>
      )}
    </Link>
  );
}
