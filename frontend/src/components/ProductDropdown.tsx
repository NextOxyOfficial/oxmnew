"use client";

import React, { memo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Product {
  id: number;
  name: string;
  product_code?: string;
  category_name?: string;
  supplier_name?: string;
  stock?: number;
  sell_price?: number;
  has_variants?: boolean;
  no_stock_required?: boolean;
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
    const { currencySymbol } = useCurrency();
    
    if (!isOpen || searchQuery.trim().length < 1) {
      return null;
    }

    return (
      <>
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[32rem] overflow-hidden"
          style={{
            bottom: "auto",
            top: "100%",
          }}
        >
          {isLoading || isSearching ? (
            <div className="flex items-center gap-2 p-3 text-[13px] text-slate-500">
              <div className="animate-spin h-4 w-4 border-2 border-slate-200 border-t-cyan-600 rounded-full"></div>
              {isSearching ? "খোঁজা হচ্ছে…" : "লোড হচ্ছে…"}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
              {searchResults.map((product, index) => (
                <div
                  key={`${product.id}-${index}`}
                  onClick={() => {
                    onProductSelect(
                      product.id.toString(),
                      `${product.name}${
                        product.product_code ? ` (${product.product_code})` : ""
                      }`
                    );
                  }}
                  className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-200 last:border-b-0"
                >
                  <div className="text-[13px] font-medium text-slate-900">
                    {highlightText(product.name, searchQuery.trim())}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {product.product_code && (
                      <span className="badge badge-muted num">
                        {product.product_code}
                      </span>
                    )}
                    {product.category_name && (
                      <span className="badge badge-info">
                        {product.category_name}
                      </span>
                    )}
                    {!product.no_stock_required && (
                      <span
                        className={`badge ${
                          (product.stock || 0) <= 0
                            ? "badge-danger"
                            : (product.stock || 0) <= 10
                            ? "badge-warn"
                            : "badge-muted"
                        }`}
                      >
                        স্টক: <span className="num">{product.stock || 0}</span>
                      </span>
                    )}
                    {product.no_stock_required && (
                      <span className="badge badge-info">সার্ভিস / ডিজিটাল</span>
                    )}
                    <span className="badge badge-success num">
                      {currencySymbol}{product.sell_price || 0}
                    </span>
                  </div>
                  {product.has_variants && (
                    <div className="mt-1 text-xs text-slate-500">
                      ভ্যারিয়েন্ট আছে
                    </div>
                  )}
                  {!product.has_variants && (product.stock || 0) <= 0 && !product.no_stock_required && (
                    <div className="mt-1 text-xs font-medium text-rose-600">
                      স্টক শেষ
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center">
              <div className="text-[13px] text-slate-600">
                &ldquo;{searchQuery}&rdquo; দিয়ে কিছু পাওয়া যায়নি
              </div>
              <div className="mt-1 text-xs text-slate-500">
                প্রোডাক্টের নাম, কোড বা ক্যাটাগরি দিয়ে খুঁজে দেখুন
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close dropdown - transparent backdrop */}
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-0" 
          onClick={onClose} 
          style={{ backgroundColor: 'transparent' }}
        />
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
