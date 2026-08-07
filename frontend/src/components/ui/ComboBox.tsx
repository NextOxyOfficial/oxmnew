"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

export interface ComboOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  /** Text on the row that saves whatever was typed as a new option. */
  addLabel?: string;
  disabled?: boolean;
}

/**
 * A dropdown that also lets you type a new entry.
 *
 * A bare `<input list=…>` datalist looked like a plain text box — nothing told
 * the user a list existed, and on some browsers the suggestions never showed.
 * This opens a real list on click, filters as you type, and offers to keep
 * whatever you typed as a new option.
 */
export default function ComboBox({
  id,
  value,
  onChange,
  options,
  placeholder,
  addLabel = "নতুন হিসেবে যোগ করুন",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);
  const shown = open ? query : selected?.label ?? value;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  // Typing something the list does not contain becomes a new option.
  const typed = query.trim();
  const canAdd =
    typed.length > 0 &&
    !options.some((option) => option.label.toLowerCase() === typed.toLowerCase());

  useEffect(() => {
    if (!open) return;
    const onClickAway = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={shown}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="input pr-8"
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((prev) => !prev)}
          aria-label="তালিকা খুলুন"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {canAdd && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(typed)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cyan-700 hover:bg-cyan-50"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  “{typed}” — {addLabel}
                </span>
              </button>
            </li>
          )}

          {matches.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(option.value)}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="truncate text-slate-800">{option.label}</span>
                {option.value === value && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
                )}
              </button>
            </li>
          ))}

          {matches.length === 0 && !canAdd && (
            <li className="px-3 py-2 text-sm text-slate-500">কিছু পাওয়া যায়নি</li>
          )}
        </ul>
      )}
    </div>
  );
}
