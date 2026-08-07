"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { Product, ProductVariant } from "@/types/product";
import { Loader2, Pencil, Trash2 } from "lucide-react";

interface ProductListProps {
  products: Product[];
  isSearching: boolean;
  onProductClick: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteConfirmation: (product: Product) => void;
}

export default function ProductList({
  products,
  isSearching,
  onProductClick,
  onEditProduct,
  onDeleteConfirmation,
}: ProductListProps) {
  const formatCurrency = useCurrencyFormatter();

  // Helper functions using backend data structure
  const getBuyPrice = (product: Product, variant?: ProductVariant) => {
    if (variant) {
      return (
        Number(variant.buy_price) ||
        Number(variant.cost) ||
        Number(product.cost) ||
        Number(product.buy_price) ||
        0
      );
    }
    return Number(product.cost) || Number(product.buy_price) || 0;
  };

  const getSellPrice = (product: Product, variant?: ProductVariant) => {
    if (variant) {
      return (
        Number(variant.sell_price) ||
        Number(variant.price) ||
        Number(product.price) ||
        Number(product.sell_price) ||
        0
      );
    }
    return Number(product.price) || Number(product.sell_price) || 0;
  };

  // Get product totals using backend data structure
  const getProductTotals = (product: Product) => {
    return {
      buyPrice: product.has_variants
        ? Number(product.average_buy_price) || 0
        : getBuyPrice(product),
      sellPrice: product.has_variants
        ? Number(product.average_sell_price) || 0
        : getSellPrice(product),
      totalBuyPrice: Number(product.total_buy_price) || 0,
      totalSellPrice: Number(product.total_sell_price) || 0,
      totalStock: Number(product.total_stock) || Number(product.stock) || 0,
      totalProfit: Number(product.total_profit) || 0,
      totalQuantity:
        Number(product.total_quantity) || Number(product.stock) || 0,
    };
  };

  // Get display stock for product
  const getDisplayStock = (product: Product) => {
    return product.has_variants ? product.total_stock || 0 : product.stock || 0;
  };

  // Get display prices for sorting and display
  const getDisplayPrices = (product: Product) => {
    if (product.has_variants) {
      return {
        buyPrice: Number(product.average_buy_price) || 0,
        sellPrice: Number(product.average_sell_price) || 0,
      };
    } else {
      return {
        buyPrice: getBuyPrice(product),
        sellPrice: getSellPrice(product),
      };
    }
  };

  // Stock level badge shared by the mobile list and the desktop table
  const renderStockBadge = (product: Product) => {
    const stock = getDisplayStock(product);
    if (stock === 0) {
      return <span className="badge badge-danger">স্টক নাই</span>;
    }
    if (stock < 5) {
      return <span className="badge badge-warn">স্টক কম</span>;
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Search loading overlay */}
      {isSearching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
            <span className="text-sm text-slate-600">প্রোডাক্ট খোঁজা হচ্ছে…</span>
          </div>
        </div>
      )}

      {/* Mobile list — hairline-separated rows, no nested cards */}
      <div className="block divide-y divide-slate-200 lg:hidden">
        {products.map((product) => (
          <div key={product.id} className="px-4 py-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => onProductClick(product)}
                  className="group w-full text-left"
                >
                  <h4
                    className="truncate font-medium leading-tight text-slate-900 group-hover:text-cyan-600"
                    title={product.name}
                  >
                    {product.name}
                  </h4>
                  {product.product_code && (
                    <p className="mt-0.5 font-mono text-xs text-cyan-600">
                      {product.product_code}
                    </p>
                  )}
                </button>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {product.category_name}
                </p>
              </div>
              {renderStockBadge(product)}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-xs text-slate-500">স্টক</p>
                <p className="num text-sm font-medium text-slate-900">
                  {getDisplayStock(product)} টি
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">প্রতি পিসে লাভ</p>
                {(() => {
                  const { buyPrice, sellPrice } = getDisplayPrices(product);
                  const profit = sellPrice - buyPrice;
                  const profitMargin =
                    sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                  const { totalProfit } = getProductTotals(product);

                  return (
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          profit > 0
                            ? "money-pos"
                            : profit < 0
                            ? "money-neg"
                            : "num text-slate-600"
                        }`}
                      >
                        {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                        {formatCurrency(Math.abs(profit))}
                      </p>
                      <p className="num mt-0.5 text-xs text-slate-500">
                        {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                        {Math.abs(profitMargin).toFixed(1)}% মার্জিন
                      </p>
                      <p className="num mt-1 text-xs text-slate-600">
                        মোট: {formatCurrency(totalProfit)}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div>
                <p className="text-xs text-slate-500">কেনা দাম</p>
                <p className="num text-sm font-medium text-slate-900">
                  {formatCurrency(getDisplayPrices(product).buyPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">বিক্রির দাম</p>
                <p className="num text-sm font-medium text-slate-900">
                  {formatCurrency(getDisplayPrices(product).sellPrice)}
                </p>
              </div>
            </div>

            {/* Total Values for Variant Products */}
            {product.has_variants && (
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-3">
                <div>
                  <p className="text-xs text-slate-500">মোট কেনা</p>
                  <p className="num text-sm font-medium text-slate-900">
                    {formatCurrency(getProductTotals(product).totalBuyPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">মোট বিক্রি</p>
                  <p className="num text-sm font-medium text-slate-900">
                    {formatCurrency(getProductTotals(product).totalSellPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">মোট লাভ</p>
                  <p className="money-pos text-sm font-medium">
                    {formatCurrency(getProductTotals(product).totalProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">মোট পরিমাণ</p>
                  <p className="num text-sm font-medium text-slate-900">
                    {getProductTotals(product).totalQuantity} টি
                  </p>
                </div>
              </div>
            )}

            {/* Variants section - simplified for the component */}
            {product.has_variants &&
              product.variants &&
              product.variants.length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      ভ্যারিয়েন্ট ({product.variants.length})
                    </p>
                    <p className="num text-xs text-slate-500">
                      মোট{" "}
                      {product.variants.reduce(
                        (total, variant) => total + (variant.stock || 0),
                        0
                      )}{" "}
                      টি
                    </p>
                  </div>
                  <div className="max-h-32 divide-y divide-slate-200 overflow-y-auto">
                    {product.variants.slice(0, 3).map((variant, index) => (
                      <div
                        key={variant.id || index}
                        className="flex items-center justify-between gap-2 py-1.5 text-xs"
                      >
                        <div className="flex min-w-0 flex-wrap gap-2 text-slate-600">
                          {variant.color && <span>{variant.color}</span>}
                          {variant.size && <span>{variant.size}</span>}
                          {variant.weight && (
                            <span>
                              {variant.weight}
                              {variant.weight_unit}
                            </span>
                          )}
                        </div>
                        <div className="num shrink-0 text-slate-900">
                          {variant.stock || 0} টি
                        </div>
                      </div>
                    ))}
                    {product.variants.length > 3 && (
                      <div className="pt-2 text-center">
                        <button
                          onClick={() => onProductClick(product)}
                          className="text-xs font-medium text-cyan-600 hover:text-cyan-700"
                        >
                          আরও {product.variants.length - 3} টি ভ্যারিয়েন্ট দেখুন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onEditProduct(product)}
                className="btn btn-ghost btn-sm"
                title="এডিট করুন"
              >
                <Pencil className="h-3.5 w-3.5" />
                এডিট করুন
              </button>
              <button
                onClick={() => onDeleteConfirmation(product)}
                className="btn btn-ghost btn-sm"
                title="ডিলিট করুন"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                ডিলিট করুন
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table — flush in the plane */}
      <div className="hidden lg:block">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>প্রোডাক্টের নাম</th>
                <th>স্টক ও অবস্থা</th>
                <th className="cell-num">কেনা দাম</th>
                <th className="cell-num">বিক্রির দাম</th>
                <th className="cell-num">লাভ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="max-w-xs">
                    <button
                      onClick={() => onProductClick(product)}
                      className="group w-full text-left"
                    >
                      <div
                        className="cell-strong truncate group-hover:text-cyan-600"
                        title={product.name}
                      >
                        {product.name}
                      </div>
                      {product.product_code && (
                        <div className="mt-0.5 font-mono text-xs text-cyan-600">
                          {product.product_code}
                        </div>
                      )}
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {product.category_name}
                      </div>
                    </button>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="num text-slate-900">
                        {getDisplayStock(product)} টি
                      </span>
                      {renderStockBadge(product)}
                    </div>
                    {product.has_variants && (
                      <div className="mt-1 text-xs text-slate-500">
                        {product.variants?.length || 0} টি ভ্যারিয়েন্ট
                      </div>
                    )}
                  </td>
                  <td className="cell-num">
                    {formatCurrency(getDisplayPrices(product).buyPrice)}
                  </td>
                  <td className="cell-num">
                    {formatCurrency(getDisplayPrices(product).sellPrice)}
                  </td>
                  <td className="cell-num">
                    {(() => {
                      const { buyPrice, sellPrice } = getDisplayPrices(product);
                      const profit = sellPrice - buyPrice;
                      return (
                        <span
                          className={`font-semibold ${
                            profit > 0
                              ? "money-pos"
                              : profit < 0
                              ? "money-neg"
                              : "num text-slate-600"
                          }`}
                        >
                          {profit > 0 ? "+" : ""}
                          {formatCurrency(profit)}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        onClick={() => onEditProduct(product)}
                        className="btn btn-ghost btn-sm"
                        title="এডিট করুন"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        এডিট করুন
                      </button>
                      <button
                        onClick={() => onDeleteConfirmation(product)}
                        className="btn btn-ghost btn-sm"
                        title="ডিলিট করুন"
                        aria-label="ডিলিট করুন"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No products found */}
      {products.length === 0 && !isSearching && (
        <div className="empty">
          <p className="font-medium text-slate-600">কিছু পাওয়া যায়নি</p>
          <p className="mt-1 text-slate-500">
            খোঁজার শব্দ বদলে দেখুন, বা নতুন প্রোডাক্ট যোগ করুন।
          </p>
        </div>
      )}
    </div>
  );
}
