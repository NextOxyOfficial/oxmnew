"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

interface ProductSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onClear: () => void;
  isSearching: boolean;
  isLoading: boolean;
}

export interface ProductSearchInputRef {
  focus: () => void;
  blur: () => void;
}

const ProductSearchInput = forwardRef<
  ProductSearchInputRef,
  ProductSearchInputProps
>(({ value, onChange, onFocus, onClear, isSearching, isLoading }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    blur: () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
  }));

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        spellCheck="false"
        placeholder={
          isSearching
            ? "খোঁজা হচ্ছে…"
            : "প্রোডাক্টের নাম, কোড বা ক্যাটাগরি দিয়ে খুঁজুন"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onClick={(e) => {
          e.stopPropagation();
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
        disabled={isLoading} // Only disable when loading initial data, not during search
        className={`input pr-24 truncate ${
          isLoading ? "opacity-75 cursor-wait" : isSearching ? "opacity-90" : ""
        }`}
        style={{
          userSelect: 'text'
        }}
      />
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-11 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
          title="খোঁজা মুছে দিন"
          aria-label="খোঁজা মুছে দিন"
        >
          মুছুন
        </button>
      )}
      {/* Search icon or loading spinner */}
      {isSearching ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-slate-200 border-t-cyan-600 rounded-full"></div>
        </div>
      ) : (
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      )}
    </div>
  );
});

ProductSearchInput.displayName = "ProductSearchInput";

export default ProductSearchInput;
