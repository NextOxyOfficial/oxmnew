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
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={
          isSearching
            ? "Searching products..."
            : "Search products by name, product code, category..."
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        disabled={isLoading || isSearching}
        className={`w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
          isLoading || isSearching ? "opacity-75 cursor-wait" : ""
        }`}
      />
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-700/50"
          title="Clear search"
        >
          Clear
        </button>
      )}
      {/* Search icon or loading spinner */}
      {isSearching ? (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-cyan-500 rounded-full"></div>
        </div>
      ) : (
        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
