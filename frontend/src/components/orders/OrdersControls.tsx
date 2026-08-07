"use client";

import React, { useEffect, useState } from "react";

interface OrdersControlsProps {
  searchInput: string;
  searchTerm: string;
  isSearching: boolean;
  filterCustomer: string;
  sortBy: string;
  isNavigating: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onAddOrder: () => void;
}

const OrdersControls: React.FC<OrdersControlsProps> = ({
  searchInput,
  searchTerm,
  isSearching,
  filterCustomer,
  sortBy,
  isNavigating,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onAddOrder,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="plane-section">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="section-title mb-0">বিক্রির খাতা</div>

        {/* Create A Sale Button */}
        <button
          onClick={onAddOrder}
          disabled={isNavigating}
          className="btn btn-primary"
        >
          {isNavigating ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              লোড হচ্ছে…
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              নতুন বিক্রি
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="অর্ডার বা কাস্টমার খুঁজুন (#১১০ দিলে অর্ডার আইডি, #০০১০ দিলে অর্ডার নম্বর)"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`input pr-16 ${
              searchInput.trim().startsWith("#") ? "pl-24" : "pl-9"
            }`}
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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

          {/* Search type indicator */}
          {searchInput.trim().startsWith("#") && (
            <div className="absolute left-9 top-1/2 -translate-y-1/2">
              <span className="badge badge-info">অর্ডার নং</span>
            </div>
          )}

          {/* Quick tip */}
          {!searchInput.trim() && (
            <div className="absolute right-9 top-1/2 -translate-y-1/2 hidden sm:block">
              <div className="group relative">
                <svg
                  className="w-4 h-4 text-slate-500 hover:text-cyan-600 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="absolute right-0 top-6 hidden group-hover:block z-10 w-52 p-2 bg-white border border-slate-200 rounded-lg shadow-lg text-xs text-slate-600">
                  <p className="font-medium text-cyan-600 mb-1">
                    খোঁজার টিপস:
                  </p>
                  <p>
                    • <span className="text-cyan-600">#১১০</span> লিখলে অর্ডার
                    আইডি দিয়ে খুঁজবে
                  </p>
                  <p>
                    • <span className="text-cyan-600">#০০১০</span> লিখলে অর্ডার
                    নম্বর দিয়ে খুঁজবে
                  </p>
                  <p>• কাস্টমারের নাম বা ফোন দিয়ে খুঁজুন</p>
                  <p>• প্রোডাক্টের নাম দিয়ে খুঁজুন</p>
                </div>
              </div>
            </div>
          )}

          {/* Search loading indicator */}
          {(searchInput !== searchTerm || isSearching) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-4 h-4 text-cyan-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>

        {/* Customer Filter */}
        <select
          value={filterCustomer}
          onChange={(e) => onFilterChange(e.target.value)}
          className="select sm:w-auto"
          aria-label="কাস্টমার ফিল্টার"
        >
          <option value="all">{isMobile ? "সব" : "সব অর্ডার"}</option>
          <option value="with_customer">
            {isMobile ? "কাস্টমারসহ" : "কাস্টমার আছে"}
          </option>
          <option value="without_customer">
            {isMobile ? "কাস্টমার ছাড়া" : "কাস্টমার নেই"}
          </option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="select sm:w-auto"
          aria-label="সাজানোর নিয়ম"
        >
          <option value="date">{isMobile ? "তারিখ" : "তারিখ (নতুন আগে)"}</option>
          <option value="product">{isMobile ? "প্রোডাক্ট" : "প্রোডাক্টের নাম"}</option>
          <option value="customer">
            {isMobile ? "কাস্টমার" : "কাস্টমারের নাম"}
          </option>
          <option value="amount-high">
            {isMobile ? "টাকা ↓" : "টাকা: বেশি থেকে কম"}
          </option>
          <option value="amount-low">
            {isMobile ? "টাকা ↑" : "টাকা: কম থেকে বেশি"}
          </option>
          <option value="quantity-high">
            {isMobile ? "পরিমাণ ↓" : "পরিমাণ: বেশি থেকে কম"}
          </option>
          <option value="quantity-low">
            {isMobile ? "পরিমাণ ↑" : "পরিমাণ: কম থেকে বেশি"}
          </option>
        </select>
      </div>
    </div>
  );
};

export default React.memo(OrdersControls, (prevProps, nextProps) => {
  // Return true if props are the same (don't re-render), false if different (re-render)
  return (
    prevProps.searchInput === nextProps.searchInput &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.isSearching === nextProps.isSearching &&
    prevProps.filterCustomer === nextProps.filterCustomer &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.isNavigating === nextProps.isNavigating
    // Don't compare functions as they should be memoized with useCallback
  );
});
