"use client";

import { useEffect, useRef, useState } from "react";
import { ApiService } from "@/lib/api";
import type { SuggestionProduct } from "@/types/product-form";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Which field of a matched product to write back on select. */
  field: "name" | "code";
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

/**
 * Text input that suggests products the shop already has.
 *
 * Both the name and the code field need identical debounce / blur / dropdown
 * behaviour, so it lives once here instead of twice on the page. Warning the
 * user about a near-duplicate is the whole point — product names must be unique.
 */
export default function SuggestInput({
  id,
  value,
  onChange,
  field,
  label,
  placeholder,
  required,
  error,
  hint,
}: Props) {
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [open, setOpen] = useState(false);
  // A ref, not state: the timer is bookkeeping, and storing it in state
  // re-rendered the whole form on every keystroke.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleChange = (next: string) => {
    onChange(next);

    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timer.current = setTimeout(async () => {
      try {
        const results = await ApiService.searchProducts(next.trim());
        const rows: SuggestionProduct[] = Array.isArray(results)
          ? results
          : results?.results ?? [];
        const filtered =
          field === "code" ? rows.filter((r) => r.product_code) : rows;
        setSuggestions(filtered.slice(0, 6));
        setOpen(filtered.length > 0);
      } catch {
        // A failed suggestion lookup must never block typing.
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);
  };

  const pick = (product: SuggestionProduct) => {
    onChange(field === "name" ? product.name : product.product_code || "");
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="label">
        {label} {required && "*"}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        // Delayed so a click on a suggestion lands before the list closes.
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="input"
        placeholder={placeholder}
        autoComplete="off"
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <li className="px-3 pb-1 text-[11px] text-slate-400">
            আগে থেকেই আছে — ক্লিক করলে বসে যাবে
          </li>
          {suggestions.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(product)}
                className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="min-w-0 truncate text-slate-800">
                  {field === "code" ? product.product_code : product.name}
                </span>
                <span className="num shrink-0 text-xs text-slate-400">
                  স্টক {product.total_stock ?? product.stock ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
