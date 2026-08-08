"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

/**
 * A searchable "filter by …" dropdown, shared by every supplier tab.
 *
 * The three tabs each carried their own copy of this. They had drifted — one
 * had a shadow and z-10, the others no shadow and z-20 — and all three had the
 * same defect: the panel was `max-h-64 overflow-hidden` wrapping a list that
 * rendered past it, so a shop with more than a handful of suppliers saw the
 * list sliced off mid-row with no scrollbar and no way to reach the rest.
 *
 * Here the panel does not clip: the *list* scrolls, the search box stays put
 * above it, and the panel's height follows its content up to that limit. The
 * z-index sits above the sticky table header below it, and a shadow makes the
 * panel read as floating rather than as part of the table.
 */

export default function FilterSelect({
  value,
  options,
  onChange,
  allLabel = "সব",
  placeholder = "খুঁজুন…",
  label,
  className = "",
}: {
  /** The selected option, or "all". */
  value: string;
  options: string[];
  onChange: (next: string) => void;
  allLabel?: string;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // Escape matters here: the panel can cover the control that opened it, so
    // clicking away is not always available on a phone.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reopening should not inherit the last search — the shop is usually looking
  // for something else this time.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.toLowerCase().includes(needle));
  }, [options, query]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const Option = ({ text, selected }: { text: string; selected: boolean }) => (
    <button
      type="button"
      onClick={() => pick(text === allLabel ? "all" : text)}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
        selected ? "font-medium text-cyan-700" : "text-slate-600"
      }`}
    >
      <Check
        className={`h-3.5 w-3.5 shrink-0 ${
          selected ? "text-cyan-600" : "text-transparent"
        }`}
      />
      <span className="truncate">{text}</span>
    </button>
  );

  return (
    <div ref={boxRef} className={`relative w-full sm:w-auto ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="btn btn-ghost w-full justify-between sm:w-56"
      >
        <span className="truncate">{value === "all" ? allLabel : value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:min-w-[16rem]">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="input input-sm pl-7"
              autoFocus
            />
          </div>

          {/* The list scrolls; the panel does not clip. overscroll-contain
              stops a flick at the end of the list from scrolling the page
              behind it. */}
          <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
            <Option text={allLabel} selected={value === "all"} />
            {matches.map((option) => (
              <Option key={option} text={option} selected={value === option} />
            ))}
            {matches.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                “{query}” দিয়ে কিছু পাওয়া যায়নি
              </p>
            )}
          </div>

          {options.length > 8 && (
            <div className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
              <span className="num">{matches.length}</span> টা দেখাচ্ছে
            </div>
          )}
        </div>
      )}
    </div>
  );
}
