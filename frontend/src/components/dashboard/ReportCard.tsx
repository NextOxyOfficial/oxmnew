"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * One short report on the dashboard.
 *
 * Nine of these sit side by side, so the frame is defined once: same header
 * height, same empty state, same "see all" affordance. Anything per-report goes
 * in `children` — the card never guesses at the shape of a row.
 */
interface ReportCardProps {
  title: string;
  icon: LucideIcon;
  /** Where the full list lives. */
  href: string;
  hrefLabel?: string;
  /** Small figure in the header, e.g. a total or a count. */
  meta?: string;
  /** Shown instead of children when there is nothing yet. */
  empty: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

export default function ReportCard({
  title,
  icon: Icon,
  href,
  hrefLabel = "সব দেখুন",
  meta,
  empty,
  isEmpty,
  children,
}: ReportCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-800">
            {title}
          </span>
          {meta && (
            <span className="block truncate text-xs text-slate-500">{meta}</span>
          )}
        </span>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-50"
        >
          {hrefLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="flex-1 px-4 py-2">
        {isEmpty ? (
          <p className="py-6 text-center text-xs text-slate-400">{empty}</p>
        ) : (
          <ul className="divide-y divide-slate-100">{children}</ul>
        )}
      </div>
    </section>
  );
}

/**
 * A row inside a ReportCard: label on the left, figure on the right.
 *
 * Every report is "something happened / this much money", so one row component
 * keeps the nine cards visually identical instead of nine hand-rolled layouts.
 */
export function ReportRow({
  title,
  note,
  value,
  valueNote,
  tone,
  href,
}: {
  title: string;
  note?: string | null;
  value?: string;
  valueNote?: string | null;
  tone?: "pos" | "neg" | "warn";
  href?: string;
}) {
  const toneClass =
    tone === "pos"
      ? "money-pos"
      : tone === "neg"
      ? "money-neg"
      : tone === "warn"
      ? "text-amber-600"
      : "text-slate-800";

  const body = (
    <span className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-medium text-slate-800">
          {title}
        </span>
        {note && (
          <span className="block truncate text-xs text-slate-500">{note}</span>
        )}
      </span>
      {value && (
        <span className="shrink-0 text-right">
          <span className={`num block text-[0.8125rem] font-semibold ${toneClass}`}>
            {value}
          </span>
          {valueNote && (
            <span className="block text-xs text-slate-400">{valueNote}</span>
          )}
        </span>
      )}
    </span>
  );

  return (
    <li>
      {href ? (
        <Link href={href} className="block -mx-2 rounded px-2 hover:bg-slate-50">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
