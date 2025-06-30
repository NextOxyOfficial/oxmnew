"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "@/types/product";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

export default function ProductsPage() {
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

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
    // Always use backend calculated totals when available
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

  // Fetch products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const productsData = await ApiService.getProducts();

        // Handle different response formats
        const productsList = Array.isArray(productsData)
          ? productsData
          : productsData?.results || [];
        setProducts(productsList);

        // Extract unique categories from products
        const uniqueCategories = [
          ...new Set(
            productsList
              .map((product: Product) => product.category_name)
              .filter(Boolean)
          ),
        ] as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load products"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProductClick = (product: Product) => {
    router.push(`/dashboard/products/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    // Navigate to edit page
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await ApiService.deleteProduct(productToDelete.id);

      // Remove product from local state
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

      setShowDeleteModal(false);
      setProductToDelete(null);

      // Show success notification
      showNotification(
        "success",
        `"${productToDelete.name}" has been deleted successfully`
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      // Show error notification
      showNotification("error", "Failed to delete product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteConfirmation = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleAddProduct = () => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push("/dashboard/products/add");
    }, 300);
  };

  // Calculate totals from dynamic data using backend structure
  const totalProducts = products.length;
  const totalBuyPrice = products.reduce((sum, product) => {
    const { totalBuyPrice } = getProductTotals(product);
    return sum + totalBuyPrice;
  }, 0);

  const totalSalePrice = products.reduce((sum, product) => {
    const { totalSellPrice } = getProductTotals(product);
    return sum + totalSellPrice;
  }, 0);

  const estimatedProfit = totalSalePrice - totalBuyPrice;

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || product.category_name === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock-high":
          const aStock = getDisplayStock(a);
          const bStock = getDisplayStock(b);
          return bStock - aStock;
        case "stock-low":
          const aStockLow = getDisplayStock(a);
          const bStockLow = getDisplayStock(b);
          return aStockLow - bStockLow;
        case "price-high":
          const aSellPrice = getDisplayPrices(a).sellPrice;
          const bSellPrice = getDisplayPrices(b).sellPrice;
          return bSellPrice - aSellPrice;
        case "price-low":
          const aSellPriceLow = getDisplayPrices(a).sellPrice;
          const bSellPriceLow = getDisplayPrices(b).sellPrice;
          return aSellPriceLow - bSellPriceLow;
        default:
          return 0;
      }
    });

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4"
                >
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Products
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your inventory and track product performance
          </p>
        </div>

        {/* Notification */}
        {notification.isVisible && (
          <div
            className={`p-4 rounded-lg border mb-6 ${
              notification.type === "success"
                ? "bg-green-500/10 border-green-400/30 text-green-300"
                : "bg-red-500/10 border-red-400/30 text-red-300"
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === "success" ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Products */}
          <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-cyan-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-300 font-medium">
                  Total Products
                </p>
                <p className="text-base font-bold text-cyan-400">
                  {totalProducts}
                </p>
                <p className="text-xs text-cyan-500 opacity-80">
                  Active inventory items
                </p>
              </div>
            </div>
          </div>

          {/* Total Buy Price */}
          <div className="bg-gradient-to-br from-red-500/15 to-red-600/8 border border-red-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-red-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-red-300 font-medium">
                  Total Buy Price
                </p>
                <p className="text-base font-bold text-red-400">
                  {formatCurrency(totalBuyPrice)}
                </p>
                <p className="text-xs text-red-500 opacity-80">
                  Total investment
                </p>
              </div>
            </div>
          </div>

          {/* Total Sale Price */}
          <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-green-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">
                  Total Sale Price
                </p>
                <p className="text-base font-bold text-green-400">
                  {formatCurrency(totalSalePrice)}
                </p>
                <p className="text-xs text-green-500 opacity-80">
                  Potential revenue
                </p>
              </div>
            </div>
          </div>

          {/* Estimated Profit */}
          <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/8 border border-purple-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-purple-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2v-14a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-purple-300 font-medium">
                  Estimated Profit
                </p>
                <p className="text-base font-bold text-purple-400">
                  {formatCurrency(estimatedProfit)}
                </p>
                <p className="text-xs text-purple-500 opacity-80">
                  If all sold at full price
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table/List */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="sm:p-4 p-2">
            {/* Header and filters */}
            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-xl font-bold text-slate-200">
                Product Inventory
              </h3>

              {/* Controls */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Add Product Button */}
                <button
                  onClick={handleAddProduct}
                  disabled={isNavigating}
                  className={`px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                    isNavigating
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
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
                      Add Product
                    </>
                  )}
                </button>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
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
                </div>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[160px]"
                >
                  <option value="all" className="bg-slate-800">
                    All Categories
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-slate-800"
                    >
                      {category}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[180px]"
                >
                  <option value="name" className="bg-slate-800">
                    Sort by Name
                  </option>
                  <option value="stock-high" className="bg-slate-800">
                    Stock: High to Low
                  </option>
                  <option value="stock-low" className="bg-slate-800">
                    Stock: Low to High
                  </option>
                  <option value="price-high" className="bg-slate-800">
                    Price: High to Low
                  </option>
                  <option value="price-low" className="bg-slate-800">
                    Price: Low to High
                  </option>
                </select>
              </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <button
                        onClick={() => handleProductClick(product)}
                        className="text-left w-full group"
                      >
                        <h4 className="text-slate-100 font-medium line-clamp-2 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                          {product.name}
                        </h4>
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
                        const { buyPrice, sellPrice } =
                          getDisplayPrices(product);
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
                            {formatCurrency(
                              getProductTotals(product).totalBuyPrice
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Total Sale</p>
                          <p className="text-sm font-medium text-green-400">
                            {formatCurrency(
                              getProductTotals(product).totalSellPrice
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Total Profit</p>
                          <p className="text-sm font-medium text-purple-400">
                            {formatCurrency(
                              getProductTotals(product).totalProfit
                            )}
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

                  {/* Show variants section only if variants exist and have data */}
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
                          {product.variants
                            .slice(0, 4)
                            .map((variant, index) => (
                              <div
                                key={variant.id || index}
                                className="bg-slate-700/30 rounded-lg p-2"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1 mb-1">
                                      {variant.color && (
                                        <span className="text-xs text-blue-400">
                                          {variant.color}
                                        </span>
                                      )}
                                      {variant.size && (
                                        <span className="text-xs text-green-400">
                                          {variant.size}
                                        </span>
                                      )}
                                      {variant.weight && (
                                        <span className="text-xs text-purple-400">
                                          {variant.weight}
                                          {variant.weight_unit}
                                        </span>
                                      )}
                                      {variant.custom_variant && (
                                        <span className="text-xs text-orange-400">
                                          {variant.custom_variant}
                                        </span>
                                      )}
                                      {!variant.color &&
                                        !variant.size &&
                                        !variant.weight &&
                                        !variant.custom_variant && (
                                          <span className="text-xs text-slate-400">
                                            Variant {index + 1}
                                          </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-1 text-xs">
                                      {" "}
                                      <div>
                                        <span className="text-slate-500">
                                          Buy:
                                        </span>
                                        <div className="text-red-400 font-medium">
                                          {formatCurrency(
                                            getBuyPrice(product, variant)
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">
                                          Sell:
                                        </span>
                                        <div className="text-green-400 font-medium">
                                          {formatCurrency(
                                            getSellPrice(product, variant)
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">
                                          Profit:
                                        </span>
                                        <div
                                          className={`font-medium ${(() => {
                                            const buyPrice = getBuyPrice(
                                              product,
                                              variant
                                            );
                                            const sellPrice = getSellPrice(
                                              product,
                                              variant
                                            );
                                            const profit = sellPrice - buyPrice;
                                            return profit > 0
                                              ? "text-green-400"
                                              : profit < 0
                                              ? "text-red-400"
                                              : "text-yellow-400";
                                          })()}`}
                                        >
                                          {(() => {
                                            const buyPrice = getBuyPrice(
                                              product,
                                              variant
                                            );
                                            const sellPrice = getSellPrice(
                                              product,
                                              variant
                                            );
                                            const profit = sellPrice - buyPrice;
                                            return (
                                              (profit >= 0 ? "+" : "") +
                                              formatCurrency(Math.abs(profit))
                                            );
                                          })()}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">
                                          Stock:
                                        </span>
                                        <div className="text-cyan-400 font-medium">
                                          {variant.stock || 0}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {product.variants.length > 4 && (
                            <div className="text-center">
                              <button
                                onClick={() => handleProductClick(product)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                View {product.variants.length - 4} more variants
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left">
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Product Name
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Stock & Sold
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Buy & Sale Price
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Profit/Unit
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <button
                          onClick={() => handleProductClick(product)}
                          className="text-left group w-full"
                        >
                          <div className="text-sm font-medium text-slate-100 line-clamp-2 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {product.category_name}
                          </div>
                          {/* Variants Indicator */}
                          {product.has_variants &&
                            product.variants &&
                            product.variants.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                  </svg>
                                  {product.variants.length} variants
                                </div>
                                <div className="text-xs text-slate-500">
                                  Click to view details
                                </div>
                              </div>
                            )}
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
                          <div className="text-xs text-slate-400">
                            {product.sold || 0} sold
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-red-400">
                            {formatCurrency(getDisplayPrices(product).buyPrice)}
                          </div>
                          <div className="text-sm font-medium text-green-400">
                            {formatCurrency(
                              getDisplayPrices(product).sellPrice
                            )}
                          </div>
                          {/* Show price range for variant products */}
                          {product.has_variants &&
                            product.variants &&
                            product.variants.length > 0 && (
                              <div className="text-xs text-slate-500">
                                {(() => {
                                  const buyPrices = product.variants
                                    .map((v) => getBuyPrice(product, v))
                                    .filter((p) => p > 0);
                                  const sellPrices = product.variants
                                    .map((v) => getSellPrice(product, v))
                                    .filter((p) => p > 0);
                                  if (
                                    buyPrices.length > 1 ||
                                    sellPrices.length > 1
                                  ) {
                                    const minBuy = Math.min(...buyPrices);
                                    const maxBuy = Math.max(...buyPrices);
                                    const minSell = Math.min(...sellPrices);
                                    const maxSell = Math.max(...sellPrices);
                                    return (
                                      <div>
                                        <div>
                                          Buy: {formatCurrency(minBuy)} -{" "}
                                          {formatCurrency(maxBuy)}
                                        </div>
                                        <div>
                                          Sell: {formatCurrency(minSell)} -{" "}
                                          {formatCurrency(maxSell)}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const { buyPrice, sellPrice } =
                            getDisplayPrices(product);
                          const profit = sellPrice - buyPrice;
                          const profitMargin =
                            sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                          const totals = getProductTotals(product);

                          return (
                            <div className="space-y-1">
                              <div
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
                              </div>
                              <div
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
                              </div>
                              {/* Show total profit for all products */}
                              <div className="text-xs text-cyan-400 font-medium">
                                Total: {formatCurrency(totals.totalProfit)}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                            className="text-slate-300 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Edit"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(product);
                            }}
                            className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Delete"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleProductClick(product)}
                            className="bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                            title="Add Stock"
                          >
                            Add Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* No products found */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
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
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  Add First Product
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Delete Product
              </h3>
              <p className="text-slate-300 mb-4">
                Are you sure you want to delete &quot;{productToDelete.name}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
