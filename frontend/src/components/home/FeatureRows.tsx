"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  MessageSquare,
  Package,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Reveal from "@/components/home/Reveal";

/**
 * The features, one per row, each with a picture of itself.
 *
 * Feature grids make a reader skim six tiles and remember none. A row gives one
 * idea the whole width: a short claim, three specifics, and — the part that
 * actually sells software — a picture of the screen doing it. Rows alternate
 * sides so the eye zig-zags down the page instead of sliding.
 *
 * Every "screenshot" is built from the same CSS the app uses, so it can never
 * go stale against a redesign, weighs nothing, and stays sharp on any display.
 */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-tr from-cyan-200/40 via-transparent to-emerald-200/40 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        {children}
      </div>
    </div>
  );
}

function PanelBar({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      <span className="ml-2 truncate text-[11px] font-medium text-slate-400">
        {label}
      </span>
    </div>
  );
}

/* ── The four pictures ─────────────────────────────────────────────── */

function StockPanel() {
  const rows = [
    { name: "GPX Demon GR200R", left: "4 দিন", qty: "6 পিস", urgent: true },
    { name: "Honda CB150R", left: "12 দিন", qty: "3 পিস", urgent: false },
    { name: "চেইন স্প্রোকেট সেট", left: "19 দিন", qty: "20 পিস", urgent: false },
  ];
  return (
    <Panel>
      <PanelBar label="স্টক — কী আনতে হবে" />
      <div className="space-y-2 p-4">
        {rows.map((row) => (
          <div
            key={row.name}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              row.urgent
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                row.urgent
                  ? "bg-rose-100 text-rose-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Package className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-800">
                {row.name}
              </span>
              <span
                className={`block text-[11px] ${
                  row.urgent ? "text-rose-600" : "text-slate-500"
                }`}
              >
                আর {row.left} পর শেষ
              </span>
            </span>
            <span className="num shrink-0 rounded-lg bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white">
              {row.qty}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DuePanel() {
  const rows = [
    { name: "আলী আহমেদ", amount: "৳16,574", days: "77 দিন", hot: true },
    { name: "করিম মিয়া", amount: "৳8,200", days: "31 দিন", hot: false },
    { name: "সালমা বেগম", amount: "৳3,150", days: "12 দিন", hot: false },
  ];
  return (
    <Panel>
      <PanelBar label="বাকির খাতা" />
      <div className="p-4">
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
          <p className="text-[11px] text-rose-700">মোট আটকে আছে</p>
          <p className="num text-xl font-bold text-rose-700">৳7,00,961</p>
          <p className="text-[11px] text-rose-600/80">36 জন কাস্টমারের কাছে</p>
        </div>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-slate-800">
                  {row.name}
                </span>
                <span
                  className={`block text-[10px] ${
                    row.hot ? "text-rose-600" : "text-slate-500"
                  }`}
                >
                  {row.days} ধরে
                </span>
              </span>
              <span className="num shrink-0 text-xs font-semibold text-rose-600">
                {row.amount}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[10px] font-semibold text-white">
                <MessageSquare className="h-3 w-3" />
                তাগাদা
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function StaffPanel() {
  const perms = [
    { label: "বিক্রি করা", on: true },
    { label: "প্রোডাক্ট দেখা", on: true },
    { label: "কেনা দাম দেখা", on: false },
    { label: "ব্যাংকিং", on: false },
    { label: "কর্মচারীর বেতন", on: false },
  ];
  return (
    <Panel>
      <PanelBar label="রোল সেটিংস" />
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white">
            আ
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-slate-800">
              আরিফুল ইসলাম
            </span>
            <span className="block text-[10px] text-slate-500">সেলসম্যান</span>
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            চালু
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {perms.map((perm) => (
            <div
              key={perm.label}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  perm.on
                    ? "border-cyan-600 bg-cyan-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {perm.on && <Check className="h-3 w-3" />}
              </span>
              <span className={perm.on ? "text-slate-700" : "text-slate-400"}>
                {perm.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function PayrollPanel() {
  const rows = [
    { name: "রফিকুল ইসলাম", salary: "৳15,000", state: "৳15,000 পাবে", tone: "text-rose-600" },
    { name: "আরিফুল ইসলাম", salary: "৳10,000", state: "৳4,000 অগ্রিম নিয়েছে", tone: "text-amber-600" },
    { name: "কামরুল ইসলাম", salary: "৳11,000", state: "হিসাব মিলে গেছে", tone: "text-emerald-600" },
  ];
  return (
    <Panel>
      <PanelBar label="বেতন ম্যানেজমেন্ট" />
      <div className="p-4">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 px-3 py-2">
            <p className="text-[10px] text-slate-500">মাসিক বেতন</p>
            <p className="num text-sm font-bold text-slate-900">৳1,23,000</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[10px] text-amber-700">অগ্রিম নেওয়া</p>
            <p className="num text-sm font-bold text-amber-700">৳4,000</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                {row.name}
              </span>
              <span className="num shrink-0 text-[11px] text-slate-500">
                {row.salary}
              </span>
              <span className={`shrink-0 text-[11px] font-semibold ${row.tone}`}>
                {row.state}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ── The rows ──────────────────────────────────────────────────────── */

const ROWS = [
  {
    icon: Bell,
    eyebrow: "স্টক",
    title: "কোন মাল ফুরিয়ে আসছে,",
    accent: "কত পিস আনতে হবে",
    body: "বিক্রির হার দেখে হিসাব করে কোন জিনিস আর কত দিনে শেষ হবে। অন্ধের মতো অর্ডার দেওয়া বন্ধ, অকারণে টাকা আটকে থাকাও বন্ধ।",
    points: [
      "প্রতিটা মালের জন্য আলাদা হিসাব",
      "কত পিস আনতে হবে সেটাসহ",
      "যেটা আগে ফুরাবে সেটা আগে দেখায়",
    ],
    Visual: StockPanel,
    flip: false,
  },
  {
    icon: Wallet,
    eyebrow: "বাকির খাতা",
    title: "কার কাছে কত টাকা,",
    accent: "কত দিন ধরে",
    body: "বাকির পুরো তালিকা এক পাতায়। কে কত দিন ধরে ফেলে রেখেছে সেটাসহ, আর সরাসরি এসএমএসে তাগাদা দেওয়ার বোতাম।",
    points: [
      "সবচেয়ে পুরনো বাকি আগে",
      "এক ক্লিকে তাগাদার এসএমএস",
      "টাকা এলে খাতা নিজে থেকেই মেলে",
    ],
    Visual: DuePanel,
    flip: true,
  },
  {
    icon: Users,
    eyebrow: "কর্মচারী",
    title: "কর্মচারীকে লগইন দিন,",
    accent: "যতটুকু দরকার ততটুকুই",
    body: "প্রত্যেকের আলাদা লগইন। 36টা অনুমতির মধ্যে যেগুলো টিক দেবেন সে শুধু সেগুলোই দেখবে — কেনা দাম বা ব্যাংকের হিসাব আড়ালে থাকবে।",
    points: [
      "নিজের ফোন নম্বর দিয়েই ঢোকে",
      "পাসওয়ার্ড আপনি ঠিক করেন",
      "যেকোনো সময় বন্ধ করে দিতে পারেন",
    ],
    Visual: StaffPanel,
    flip: false,
  },
  {
    icon: TrendingUp,
    eyebrow: "বেতন",
    title: "কে কত নিয়েছে,",
    accent: "কার কত বাকি",
    body: "মাঝ মাসে অগ্রিম নিলে সেটা বেতন থেকে নিজে থেকেই বাদ যায়। কেউ আয়ের চেয়ে বেশি নিয়ে ফেললে সেটাও আলাদা করে দেখায়।",
    points: [
      "একসাথে কয়েকজনকে বেতন দিন",
      "অগ্রিমের পুরো হিস্ট্রি থাকে",
      "বাকির হিসাব পিডিএফে নামানো যায়",
    ],
    Visual: PayrollPanel,
    flip: true,
  },
];

export default function FeatureRows() {
  return (
    <section id="how" className="relative overflow-hidden py-8 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_50%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-7xl px-2">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              কীভাবে কাজ করে
            </span>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              কথা নয় —
              <span className="block text-cyan-600">দেখে নিন কী হয়</span>
            </h2>
          </div>
        </Reveal>

        <div className="space-y-12 lg:space-y-16">
          {ROWS.map((row) => (
            <div
              key={row.eyebrow}
              className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              {/* On a phone the picture always follows its explanation; the
                  alternating order only applies once there are two columns. */}
              <Reveal className={row.flip ? "lg:order-2" : ""}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  <row.icon className="h-3.5 w-3.5" />
                  {row.eyebrow}
                </span>
                <h3 className="mt-4 text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
                  {row.title}
                  <span className="block bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                    {row.accent}
                  </span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {row.body}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {row.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={120} className={row.flip ? "lg:order-1" : ""}>
                <row.Visual />
              </Reveal>
            </div>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 sm:flex-row lg:mt-16">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-600/20">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  নিজের দোকানে চালিয়ে দেখুন
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  ফ্রি অ্যাকাউন্ট, কার্ড লাগবে না, মেয়াদও নেই
                </p>
              </div>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:bg-cyan-700"
            >
              শুরু করুন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
