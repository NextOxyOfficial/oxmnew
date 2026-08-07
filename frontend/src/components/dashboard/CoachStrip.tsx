"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause } from "lucide-react";
import type { CoachMessage } from "@/lib/dashboardFeed";

/**
 * The advice strip at the top of the dashboard.
 *
 * One message at a time, rotating: six lines stacked would be a wall of text
 * nobody reads, and the point is that each one is a single thought.
 *
 * The bar under the text fills as the timer runs. Without it the strip looked
 * frozen between changes — there was no way to tell a working rotation from a
 * broken one, or to see that hovering had paused it.
 */
const ROTATE_MS = 8000;
const FADE_MS = 320;
/** How often the bar's target width is refreshed; CSS glides between ticks. */
const TICK_MS = 250;

const TONE: Record<string, { box: string; title: string; bar: string }> = {
  danger: {
    box: "border-rose-200 bg-rose-50",
    title: "text-rose-800",
    bar: "bg-rose-400",
  },
  warn: {
    box: "border-amber-200 bg-amber-50",
    title: "text-amber-800",
    bar: "bg-amber-400",
  },
  good: {
    box: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-800",
    bar: "bg-emerald-400",
  },
  info: {
    box: "border-cyan-200 bg-cyan-50",
    title: "text-cyan-800",
    bar: "bg-cyan-400",
  },
};

export default function CoachStrip({ messages }: { messages: CoachMessage[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  /** 0 → 1 across one interval; drives both the bar and the fade. */
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  const count = messages.length;
  const safeIndex = count ? index % count : 0;

  // Swapping the text mid-fade would show the new message already faded out,
  // so the change waits for the fade to finish.
  const goTo = useCallback(
    (next: number) => {
      setVisible(false);
      setProgress(0);
      window.setTimeout(() => {
        setIndex(next);
        setVisible(true);
      }, FADE_MS);
    },
    []
  );

  const step = useCallback(
    (delta: number) => {
      if (!count) return;
      goTo((index + delta + count) % count);
    },
    [count, goTo, index]
  );

  // A plain timer, not requestAnimationFrame: rAF stops entirely while the tab
  // is in the background, so the strip would sit on the same message until the
  // user came back and looked frozen. The tick is timestamp-based, so a
  // throttled timer still advances by real elapsed time rather than drifting.
  const startedAt = useRef<number>(0);
  const elapsed = useRef<number>(0);

  useEffect(() => {
    if (paused || count < 2) return;
    startedAt.current = Date.now() - elapsed.current;

    const timer = window.setInterval(() => {
      const spent = Date.now() - startedAt.current;
      elapsed.current = spent;
      const ratio = Math.min(1, spent / ROTATE_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        elapsed.current = 0;
        window.clearInterval(timer);
        goTo((index + 1) % count);
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [paused, count, index, goTo]);

  // A fresh message starts its own countdown.
  useEffect(() => {
    elapsed.current = 0;
    setProgress(0);
  }, [index]);

  if (!count) return null;

  const message = messages[safeIndex];
  const tone = TONE[message.tone] ?? TONE.info;

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors duration-300 ${tone.box}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span
          className={`text-2xl leading-none transition-all duration-300 ${
            visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
          aria-hidden
        >
          {message.emoji}
        </span>

        <div
          className={`min-w-0 flex-1 transition-all duration-300 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          <p className={`text-sm font-semibold ${tone.title}`}>
            {message.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">{message.detail}</p>
        </div>

        {count > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            {paused && (
              <Pause
                className="mr-0.5 h-3 w-3 text-slate-400"
                aria-label="থেমে আছে"
              />
            )}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="আগের কথা"
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="পরের কথা"
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {count > 1 && (
        <>
          <div className="flex items-center gap-1.5 px-4 pb-2">
            {messages.map((item, i) => (
              <button
                key={`${item.title}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1} নম্বর কথা`}
                aria-current={i === safeIndex}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === safeIndex
                    ? "w-6 bg-slate-600"
                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Hairline timer along the bottom edge. */}
          <div className="h-0.5 w-full bg-black/5">
            <div
              className={`h-full ${tone.bar}`}
              style={{
                width: `${progress * 100}%`,
                // No easing: a linear glide reads as a clock. Skipped while the
                // bar snaps back to zero, or it would crawl leftwards.
                transition:
                  progress === 0 ? "none" : `width ${TICK_MS}ms linear`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
