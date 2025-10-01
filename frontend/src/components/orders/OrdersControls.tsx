"use client";

import React from "react";

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
  return (
    <div className="flex flex-col gap-4 mb-6">
      <h3 className="text-xl font-bold text-slate-200">Sales History</h3>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Create A Sale Button */}
        <button
          onClick={onAddOrder}
          disabled={isNavigating}
          className={`px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
            isNavigating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
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
              Loading...
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
              Create A Sale
            </>
          )}
        </button>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search sales, customers... (Type #123 for order number)"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pr-20 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm ${
              searchInput.trim().startsWith('#') ? 'pl-24' : 'pl-10'
            }`}
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
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
          {searchInput.trim().startsWith('#') && (
            <div className="absolute left-10 top-1.5">
              <span className="text-xs text-cyan-400 font-medium bg-cyan-400/10 px-1.5 py-1 rounded border border-cyan-400/20 whitespace-nowrap">
                Order #
              </span>
            </div>
          )}
          
          {/* Quick tip */}
          {!searchInput.trim() && (
            <div className="absolute right-12 top-2.5">
              <div className="group relative">
                <svg
                  className="w-4 h-4 text-gray-500 hover:text-cyan-400 cursor-help"
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
                <div className="absolute right-0 top-6 hidden group-hover:block z-10 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg text-xs text-slate-300">
                  <p className="font-medium text-cyan-400 mb-1">Search Tips:</p>
                  <p>• Type <span className="text-cyan-400">#123</span> to search by order number</p>
                  <p>• Search by customer name or phone</p>
                  <p>• Search by product name</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Search loading indicator */}
          {(searchInput !== searchTerm || isSearching) && (
            <div className="absolute right-3 top-2.5">
              <svg
                className="w-5 h-5 text-cyan-400 animate-spin"
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
          className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[160px] cursor-pointer"
        >
          <option value="all" className="bg-slate-800">
            All Orders
          </option>
          <option value="with_customer" className="bg-slate-800">
            With Customer
          </option>
          <option value="without_customer" className="bg-slate-800">
            Without Customer
          </option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[180px] cursor-pointer"
        >
          <option value="date" className="bg-slate-800">
            Date (Newest)
          </option>
          <option value="product" className="bg-slate-800">
            Product Name
          </option>
          <option value="customer" className="bg-slate-800">
            Customer Name
          </option>
          <option value="amount-high" className="bg-slate-800">
            Amount: High to Low
          </option>
          <option value="amount-low" className="bg-slate-800">
            Amount: Low to High
          </option>
          <option value="quantity-high" className="bg-slate-800">
            Quantity: High to Low
          </option>
          <option value="quantity-low" className="bg-slate-800">
            Quantity: Low to High
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
