"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

/**
 * The hero.
 *
 * A landing page for financial software has one job above the fold: show the
 * numbers. So instead of a stock photo there is a working miniature of the
 * real dashboard — the same figures, the same colours, the same coaching line
 * the app actually produces. It counts up on load, which does two things: it
 * proves the page is alive, and it makes the reader watch the number.
 *
 * All of it is CSS and SVG. No image to download, no library, nothing that can
 * fail to load on a slow connection — which matters when most visitors arrive
 * on a phone over mobile data.
 */

/** Ease-out so the count decelerates instead of stopping dead. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Respect a reader who has asked the OS for less motion.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOut(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const taka = (n: number) => "৳" + n.toLocaleString("bn-BD");

/** Bars for the seven-day trend. Fixed values — this is a picture, not a chart. */
const TREND = [42, 58, 47, 71, 63, 88, 96];

function DashboardMock() {
  const revenue = useCountUp(184500);
  const profit = useCountUp(46200);
  const due = useCountUp(23800);

  return (
    <div className="relative">
      {/* Glow behind the card, so it lifts off the section background. */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-cyan-200/40 via-transparent to-emerald-200/40 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        {/* Window chrome — reads instantly as "this is the software". */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 truncate text-[11px] font-medium text-slate-400">
            oxymanager.com/dashboard
          </span>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {/* The coaching line the real app writes. */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <span className="text-lg leading-none">🎯</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                আজ আরও ৳১২,৪০০ বিক্রি দরকার
              </p>
              <p className="mt-0.5 text-[11px] text-amber-800/80">
                দিনের খরচ উঠতে ৳১৯,৬০০ লাগে
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "আজকের বিক্রি", value: taka(revenue), tone: "text-slate-900" },
              { label: "লাভ", value: taka(profit), tone: "text-emerald-600" },
              { label: "বাকি", value: taka(due), tone: "text-rose-600" },
            ].map((cell) => (
              <div
                key={cell.label}
                className="rounded-xl border border-slate-200 px-2.5 py-2"
              >
                <p className="truncate text-[10px] text-slate-500">{cell.label}</p>
                <p
                  className={`num mt-0.5 truncate text-[13px] font-bold sm:text-sm ${cell.tone}`}
                >
                  {cell.value}
                </p>
              </div>
            ))}
          </div>

          {/* Seven-day trend. The bars grow on load via a CSS transition. */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                গত ৭ দিনের বিক্রি
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                ২৮%
              </span>
            </div>
            <div className="flex h-16 items-end gap-1.5">
              {TREND.map((height, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-cyan-400 transition-[height] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    height: `${height}%`,
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <p className="min-w-0 truncate text-[11px] text-slate-600">
              <span className="font-medium text-slate-800">GPX Demon</span> — আর ৪
              দিনে স্টক শেষ, ৬ পিস আনুন
            </p>
          </div>
        </div>
      </div>

      {/* Floating chips. Hidden on the smallest screens, where they would sit
          on top of the numbers rather than beside them. */}
      <div className="pointer-events-none absolute -left-3 top-1/3 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg sm:block">
        <span className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span className="text-[11px] font-semibold text-slate-700">
            লাভ বেড়েছে
          </span>
        </span>
      </div>
      <div className="pointer-events-none absolute -right-3 bottom-16 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg sm:block">
        <span className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-cyan-600" />
          <span className="text-[11px] font-semibold text-slate-700">
            ৩ জনের বেতন দেওয়া হলো
          </span>
        </span>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Grid + glow backdrop. `overflow-hidden` on the section keeps both from
          widening the page on a phone. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-full max-w-[36rem] -translate-x-1/2 rounded-full bg-cyan-100/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* ── Copy ─────────────────────────────────────────────── */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              বাংলাদেশের ব্যবসার জন্য তৈরি
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              দোকানের হিসাব
              <span className="mt-1 block bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                নিজে থেকেই মিলে যাক
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              স্টক, বিক্রি, বাকি, ব্যাংক আর কর্মচারী — সব এক জায়গায়। আর প্রতিদিন
              বলে দেয় কত বিক্রি করলে খরচ উঠবে, কোন মাল ফুরিয়ে আসছে, কার কাছে টাকা
              আটকে আছে।
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:bg-cyan-700 hover:shadow-cyan-600/30"
              >
                ফ্রি অ্যাকাউন্ট খুলুন
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#industries"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                আমার দোকানে চলবে?
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500 lg:justify-start">
              {["কার্ড লাগবে না", "ফ্রি প্ল্যানের মেয়াদ নেই", "যেকোনো সময় বন্ধ"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    {item}
                  </span>
                )
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-2">
                {["bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"].map(
                  (tone, i) => (
                    <span
                      key={tone}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${tone}`}
                    >
                      {["ম", "ক", "স", "র"][i]}
                    </span>
                  )
                )}
              </div>
              <p className="text-sm text-slate-600">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <BadgeCheck className="h-4 w-4 text-cyan-600" />
                  ১০,০০০+
                </span>{" "}
                ব্যবসায়ী ব্যবহার করছেন
              </p>
            </div>
          </div>

          {/* ── The product itself ───────────────────────────────── */}
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}
