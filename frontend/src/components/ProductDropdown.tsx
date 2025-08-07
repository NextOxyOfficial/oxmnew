"use client";

import React, { memo } from "react";

interface Product {
  id: number;
  name: string;
  product_code?: string;
  category_name?: string;
  supplier_name?: string;
  stock?: number;
  sell_price?: number;
  has_variants?: boolean;
}

interface ProductDropdownProps {
  isOpen: boolean;
  searchQuery: string;
  searchResults: Product[];
  isLoading: boolean;
  isSearching: boolean;
  onProductSelect: (productId: string, displayText: string) => void;
  onClose: () => void;
  highlightText: (text: string, query: string) => React.ReactNode;
}

const ProductDropdown = memo<ProductDropdownProps>(
  ({
    isOpen,
    searchQuery,
    searchResults,
    isLoading,
    isSearching,
    onProductSelect,
    onClose,
    highlightText,
  }) => {
    if (!isOpen || searchQuery.trim().length < 1) {
      return null;
    }

    return (
      <>
        <div
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
          style={{
            bottom: "auto",
            top: "100%",
          }}
        >
          {isLoading || isSearching ? (
            <div className="p-3 text-slate-400 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-cyan-500 rounded-full"></div>
              {isSearching ? "Searching products..." : "Loading products..."}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-60 overflow-y-auto dropdown-scroll">
              {searchResults.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onProductSelect(
                      product.id.toString(),
                      `${product.name}${
                        product.product_code ? ` (${product.product_code})` : ""
                      }`
                    );
                  }}
                  className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                >
                  <div className="text-white font-medium">
                    {highlightText(product.name, searchQuery.trim())}
                  </div>
                  <div className="text-slate-400 text-sm flex flex-wrap items-center gap-2">
                    {product.product_code && (
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">
                        Code: {product.product_code}
                      </span>
                    )}
                    {product.category_name && (
                      <span className="bg-blue-900/50 px-2 py-0.5 rounded text-xs text-blue-300">
                        {product.category_name}
                      </span>
                    )}
                    <span
                      className={`font-medium px-2 py-0.5 rounded text-xs ${
                        (product.stock || 0) <= 0
                          ? "text-red-400 bg-red-900/30"
                          : (product.stock || 0) <= 10
                          ? "text-yellow-400 bg-yellow-900/30"
                          : "text-cyan-400 bg-cyan-900/30"
                      }`}
                    >
                      Stock: {product.stock || 0}
                    </span>
                    <span className="text-green-400 bg-green-900/30 px-2 py-0.5 rounded text-xs font-medium">
                      ${product.sell_price || 0}
                    </span>
                  </div>
                  {product.has_variants && (
                    <div className="text-xs text-blue-400 mt-1">
                      Has variants available
                    </div>
                  )}
                  {!product.has_variants && (product.stock || 0) <= 0 && (
                    <div className="text-xs text-red-400 mt-1 font-medium">
                      Out of Stock
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-slate-400 text-center">
              <div className="text-sm">
                No products found for &ldquo;{searchQuery}
                &rdquo;
              </div>
              <div className="text-xs mt-1 text-slate-500">
                Try searching by product name, product code, or category
              </div>
            </div>
          )}
          {/* Show indicator when there are more than 5 results */}
          {searchResults.length > 5 && (
            <div className="p-2 text-xs text-slate-500 bg-slate-700/30 border-t border-slate-600/50 text-center">
              Showing 5 of {searchResults.length} results. Type more to refine
              search.
            </div>
          )}
        </div>

        {/* Click outside to close dropdown */}
        <div className="fixed inset-0 z-5" onClick={onClose} />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo to prevent unnecessary re-renders
    return (
      prevProps.isOpen === nextProps.isOpen &&
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.searchResults.length === nextProps.searchResults.length &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isSearching === nextProps.isSearching &&
      JSON.stringify(prevProps.searchResults) ===
        JSON.stringify(nextProps.searchResults)
    );
  }
);

ProductDropdown.displayName = "ProductDropdown";

export default ProductDropdown;
