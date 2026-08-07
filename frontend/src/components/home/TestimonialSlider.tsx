"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

/**
 * Reviews, one at a time, sliding.
 *
 * A grid of three cards makes the reader skim all three and absorb none. One
 * quote at a time gets read. The strip carries its own progress bar so it never
 * looks frozen, pauses on hover and on touch, and can be swiped — the same
 * behaviour as the dashboard's coaching strip, so the two feel like one product.
 */

interface Review {
  name: string;
  role: string;
  initial: string;
  tone: string;
  quote: string;
}

const REVIEWS: Review[] = [
  {
    name: "মোঃ রফিকুল ইসলাম",
    role: "রফিক মোটরস, কুষ্টিয়া",
    initial: "র",
    tone: "bg-cyan-500",
    quote:
      "আগে কোন বাইকের কাগজ কোথায় আছে খুঁজতে আধা ঘণ্টা যেত। এখন চেসিস নম্বর দিলেই সব সামনে চলে আসে। কিস্তির হিসাবও নিজে থেকেই মেলে।",
  },
  {
    name: "সালমা বেগম",
    role: "সালমা স্টোর, রাজশাহী",
    initial: "স",
    tone: "bg-emerald-500",
    quote:
      "বাকির খাতাটাই সবচেয়ে কাজে লেগেছে। কার কাছে কত পাওনা এক ক্লিকে দেখি, এসএমএস দিয়ে মনে করিয়ে দিই। তিন মাসে অনেক পুরনো টাকা উঠে এসেছে।",
  },
  {
    name: "কামরুল হাসান",
    role: "হাসান ইলেকট্রনিক্স, ঢাকা",
    initial: "ক",
    tone: "bg-amber-500",
    quote:
      "দিন শেষে লাভ হলো না ক্ষতি — এটা জানতেই আগে রাত হয়ে যেত। এখন দোকান বন্ধ করার আগেই ফোনে দেখে নিই। কর্মচারীদের আলাদা লগইন দিয়েছি, যা দরকার শুধু সেটুকুই দেখে।",
  },
  {
    name: "আব্দুল করিম",
    role: "করিম ফার্মেসি, চট্টগ্রাম",
    initial: "আ",
    tone: "bg-rose-500",
    quote:
      "কোন ওষুধ ফুরিয়ে আসছে সেটা আগেই বলে দেয় — কত পিস আনতে হবে সেটাসহ। অন্ধের মতো অর্ডার দেওয়া বন্ধ হয়েছে, টাকাও কম আটকে থাকে।",
  },
];

const ROTATE_MS = 6500;
const TICK_MS = 200;

export default function TestimonialSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const touchStart = useRef<number | null>(null);

  const count = REVIEWS.length;

  const goTo = useCallback((next: number) => {
    elapsed.current = 0;
    setProgress(0);
    setIndex(((next % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (paused) return;
    const started = Date.now() - elapsed.current;
    const timer = window.setInterval(() => {
      const spent = Date.now() - started;
      elapsed.current = spent;
      const ratio = Math.min(1, spent / ROTATE_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        window.clearInterval(timer);
        goTo(index + 1);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [paused, index, goTo]);

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        setPaused(false);
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        // 45px of travel, so a tap or a vertical scroll does not count.
        if (Math.abs(delta) > 45) goTo(index + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
        {/* One rail holding every quote, shifted by whole viewport widths.
            Transform rather than re-rendering the text keeps it on the GPU. */}
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {REVIEWS.map((review) => (
            <figure key={review.name} className="w-full shrink-0 px-6 py-8 sm:px-10">
              <Quote className="h-7 w-7 text-cyan-200" />
              <blockquote className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
                {review.quote}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${review.tone}`}
                >
                  {review.initial}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {review.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {review.role}
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="h-0.5 w-full bg-slate-100">
          <div
            className="h-full bg-cyan-500"
            style={{
              width: `${progress * 100}%`,
              transition: progress === 0 ? "none" : `width ${TICK_MS}ms linear`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="আগের রিভিউ"
          className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {REVIEWS.map((review, i) => (
            <button
              key={review.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${i + 1} নম্বর রিভিউ`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-cyan-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="পরের রিভিউ"
          className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
