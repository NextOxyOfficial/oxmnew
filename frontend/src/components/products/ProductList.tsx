"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { Product, ProductVariant } from "@/types/product";

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

  return (
    <div className="flex-1 overflow-x-auto relative">
      {/* Search loading overlay */}
      {isSearching && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-slate-800/90 rounded-lg p-4 border border-slate-700/50 flex items-center gap-3">
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
            <span className="text-slate-200 text-sm">
              Searching products...
            </span>
          </div>
        </div>
      )}

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4 p-2 sm:p-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <button
                  onClick={() => onProductClick(product)}
                  className="text-left w-full group cursor-pointer"
                >
                  <h4 className="text-slate-100 font-medium line-clamp-2 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                    {product.name}
                  </h4>
                  {product.product_code && (
                    <p className="text-cyan-400 text-xs mt-1 font-mono">
                      {product.product_code}
                    </p>
                  )}
                </button>
                <p className="text-slate-400 text-sm mt-1">
                  {product.category_name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Stock</p>
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-slate-100">
                    {getDisplayStock(product)} units
                  </p>
                  {(() => {
                    const stock = getDisplayStock(product);
                    if (stock === 0) {
                      return (
                        <div title="Out of Stock">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      );
                    } else if (stock < 5) {
                      return (
                        <div title="Low Stock Warning">
                          <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Profit/Unit</p>
                {(() => {
                  const { buyPrice, sellPrice } = getDisplayPrices(product);
                  const profit = sellPrice - buyPrice;
                  const profitMargin =
                    sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                  const { totalProfit } = getProductTotals(product);

                  return (
                    <div className="space-y-1">
                      <p
                        className={`text-sm font-bold ${
                          profit > 0
                            ? "text-green-400"
                            : profit < 0
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                        {formatCurrency(Math.abs(profit))}
                      </p>
                      <p
                        className={`text-xs ${
                          profit > 0
                            ? "text-green-400/70"
                            : profit < 0
                            ? "text-red-400/70"
                            : "text-yellow-400/70"
                        }`}
                      >
                        {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                        {Math.abs(profitMargin).toFixed(1)}% margin
                      </p>
                      <div className="mt-2 pt-1 border-t border-slate-600">
                        <p className="text-sm font-semibold text-blue-400">
                          Total: {formatCurrency(totalProfit)}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Buy Price</p>
                <p className="text-sm font-medium text-red-400">
                  {formatCurrency(getDisplayPrices(product).buyPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Sale Price</p>
                <p className="text-sm font-medium text-green-400">
                  {formatCurrency(getDisplayPrices(product).sellPrice)}
                </p>
              </div>
            </div>

            {/* Total Values for Variant Products */}
            {product.has_variants && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Total Buy</p>
                    <p className="text-sm font-medium text-red-400">
                      {formatCurrency(getProductTotals(product).totalBuyPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Sale</p>
                    <p className="text-sm font-medium text-green-400">
                      {formatCurrency(getProductTotals(product).totalSellPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Profit</p>
                    <p className="text-sm font-medium text-purple-400">
                      {formatCurrency(getProductTotals(product).totalProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Qty</p>
                    <p className="text-sm font-medium text-cyan-400">
                      {getProductTotals(product).totalQuantity} units
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Variants section - simplified for the component */}
            {product.has_variants &&
              product.variants &&
              product.variants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400">
                      Variants ({product.variants.length})
                    </p>
                    <div className="text-xs text-slate-500">
                      {product.variants.reduce(
                        (total, variant) => total + (variant.stock || 0),
                        0
                      )}{" "}
                      total units
                    </div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {product.variants.slice(0, 3).map((variant, index) => (
                      <div
                        key={variant.id || index}
                        className="bg-slate-700/30 rounded-lg p-2"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex gap-2">
                            {variant.color && (
                              <span className="text-blue-400">
                                {variant.color}
                              </span>
                            )}
                            {variant.size && (
                              <span className="text-green-400">
                                {variant.size}
                              </span>
                            )}
                            {variant.weight && (
                              <span className="text-purple-400">
                                {variant.weight}
                                {variant.weight_unit}
                              </span>
                            )}
                          </div>
                          <div className="text-cyan-400">
                            {variant.stock || 0} units
                          </div>
                        </div>
                      </div>
                    ))}
                    {product.variants.length > 3 && (
                      <div className="text-center">
                        <button
                          onClick={() => onProductClick(product)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          View {product.variants.length - 3} more variants
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout - Simplified */}
      <div className="hidden lg:block">
        <table className="min-w-full">
          <thead className="bg-slate-900/95 backdrop-blur-sm z-10">
            <tr className="border-b border-slate-700/50 text-left">
              <th className="py-3 px-4 text-sm font-medium text-slate-300">
                Product Name
              </th>
              <th className="py-3 px-4 text-sm font-medium text-slate-300">
                Stock & Status
              </th>
              <th className="py-3 px-4 text-sm font-medium text-slate-300">
                Prices
              </th>
              <th className="py-3 px-4 text-sm font-medium text-slate-300">
                Profit
              </th>
              <th className="py-3 px-4 text-sm font-medium text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3 px-4 max-w-xs">
                  <button
                    onClick={() => onProductClick(product)}
                    className="text-left group w-full cursor-pointer"
                  >
                    <div className="text-sm font-medium text-slate-100 line-clamp-2 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                      {product.name}
                    </div>
                    {product.product_code && (
                      <div className="text-xs text-cyan-400 mt-1 font-mono">
                        {product.product_code}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      {product.category_name}
                    </div>
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-100">
                        {getDisplayStock(product)} units
                      </span>
                      {(() => {
                        const stock = getDisplayStock(product);
                        if (stock === 0) {
                          return (
                            <svg
                              className="w-4 h-4 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          );
                        } else if (stock < 5) {
                          return (
                            <svg
                              className="w-4 h-4 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {product.has_variants && (
                      <div className="text-xs text-purple-400">
                        {product.variants?.length || 0} variants
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-red-400">
                      Buy: {formatCurrency(getDisplayPrices(product).buyPrice)}
                    </div>
                    <div className="text-sm font-medium text-green-400">
                      Sell:{" "}
                      {formatCurrency(getDisplayPrices(product).sellPrice)}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {(() => {
                    const { buyPrice, sellPrice } = getDisplayPrices(product);
                    const profit = sellPrice - buyPrice;
                    return (
                      <div
                        className={`text-sm font-bold ${
                          profit > 0
                            ? "text-green-400"
                            : profit < 0
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {profit > 0 ? "+" : ""}
                        {formatCurrency(profit)}
                      </div>
                    );
                  })()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteConfirmation(product)}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No products found */}
      {products.length === 0 && !isSearching && (
        <div className="h-full flex flex-col items-center justify-center text-center py-12">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            No products found
          </h3>
          <p className="text-slate-400 mb-4">
            Try adjusting your search criteria or add a new product.
          </p>
        </div>
      )}
    </div>
  );
}
