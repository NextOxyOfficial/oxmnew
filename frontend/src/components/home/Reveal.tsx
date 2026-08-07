"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fade-and-lift a block the first time it scrolls into view.
 *
 * IntersectionObserver rather than a scroll listener: the browser does the
 * work off the main thread, so a long page stays smooth on a cheap phone.
 * It unobserves after firing — the animation is an entrance, not something
 * that should replay every time the reader scrolls back up.
 *
 * Anyone who has asked the OS for reduced motion simply gets the content.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Milliseconds, for staggering a row of cards. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Safety net. If IntersectionObserver never fires — a background tab that
    // is not compositing, an embedded webview, anything unexpected — the block
    // would stay at opacity 0 and the reader would see a blank page. An
    // entrance animation must never be able to hide the content it decorates.
    const failsafe = window.setTimeout(() => setShown(true), 1200);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.unobserve(entry.target);
        }
      },
      // Fire slightly before the block reaches the fold, so it has finished
      // arriving by the time the reader's eye gets there.
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
