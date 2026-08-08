"use client";

import type { LucideIcon } from "lucide-react";

/**
 * One action on a table row, shown as an icon rather than hidden in a menu.
 *
 * The tables used to end in a "⋮" that opened an absolutely-positioned panel.
 * Two things were wrong with that. The panel was clipped: `.tbl-wrap` scrolls
 * horizontally, and an `overflow: auto` ancestor clips its descendants no
 * matter what z-index they carry — so the menu came out sliced in half with no
 * CSS fix short of a portal. And it cost two clicks and a guess to reach an
 * action the row had plenty of space to show outright.
 *
 * The label is not decoration: it is the accessible name, the hover tooltip,
 * and on a wide screen the visible text. An icon alone is a puzzle.
 */

export type RowActionTone = "default" | "primary" | "danger";

const TONES: Record<RowActionTone, string> = {
  default: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  primary: "text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700",
  danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-700",
};

export function RowAction({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
  /** Show the label beside the icon from `lg` up. Off by default: most rows
   *  carry three or four actions and the text would crowd them out. */
  showLabel = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: RowActionTone;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${TONES[tone]}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {showLabel && <span className="hidden lg:inline">{label}</span>}
    </button>
  );
}

/** The container. Right-aligned and non-wrapping, so a row's actions stay on
 *  one line even when the table is scrolled sideways. */
export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
      {children}
    </div>
  );
}
