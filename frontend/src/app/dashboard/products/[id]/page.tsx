"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { StockEntry } from "@/types/product";
import {
  ArrowLeft,
  History,
  Package,
  Palette,
  Plus,
  Ruler,
  Weight,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  cost: number;
  status?: "active" | "inactive" | "out_of_stock";
  image?: string;
  main_photo?: string;
  description?: string;
  supplier?: string;
  location?: string;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
  // Additional fields from API
  category_name?: string;
  supplier_name?: string;
  buy_price?: number;
  sell_price?: number;
  has_variants?: boolean;
  is_active?: boolean;
  total_stock?: number;
  average_buy_price?: number;
  average_sell_price?: number;
  sold?: number;
}

interface ProductVariant {
  id: number;
  color?: string;
  size?: string;
  weight?: number;
  weight_unit?: "g" | "kg" | "lb" | "oz";
  custom_variant?: string;
  stock: number;
  price_adjustment?: number;
  sku_suffix?: string;
  // Additional pricing fields that might come from API
  buy_price?: number;
  sell_price?: number;
  cost?: number;
  price?: number;
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"addStock" | "history">(
    "addStock"
  );
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockHistory, setStockHistory] = useState<StockEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });
  const [stockForm, setStockForm] = useState({
    quantity: "",
    buy_price: "",
    sell_price: "",
    reason: "restock",
    notes: "",
    variant_id: "",
  });

  const formatCurrency = useCurrencyFormatter();

  const loadStockHistory = async () => {
    if (!product?.id) return;

    setIsLoadingHistory(true);
    try {
      console.log(`Loading stock history for product ${product.id}...`);
      const response = await ApiService.getProductStockMovements(product.id);
      console.log("Raw movements data:", response);

      // Handle both paginated and direct array responses
      let movements;
      if (Array.isArray(response)) {
        movements = response;
      } else if (response && Array.isArray(response.results)) {
        movements = response.results;
      } else {
        console.error("Expected array but got:", typeof response, response);
        setStockHistory([]);
        return;
      }

      // Transform backend data to match frontend interface
      const transformedHistory: StockEntry[] = movements.map(
        (movement: any) => {
          console.log("Processing movement:", movement);

          // Determine if it's an add or remove operation
          const isAddition =
            movement.quantity > 0 || movement.movement_type === "in";

          // Get user name from various possible fields
          let createdBy = "System";
          if (movement.user_name && movement.user_name.trim()) {
            createdBy = movement.user_name;
          } else if (movement.username) {
            createdBy = movement.username;
          } else if (movement.user) {
            if (typeof movement.user === "string") {
              createdBy = movement.user;
            } else if (movement.user.first_name || movement.user.last_name) {
              createdBy = `${movement.user.first_name || ""} ${
                movement.user.last_name || ""
              }`.trim();
            } else if (movement.user.username) {
              createdBy = movement.user.username;
            }
          }

          return {
            id: movement.id,
            quantity: Math.abs(movement.quantity),
            type: isAddition ? "add" : "remove",
            reason:
              movement.reason ||
              movement.movement_type_display ||
              "Stock adjustment",
            cost_per_unit: movement.cost_per_unit,
            total_cost: movement.total_cost,
            notes: movement.notes,
            variant_id: movement.variant,
            variant_details: movement.variant_display,
            created_at: movement.created_at,
            created_by: createdBy,
            movement_type: movement.movement_type,
            movement_type_display: movement.movement_type_display,
            previous_stock: movement.previous_stock,
            new_stock: movement.new_stock,
          };
        }
      );

      console.log("Transformed history:", transformedHistory);
      setStockHistory(transformedHistory);
    } catch (error) {
      console.error("Error loading stock history:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error details:", (error as any).details);
      }
      setStockHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  // Fetch product details on component mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching product details for ID:", productId);
        const productData = await ApiService.getProduct(parseInt(productId));
        console.log("Product response:", productData);
        console.log("Product variants:", productData?.variants);

        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load product"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Load product data and stock history when product changes
  useEffect(() => {
    if (product?.id) {
      loadStockHistory();
    }
  }, [product?.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="bg-slate-900 rounded-xl p-6">
              <div className="h-6 bg-slate-700 rounded w-64 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-48 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-10 bg-slate-700 rounded"></div>
                  <div className="h-32 bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/products")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Products
          </button>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <div className="text-red-500 mb-4">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Product
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/products")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Products
          </button>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              Product Not Found
            </h3>
            <p className="text-slate-400 mb-4">
              The requested product could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStock(true);

    try {
      const stockData = {
        quantity: parseInt(stockForm.quantity),
        reason: stockForm.reason,
        notes: stockForm.notes || undefined,
        variant_id: stockForm.variant_id
          ? parseInt(stockForm.variant_id)
          : undefined,
      };

      console.log("Adding stock:", {
        productId: product.id,
        ...stockData,
      });

      // Call the actual API to adjust stock
      await ApiService.adjustProductStock(product.id, stockData);

      // Reset form
      setStockForm({
        quantity: "",
        buy_price: "",
        sell_price: "",
        reason: "restock",
        notes: "",
        variant_id: "",
      });

      // Refresh product data to show updated stock
      console.log("Fetching updated product details...");
      const updatedProduct = await ApiService.getProduct(product.id);
      setProduct(updatedProduct);

      // Refresh stock history
      await loadStockHistory();

      // Show success message
      showNotification(
        "success",
        `Successfully added ${stockData.quantity} units to stock!`
      );
    } catch (error) {
      console.error("Error adding stock:", error);
      // Show error message
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add stock";
      showNotification("error", errorMessage);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const getTotalStock = () => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (total, variant) => total + variant.stock,
        0
      );
    }
    return product.stock;
  };
  console.log("Product details:", product);

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/dashboard/products")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Products
            </button>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Product Details
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage inventory and product information
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

        {/* Main Layout */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="flex flex-col lg:flex-row">
            {/* Left Section - Product Info */}
            <div className="w-full lg:w-2/5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-800/10">
              {/* Product Name */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {product.name}
                </h3>

                {/* Pricing Information */}
                {(!product.variants || product.variants.length === 0) && (
                  <div className="mt-4">
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 border border-slate-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 mb-1">Buy Price</p>
                          <p className="text-white font-medium">
                            {(() => {
                              const buyPrice =
                                product.buy_price ||
                                product.cost ||
                                product.average_buy_price;
                              return buyPrice
                                ? formatCurrency(Number(buyPrice))
                                : "N/A";
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Sell Price</p>
                          <p className="text-white font-medium">
                            {(() => {
                              const sellPrice =
                                product.sell_price ||
                                product.price ||
                                product.average_sell_price;
                              return sellPrice
                                ? formatCurrency(Number(sellPrice))
                                : "N/A";
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Profit per Unit</p>
                          <p
                            className={`font-medium ${(() => {
                              const buyPrice = Number(
                                product.buy_price ||
                                  product.cost ||
                                  product.average_buy_price ||
                                  0
                              );
                              const sellPrice = Number(
                                product.sell_price ||
                                  product.price ||
                                  product.average_sell_price ||
                                  0
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
                              const buyPrice = Number(
                                product.buy_price ||
                                  product.cost ||
                                  product.average_buy_price ||
                                  0
                              );
                              const sellPrice = Number(
                                product.sell_price ||
                                  product.price ||
                                  product.average_sell_price ||
                                  0
                              );
                              if (buyPrice === 0 && sellPrice === 0)
                                return "N/A";
                              const profit = sellPrice - buyPrice;
                              return (
                                (profit >= 0 ? "+" : "") +
                                formatCurrency(Math.abs(profit))
                              );
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Image */}
              <div className="mb-6">
                <div className="w-full h-48 sm:h-56 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-center overflow-hidden relative">
                  {product.main_photo ? (
                    <Image
                      src={ApiService.getImageUrl(product.main_photo)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center">
                              <div class="w-16 h-16 text-gray-400 mx-auto mb-2 flex items-center justify-center">
                                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                </svg>
                              </div>
                              <p class="text-sm text-gray-500">Image failed to load</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No image available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Basic Info */}
              <div className="space-y-4">
                {/* SKU and Stock Row */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">SKU</p>
                    <p className="text-white font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Stock</p>
                    <p className="text-cyan-400 font-bold text-lg">
                      {getTotalStock()} units
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Category</p>
                    <p className="text-white font-medium">
                      {product.category_name || product.category || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Supplier</p>
                    <p className="text-white font-medium">
                      {product.supplier_name || product.supplier || "N/A"}
                    </p>
                  </div>
                  {product.location && (
                    <div className="col-span-2">
                      <p className="text-slate-400 mb-1">Location</p>
                      <p className="text-white font-medium">
                        {product.location}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 mb-1">Created</p>
                    <span className="text-slate-400">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Updated</p>
                    <span className="text-slate-400">
                      {new Date(product.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-3 text-sm">
                      Variants
                    </h4>
                    <div className="space-y-3">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 border border-slate-700/50 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {variant.color && (
                                  <div className="flex items-center space-x-1">
                                    <Palette className="w-3 h-3 text-slate-400" />
                                    <span className="text-sm text-blue-400">
                                      {variant.color}
                                    </span>
                                  </div>
                                )}
                                {variant.size && (
                                  <div className="flex items-center space-x-1">
                                    <Ruler className="w-3 h-3 text-slate-400" />
                                    <span className="text-sm text-green-400">
                                      {variant.size}
                                    </span>
                                  </div>
                                )}
                                {variant.weight && (
                                  <div className="flex items-center space-x-1">
                                    <Weight className="w-3 h-3 text-slate-400" />
                                    <span className="text-sm text-purple-400">
                                      {variant.weight}
                                      {variant.weight_unit}
                                    </span>
                                  </div>
                                )}
                                {variant.custom_variant && (
                                  <span className="text-sm text-orange-400">
                                    {variant.custom_variant}
                                  </span>
                                )}
                              </div>

                              {/* Pricing Information for Variants */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-500">
                                    Buy Price:
                                  </span>
                                  <div className="text-slate-300 font-medium">
                                    {(() => {
                                      const variantBuyPrice =
                                        variant.buy_price || variant.cost;
                                      const baseBuyPrice =
                                        Number(product.cost) ||
                                        Number(product.buy_price) ||
                                        0;
                                      const priceAdjustment =
                                        Number(variant.price_adjustment) || 0;
                                      let price =
                                        baseBuyPrice + priceAdjustment;
                                      if (
                                        variantBuyPrice !== undefined &&
                                        variantBuyPrice !== null
                                      ) {
                                        const p = Number(variantBuyPrice);
                                        if (!isNaN(p)) price = p;
                                      }
                                      return price > 0
                                        ? formatCurrency(price)
                                        : "N/A";
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500">
                                    Sell Price:
                                  </span>
                                  <div className="text-slate-300 font-medium">
                                    {(() => {
                                      const variantSellPrice =
                                        variant.sell_price || variant.price;
                                      const baseSellPrice =
                                        Number(product.price) ||
                                        Number(product.sell_price) ||
                                        0;
                                      const priceAdjustment =
                                        Number(variant.price_adjustment) || 0;
                                      let price =
                                        baseSellPrice + priceAdjustment;
                                      if (
                                        variantSellPrice !== undefined &&
                                        variantSellPrice !== null
                                      ) {
                                        const p = Number(variantSellPrice);
                                        if (!isNaN(p)) price = p;
                                      }
                                      return price > 0
                                        ? formatCurrency(price)
                                        : "N/A";
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500">
                                    Profit:
                                  </span>
                                  <div
                                    className={`font-medium ${(() => {
                                      const variantBuyPrice =
                                        variant.buy_price || variant.cost;
                                      const variantSellPrice =
                                        variant.sell_price || variant.price;
                                      const baseBuyPrice =
                                        Number(product.cost) ||
                                        Number(product.buy_price) ||
                                        0;
                                      const baseSellPrice =
                                        Number(product.price) ||
                                        Number(product.sell_price) ||
                                        0;
                                      const priceAdjustment =
                                        Number(variant.price_adjustment) || 0;
                                      let buyPrice =
                                        baseBuyPrice + priceAdjustment;
                                      let sellPrice =
                                        baseSellPrice + priceAdjustment;
                                      if (
                                        variantBuyPrice !== undefined &&
                                        variantBuyPrice !== null
                                      ) {
                                        const p = Number(variantBuyPrice);
                                        if (!isNaN(p)) buyPrice = p;
                                      }
                                      if (
                                        variantSellPrice !== undefined &&
                                        variantSellPrice !== null
                                      ) {
                                        const p = Number(variantSellPrice);
                                        if (!isNaN(p)) sellPrice = p;
                                      }
                                      if (
                                        (buyPrice === 0 && sellPrice === 0) ||
                                        isNaN(buyPrice) ||
                                        isNaN(sellPrice)
                                      )
                                        return "text-slate-500";
                                      const profit = sellPrice - buyPrice;
                                      return profit > 0
                                        ? "text-green-400"
                                        : profit < 0
                                        ? "text-red-400"
                                        : "text-yellow-400";
                                    })()}`}
                                  >
                                    {(() => {
                                      const variantBuyPrice =
                                        variant.buy_price || variant.cost;
                                      const variantSellPrice =
                                        variant.sell_price || variant.price;
                                      const baseBuyPrice =
                                        Number(product.cost) ||
                                        Number(product.buy_price) ||
                                        0;
                                      const baseSellPrice =
                                        Number(product.price) ||
                                        Number(product.sell_price) ||
                                        0;
                                      const priceAdjustment =
                                        Number(variant.price_adjustment) || 0;
                                      let buyPrice =
                                        baseBuyPrice + priceAdjustment;
                                      let sellPrice =
                                        baseSellPrice + priceAdjustment;
                                      if (
                                        variantBuyPrice !== undefined &&
                                        variantBuyPrice !== null
                                      ) {
                                        const p = Number(variantBuyPrice);
                                        if (!isNaN(p)) buyPrice = p;
                                      }
                                      if (
                                        variantSellPrice !== undefined &&
                                        variantSellPrice !== null
                                      ) {
                                        const p = Number(variantSellPrice);
                                        if (!isNaN(p)) sellPrice = p;
                                      }
                                      if (
                                        (buyPrice === 0 && sellPrice === 0) ||
                                        isNaN(buyPrice) ||
                                        isNaN(sellPrice)
                                      )
                                        return "N/A";
                                      const profit = sellPrice - buyPrice;
                                      return (
                                        (profit >= 0 ? "+" : "") +
                                        formatCurrency(Math.abs(profit))
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-right ml-3">
                              <div className="font-semibold text-cyan-400 text-sm">
                                {variant.stock} units
                              </div>
                              {variant.sku_suffix && (
                                <div className="text-xs text-slate-500">
                                  {product.sku}-{variant.sku_suffix}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pricing Summary for products with variants */}
                    <div className="pt-3 border-t border-slate-700/30">
                      <h5 className="text-slate-400 text-sm mb-3">
                        Base Pricing
                      </h5>
                      <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 border border-slate-700/50 rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">
                              Base Buy Price
                            </p>
                            <p className="text-white font-medium">
                              {(() => {
                                const buyPrice =
                                  product.buy_price ||
                                  product.cost ||
                                  product.average_buy_price;
                                return buyPrice
                                  ? formatCurrency(Number(buyPrice))
                                  : "N/A";
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">
                              Base Sell Price
                            </p>
                            <p className="text-white font-medium">
                              {(() => {
                                const sellPrice =
                                  product.sell_price ||
                                  product.price ||
                                  product.average_sell_price;
                                return sellPrice
                                  ? formatCurrency(Number(sellPrice))
                                  : "N/A";
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">
                              Base Profit
                            </p>
                            <p
                              className={`font-medium text-xs ${(() => {
                                const buyPrice = Number(
                                  product.buy_price ||
                                    product.cost ||
                                    product.average_buy_price ||
                                    0
                                );
                                const sellPrice = Number(
                                  product.sell_price ||
                                    product.price ||
                                    product.average_sell_price ||
                                    0
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
                                const buyPrice = Number(
                                  product.buy_price ||
                                    product.cost ||
                                    product.average_buy_price ||
                                    0
                                );
                                const sellPrice = Number(
                                  product.sell_price ||
                                    product.price ||
                                    product.average_sell_price ||
                                    0
                                );
                                if (buyPrice === 0 && sellPrice === 0)
                                  return "N/A";
                                const profit = sellPrice - buyPrice;
                                return (
                                  (profit >= 0 ? "+" : "") +
                                  formatCurrency(Math.abs(profit))
                                );
                              })()}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          * Variants may have individual pricing adjustments
                          shown above
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {product.description && (
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-sm">
                      Description
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Tabs */}
            <div className="w-full lg:w-3/5 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-700/50 bg-slate-800/30">
                <button
                  onClick={() => setActiveTab("addStock")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "addStock"
                      ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Stock</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("history");
                    // Load history when switching to history tab if not already loaded
                    if (
                      stockHistory.length === 0 &&
                      !isLoadingHistory &&
                      product?.id
                    ) {
                      loadStockHistory();
                    }
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "history"
                      ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-4 sm:p-6">
                {activeTab === "addStock" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-cyan-400" />
                        Add Stock
                      </h3>
                    </div>

                    <form onSubmit={handleStockSubmit} className="space-y-4">
                      {/* QTY to Add */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          QTY To Add *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={stockForm.quantity}
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,
                              quantity: e.target.value,
                            })
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                          placeholder="Enter quantity to add"
                        />
                      </div>

                      {/* Buy and Sell Price Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Buy Price */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Buy Price per Unit *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={stockForm.buy_price}
                              onChange={(e) =>
                                setStockForm({
                                  ...stockForm,
                                  buy_price: e.target.value,
                                })
                              }
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Sell Price with Profit */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Sell Price per Unit *
                          </label>
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={stockForm.sell_price}
                                onChange={(e) =>
                                  setStockForm({
                                    ...stockForm,
                                    sell_price: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                            {/* Profit Display */}
                            {stockForm.buy_price && stockForm.sell_price && (
                              <div className="text-right min-w-[80px]">
                                {(() => {
                                  const profit =
                                    parseFloat(stockForm.sell_price) -
                                    parseFloat(stockForm.buy_price);
                                  return (
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
                                      ${Math.abs(profit).toFixed(2)}
                                    </p>
                                  );
                                })()}
                                <p className="text-xs text-slate-500">profit</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Variant Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Product Variant
                        </label>
                        <select
                          value={stockForm.variant_id}
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,
                              variant_id: e.target.value,
                            })
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[120px] cursor-pointer"
                        >
                          <option value="" className="bg-slate-800">
                            {product.variants && product.variants.length > 0
                              ? "All variants (general stock)"
                              : "No variants (main product)"}
                          </option>
                          {product.variants &&
                            product.variants.map((variant) => (
                              <option
                                key={variant.id}
                                value={variant.id}
                                className="bg-slate-800"
                              >
                                {[
                                  variant.color,
                                  variant.size,
                                  variant.weight &&
                                    `${variant.weight}${variant.weight_unit}`,
                                  variant.custom_variant,
                                ]
                                  .filter(Boolean)
                                  .join(" - ")}{" "}
                                (Current: {variant.stock})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Reason for Stock Addition *
                        </label>
                        <select
                          value={stockForm.reason}
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,
                              reason: e.target.value,
                            })
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm cursor-pointer"
                        >
                          <option value="restock" className="bg-slate-800">
                            Restock
                          </option>
                          <option value="new_shipment" className="bg-slate-800">
                            New Shipment
                          </option>
                          <option value="return" className="bg-slate-800">
                            Customer Return
                          </option>
                          <option value="correction" className="bg-slate-800">
                            Stock Correction
                          </option>
                          <option value="other" className="bg-slate-800">
                            Other
                          </option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Additional Notes
                        </label>
                        <textarea
                          rows={3}
                          value={stockForm.notes}
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,
                              notes: e.target.value,
                            })
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-vertical text-sm"
                          placeholder="Add any additional notes about this stock addition..."
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setStockForm({
                              quantity: "",
                              buy_price: "",
                              sell_price: "",
                              reason: "restock",
                              notes: "",
                              variant_id: "",
                            });
                          }}
                          className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingStock}
                          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center min-w-[120px] text-sm font-medium"
                        >
                          {isSubmittingStock ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Adding...</span>
                            </div>
                          ) : (
                            "Add Stock"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <History className="w-5 h-5 mr-2 text-cyan-400" />
                        Stock History
                      </h3>
                      <button
                        onClick={loadStockHistory}
                        disabled={isLoadingHistory}
                        className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <svg
                          className={`w-4 h-4 ${
                            isLoadingHistory ? "animate-spin" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </button>
                    </div>

                    {isLoadingHistory ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 animate-pulse"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="w-16 h-6 bg-slate-700 rounded-full"></div>
                                  <div className="w-24 h-4 bg-slate-700 rounded"></div>
                                  <div className="w-20 h-4 bg-slate-700 rounded"></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                                  <div className="w-20 h-3 bg-slate-700 rounded"></div>
                                  <div className="w-20 h-3 bg-slate-700 rounded"></div>
                                  <div className="w-20 h-3 bg-slate-700 rounded"></div>
                                  <div className="w-20 h-3 bg-slate-700 rounded"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : stockHistory.length === 0 ? (
                      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 text-center">
                        <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h4 className="text-slate-300 font-medium mb-2">
                          No Stock History
                        </h4>
                        <p className="text-slate-400 text-sm mb-4">
                          No stock movements have been recorded for this product
                          yet.
                        </p>
                        <p className="text-slate-500 text-xs">
                          Stock movements will appear here when you add stock,
                          make sales, or perform adjustments.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-800/50 border-b border-slate-700/50">
                              <tr>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  By
                                </th>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  Reason
                                </th>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  Buy Price
                                </th>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  Sell Price
                                </th>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                                  Stock Change
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {stockHistory.map((entry) => (
                                <tr
                                  key={entry.id}
                                  className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                                >
                                  <td className="py-3 px-4 text-slate-400 text-sm">
                                    {entry.created_by}
                                  </td>
                                  <td
                                    className={`py-3 px-4 font-semibold text-sm ${
                                      entry.type === "add"
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {entry.type === "add" ? "+" : "-"}
                                    {entry.quantity}
                                  </td>
                                  <td className="py-3 px-4 text-white text-sm">
                                    {entry.reason}
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-sm">
                                    {product?.buy_price
                                      ? formatCurrency(
                                          Number(product.buy_price)
                                        )
                                      : product?.cost
                                      ? formatCurrency(Number(product.cost))
                                      : product?.average_buy_price
                                      ? formatCurrency(
                                          Number(product.average_buy_price)
                                        )
                                      : "N/A"}
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-sm">
                                    {product?.sell_price
                                      ? formatCurrency(
                                          Number(product.sell_price)
                                        )
                                      : product?.price
                                      ? formatCurrency(Number(product.price))
                                      : product?.average_sell_price
                                      ? formatCurrency(
                                          Number(product.average_sell_price)
                                        )
                                      : "N/A"}
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-sm">
                                    {new Date(
                                      entry.created_at
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-sm">
                                    {entry.previous_stock !== undefined &&
                                      entry.new_stock !== undefined && (
                                        <span>
                                          {entry.previous_stock} →{" "}
                                          {entry.new_stock}
                                        </span>
                                      )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Results Summary */}
                        <div className="p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/20 to-slate-700/20">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>
                              Showing {stockHistory.length} stock movements
                            </span>
                            <div className="flex items-center space-x-3">
                              <span className="text-green-400 text-xs">
                                +
                                {stockHistory
                                  .filter((h) => h.type === "add")
                                  .reduce((sum, h) => sum + h.quantity, 0)}{" "}
                                added
                              </span>
                              <span className="text-red-400 text-xs">
                                -
                                {stockHistory
                                  .filter((h) => h.type === "remove")
                                  .reduce((sum, h) => sum + h.quantity, 0)}{" "}
                                removed
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
