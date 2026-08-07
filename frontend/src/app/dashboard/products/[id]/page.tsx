"use client";

import { useConfirm } from "@/components/ui/Feedback";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import {
  Vehicle,
  conditionLabel,
  toNumber,
  vehicleStatusBadge,
  vehicleStatusLabel,
  vehicleTypeLabel,
} from "@/lib/vehicles";
import { StockEntry } from "@/types/product";
import {
  ArrowLeft,
  Bike,
  Edit,
  History,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  product_code?: string;
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
  // Serial-tracked models (bikes, CNGs, cars). For these the real shelf count
  // is `vehicle_stock` — the number of unsold units — not the bulk `stock`
  // column, which stays 0 because units are booked in one by one.
  is_vehicle?: boolean;
  vehicle_stock?: number;
  vehicle_sold?: number;
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
  // Only populated for serial-tracked models; a normal product never fetches.
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });
  const [stockForm, setStockForm] = useState({
    quantity: "",
    buy_price: "",
    reason: "restock",
    notes: "",
    variant_id: "",
  });

  const formatCurrency = useCurrencyFormatter();
  const confirm = useConfirm();

  const loadStockHistory = async (page: number = currentPage) => {
    if (!product?.id) return;

    setIsLoadingHistory(true);
    try {
      console.log(`Loading stock history for product ${product.id}, page ${page}...`);

      // Call API with pagination parameters
      const response = await ApiService.getProductStockMovements(product.id, {
        page: page,
        page_size: recordsPerPage
      });
      console.log("Raw movements data:", response);

      // Handle paginated response
      let movements;
      let total = 0;
      let totalPagesCount = 1;

      if (response && typeof response === 'object' && 'results' in response) {
        // Paginated response
        movements = response.results || [];
        total = response.count || 0;
        totalPagesCount = Math.ceil(total / recordsPerPage);
      } else if (Array.isArray(response)) {
        // Direct array response (fallback)
        movements = response;
        total = response.length;
        totalPagesCount = 1;
      } else {
        console.error("Expected paginated response but got:", typeof response, response);
        setStockHistory([]);
        setTotalRecords(0);
        setTotalPages(1);
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
          let createdBy = "সিস্টেম";
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
              "স্টক ঠিক করা হয়েছে",
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
      setTotalRecords(total);
      setTotalPages(totalPagesCount);
      setCurrentPage(page);
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

  const handlePageChange = (page: number) => {
    loadStockHistory(page);
  };

  const handleDeleteStockEntry = async (entryId: number) => {
    const ok = await confirm({
      title: "স্টক এন্ট্রি ডিলিট করবেন?",
      message: "এই স্টক এন্ট্রি ডিলিট করলে প্রোডাক্টের গড় কেনা দাম আবার হিসাব হবে।",
      confirmLabel: "ডিলিট করুন",
      danger: true,
    });
    if (!ok) {
      return;
    }

    try {
      setIsLoadingHistory(true);

      // Call API to delete the stock entry
      await ApiService.deleteStockMovement(entryId);

      // Refresh the stock history
      await loadStockHistory(currentPage);

      // Refresh the product data to get updated buy price
      const updatedProduct = await ApiService.getProduct(parseInt(productId));
      setProduct(updatedProduct);

      showNotification("success", "স্টক এন্ট্রি ডিলিট হয়ে গেছে");
    } catch (error) {
      console.error("Error deleting stock entry:", error);
      showNotification("error", "স্টক এন্ট্রি ডিলিট করা যায়নি");
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
        console.log("Product product_code:", productData?.product_code);
        console.log("Product variants:", productData?.variants);

        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(
          error instanceof Error ? error.message : "প্রোডাক্টের তথ্য আনা যায়নি"
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
      loadStockHistory(1);
    }
  }, [product?.id]);

  // Pull the individual units for a serial-tracked model. `is_vehicle` is a
  // read-only flag the API derives from whether any Vehicle row points here,
  // so a plain product never triggers this request.
  useEffect(() => {
    if (!product?.id || !product.is_vehicle) {
      setVehicles([]);
      return;
    }

    let cancelled = false;

    const loadVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const response = await ApiService.getVehicles({
          product: product.id,
          page_size: 100,
          ordering: "status",
        });
        const rows = Array.isArray(response)
          ? response
          : response?.results ?? [];
        if (!cancelled) setVehicles(rows as Vehicle[]);
      } catch (err) {
        console.error("Error fetching vehicle units:", err);
        if (!cancelled) setVehicles([]);
      } finally {
        if (!cancelled) setIsLoadingVehicles(false);
      }
    };

    loadVehicles();
    // Guard against a stale response landing after the user navigated away.
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.is_vehicle]);

  // The add-stock tab is hidden for vehicle models, so make sure the strip
  // never lands on it and leaves the panel below empty.
  useEffect(() => {
    if (product?.is_vehicle) setActiveTab("history");
  }, [product?.is_vehicle]);

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">লোড হচ্ছে…</h1>
            <p className="page-sub">প্রোডাক্টের তথ্য আনা হচ্ছে</p>
          </div>
        </header>

        <div className="plane">
          <div className="stat-strip animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="mt-3 h-5 w-24 rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="plane-section animate-pulse">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-44 rounded-lg bg-slate-100" />
              <div className="space-y-3 lg:col-span-2">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="h-4 w-2/5 rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="plane-section animate-pulse">
            <div className="h-32 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কিছু একটা সমস্যা হয়েছে</h1>
            <p className="page-sub">প্রোডাক্টের তথ্য আনা যায়নি</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="btn btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </button>
        </header>

        <div className="plane">
          <div className="empty">
            <Package className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="mb-1 font-medium text-slate-900">
              কিছু একটা সমস্যা হয়েছে
            </p>
            <p className="mb-4 text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কিছু পাওয়া যায়নি</h1>
            <p className="page-sub">প্রোডাক্টটা খুঁজে পাওয়া যায়নি</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="btn btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </button>
        </header>

        <div className="plane">
          <div className="empty">
            <Package className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="mb-1 font-medium text-slate-900">কিছু পাওয়া যায়নি</p>
            <p>যে প্রোডাক্টটা খুঁজছেন সেটা পাওয়া যায়নি।</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStock(true);

    try {
      const newBuyPrice = parseFloat(stockForm.buy_price);
      const addedQuantity = parseInt(stockForm.quantity);

      // Calculate weighted average buy price
      const currentStock = stockForm.variant_id
        ? product.variants?.find(v => v.id === parseInt(stockForm.variant_id))?.stock || 0
        : getTotalStock();

      const currentBuyPrice = Number(
        product.buy_price ||
        product.cost ||
        product.average_buy_price ||
        0
      );

      // Calculate new weighted average price
      const totalCurrentValue = currentStock * currentBuyPrice;
      const totalNewValue = addedQuantity * newBuyPrice;
      const totalQuantity = currentStock + addedQuantity;
      const newAverageBuyPrice = totalQuantity > 0 ? (totalCurrentValue + totalNewValue) / totalQuantity : newBuyPrice;

      const stockData = {
        quantity: addedQuantity,
        buy_price: newBuyPrice, // Send the actual buy price for this stock addition
        reason: stockForm.reason,
        notes: stockForm.notes || undefined,
        variant_id: stockForm.variant_id
          ? parseInt(stockForm.variant_id)
          : undefined,
        update_average_price: true, // Flag to indicate we want to update average price
        new_average_buy_price: newAverageBuyPrice, // Send calculated average
      };

      console.log("Adding stock with average price calculation:", {
        productId: product.id,
        currentStock,
        currentBuyPrice,
        newBuyPrice,
        addedQuantity,
        newAverageBuyPrice,
        ...stockData,
      });

      // Call the actual API to adjust stock (backend will handle average price update)
      const response = await ApiService.adjustProductStock(product.id, stockData);
      console.log("Stock adjustment response:", response);

      // Reset form
      setStockForm({
        quantity: "",
        buy_price: "",
        reason: "restock",
        notes: "",
        variant_id: "",
      });

      // Refresh product data to show updated stock and average price
      console.log("Fetching updated product details...");
      const updatedProduct = await ApiService.getProduct(product.id);
      setProduct(updatedProduct);

      // Refresh stock history
      await loadStockHistory(1);

      // Show success message with average price info
      const baseMessage = `স্টকে ${stockData.quantity} পিস যোগ হয়েছে!`;
      const priceMessage = response?.buy_price_updated
        ? ` নতুন গড় কেনা দাম: ${formatCurrency(newAverageBuyPrice)}`
        : ` নতুন গড় কেনা দাম: ${formatCurrency(newAverageBuyPrice)}`;

      showNotification("success", baseMessage + priceMessage);
    } catch (error) {
      console.error("Error adding stock:", error);
      // Show error message
      const errorMessage =
        error instanceof Error ? error.message : "স্টক যোগ করা যায়নি";
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

  // Presentation helpers — derived from the same values used below.
  const totalStock = getTotalStock();
  const baseBuyPriceValue = Number(
    product.buy_price || product.cost || product.average_buy_price || 0
  );
  const baseSellPriceValue = Number(
    product.sell_price || product.price || product.average_sell_price || 0
  );
  const baseProfitValue = baseSellPriceValue - baseBuyPriceValue;
  const hasBasePrices = !(baseBuyPriceValue === 0 && baseSellPriceValue === 0);

  // ── Serial-tracked model (bike / CNG / car) ──────────────────────────────
  // A bike shop never has "10 pieces of GPX Legend"; it has N individual units
  // each with its own engine and chassis number. So the shelf count comes from
  // the unsold units, and the money figures are summed off those same rows —
  // every unit can carry a different buy price.
  const isVehicleModel = Boolean(product.is_vehicle);
  const unitsInStock = vehicles.filter((v) => v.status === "in_stock");
  const unitsReserved = vehicles.filter((v) => v.status === "reserved");
  const unitsSold = vehicles.filter((v) => v.status === "sold");
  const stockValue = unitsInStock.reduce(
    (sum, v) => sum + toNumber(v.buy_price),
    0
  );
  // Realised profit only — an unsold unit has no profit yet.
  const soldProfit = unitsSold.reduce(
    (sum, v) => sum + (toNumber(v.sold_price) - toNumber(v.buy_price)),
    0
  );
  const unitsDue = unitsSold.reduce((sum, v) => sum + toNumber(v.due_amount), 0);
  // Prefer the live rows; fall back to the serializer's count while loading.
  const vehicleShelfCount = vehicles.length
    ? unitsInStock.length
    : product.vehicle_stock ?? 0;
  const shelfCount = isVehicleModel ? vehicleShelfCount : totalStock;

  const formatUnitDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("en-GB") : "—";

  return (
    <div className="page">
      <header className="page-head">
        <div className="min-w-0">
          <h1 className="page-title truncate" title={product.name}>
            {product.name}
          </h1>
          <p className="page-sub">
            {[
              product.product_code,
              product.category_name || product.category,
            ]
              .filter(Boolean)
              .join(" · ") || "প্রোডাক্টের বিস্তারিত"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/products")}
            className="btn btn-ghost"
            aria-label="প্রোডাক্টের তালিকায় ফিরে যান"
          >
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </button>
          <button
            onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
            className="btn btn-primary"
            aria-label="প্রোডাক্ট এডিট করুন"
          >
            <Edit className="h-4 w-4" />
            এডিট করুন
          </button>
        </div>
      </header>

      <div className="plane">
        {/* Notification */}
        {notification.isVisible && (
          <div className="plane-section flex flex-wrap items-center gap-2">
            <span
              className={`badge ${
                notification.type === "success"
                  ? "badge-success"
                  : "badge-danger"
              }`}
            >
              {notification.type === "success" ? "হয়ে গেছে" : "সমস্যা"}
            </span>
            <p className="text-sm text-slate-600">{notification.message}</p>
          </div>
        )}

        {/* Product identity */}
        <div className="plane-section">
          <div className="section-title">প্রোডাক্টের তথ্য</div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Photo */}
            <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-52">
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
                          <div class="w-12 h-12 text-slate-500 mx-auto mb-2 flex items-center justify-center">
                            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                            </svg>
                          </div>
                          <p class="text-sm text-slate-500">ছবি লোড হয়নি</p>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="text-center">
                  <Package className="mx-auto mb-2 h-12 w-12 text-slate-500" />
                  <p className="text-sm text-slate-500">ছবি নাই</p>
                </div>
              )}
            </div>

            {/* Detail rows */}
            <dl className="divide-y divide-slate-200 text-sm lg:col-span-2">
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-slate-500">প্রোডাক্টের কোড</dt>
                <dd className="text-right font-medium text-slate-900">
                  {product.product_code || "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-slate-500">ক্যাটাগরি</dt>
                <dd className="text-right font-medium text-slate-900">
                  {product.category_name || product.category || "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-slate-500">সাপ্লায়ার</dt>
                <dd className="text-right font-medium text-slate-900">
                  {product.supplier_name || product.supplier || "—"}
                </dd>
              </div>
              {product.location && (
                <div className="flex items-start justify-between gap-4 py-2">
                  <dt className="text-slate-500">জায়গা</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {product.location}
                  </dd>
                </div>
              )}
              {product.sold !== undefined && (
                <div className="flex items-start justify-between gap-4 py-2">
                  <dt className="text-slate-500">বিক্রি হয়েছে</dt>
                  <dd className="num text-right font-medium text-slate-900">
                    {product.sold}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-slate-500">যোগ হয়েছে</dt>
                <dd className="num text-right text-slate-600">
                  {new Date(product.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-slate-500">আপডেট হয়েছে</dt>
                <dd className="num text-right text-slate-600">
                  {new Date(product.updated_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Key figures */}
        <div className="stat-strip border-t border-slate-200">
          <div className="stat">
            <div className="stat-label">
              {isVehicleModel ? "স্টকে আছে" : "মোট স্টক"}
            </div>
            <div className="stat-value num">{shelfCount}</div>
            <div className="stat-meta mt-1">
              {shelfCount <= 0 ? (
                <span className="badge badge-danger">স্টক নাই</span>
              ) : isVehicleModel ? (
                <span className="badge badge-success">
                  {shelfCount} টা বাইক আছে
                </span>
              ) : shelfCount <= 10 ? (
                <span className="badge badge-warn">স্টক কম</span>
              ) : (
                <span className="badge badge-success">স্টক আছে</span>
              )}
            </div>
          </div>

          {isVehicleModel ? (
            <>
              <div className="stat">
                <div className="stat-label">বিক্রি হয়েছে</div>
                <div className="stat-value num">{unitsSold.length}</div>
                <div className="stat-meta">
                  {unitsReserved.length > 0
                    ? `${unitsReserved.length} টা বুকিং আছে`
                    : "মোট ইউনিট"}
                </div>
              </div>

              <div className="stat">
                <div className="stat-label">স্টকের দাম</div>
                <div className="stat-value num">
                  {stockValue ? formatCurrency(stockValue) : "—"}
                </div>
                <div className="stat-meta">যা স্টকে আছে, কেনা দামে</div>
              </div>

              <div className="stat">
                <div className="stat-label">বিক্রি থেকে লাভ</div>
                <div
                  className={`stat-value ${
                    unitsSold.length === 0
                      ? "num"
                      : soldProfit >= 0
                      ? "money-pos"
                      : "money-neg"
                  }`}
                >
                  {unitsSold.length === 0
                    ? "—"
                    : (soldProfit >= 0 ? "+" : "") +
                      formatCurrency(Math.abs(soldProfit))}
                </div>
                <div className="stat-meta">
                  {unitsDue > 0
                    ? `${formatCurrency(unitsDue)} বাকি আছে`
                    : "সব টাকা পাওয়া গেছে"}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="stat">
                <div className="stat-label">কেনা দাম</div>
                <div className="stat-value num">
                  {baseBuyPriceValue ? formatCurrency(baseBuyPriceValue) : "—"}
                </div>
                <div className="stat-meta">প্রতি পিস</div>
              </div>

              <div className="stat">
                <div className="stat-label">বিক্রির দাম</div>
                <div className="stat-value num">
                  {baseSellPriceValue ? formatCurrency(baseSellPriceValue) : "—"}
                </div>
                <div className="stat-meta">প্রতি পিস</div>
              </div>

              <div className="stat">
                <div className="stat-label">প্রতি পিসে লাভ</div>
                <div
                  className={`stat-value ${
                    !hasBasePrices
                      ? "num"
                      : baseProfitValue >= 0
                      ? "money-pos"
                      : "money-neg"
                  }`}
                >
                  {!hasBasePrices
                    ? "—"
                    : (baseProfitValue >= 0 ? "+" : "") +
                      formatCurrency(Math.abs(baseProfitValue))}
                </div>
                <div className="stat-meta">কেনা দাম বাদ দিয়ে</div>
              </div>
            </>
          )}
        </div>

        {/* Units of a serial-tracked model — the engine/chassis papers a bike
            shop is actually asked about. Rendered only for vehicle models. */}
        {isVehicleModel && (
          <div className="plane-section border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="section-title mb-0 flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-cyan-600" />
                  বাইকের তথ্য
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  এই মডেলের প্রতিটা বাইকের আলাদা ইঞ্জিন ও চেসিস নম্বর
                </p>
              </div>
              <Link href="/dashboard/vehicles/add" className="btn btn-sm btn-ghost">
                <Plus className="h-4 w-4" />
                নতুন বাইক যোগ করুন
              </Link>
            </div>

            {isLoadingVehicles ? (
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-slate-100"
                  />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="empty mt-4">
                এই মডেলের কোনো বাইক এখনো স্টকে যোগ করা হয়নি
              </div>
            ) : (
              <div className="tbl-wrap mt-4">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>চেসিস নম্বর</th>
                      <th>ইঞ্জিন নম্বর</th>
                      <th>রেজিস্ট্রেশন</th>
                      <th>রং ও মডেল</th>
                      <th>টাইপ</th>
                      <th className="cell-num">কেনা দাম</th>
                      <th className="cell-num">দাম</th>
                      <th>অবস্থা</th>
                      <th>কাস্টমার</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => {
                      const isSold = v.status === "sold";
                      const due = toNumber(v.due_amount);
                      return (
                        <tr
                          key={v.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/vehicles/${v.id}`)
                          }
                        >
                          <td className="cell-strong">
                            {/* A unit is often booked into stock before its
                                papers arrive, so both numbers can be blank.
                                Show the unit id rather than a bare dash. */}
                            {v.chassis_number || (
                              <span className="text-slate-500">
                                #{v.id}
                                <span className="block text-xs font-normal text-amber-700">
                                  কাগজ আসেনি
                                </span>
                              </span>
                            )}
                          </td>
                          <td>{v.engine_number || "—"}</td>
                          <td>{v.registration_number || "—"}</td>
                          <td>
                            {[v.color, v.model_year].filter(Boolean).join(" · ") ||
                              "—"}
                            {v.odometer_km ? (
                              <span className="block text-xs text-slate-500">
                                {v.odometer_km} কিমি চলেছে
                              </span>
                            ) : null}
                          </td>
                          <td>
                            {vehicleTypeLabel(v.vehicle_type)}
                            <span className="block text-xs text-slate-500">
                              {conditionLabel(v.condition)}
                            </span>
                          </td>
                          <td className="cell-num">
                            {formatCurrency(toNumber(v.buy_price))}
                          </td>
                          <td className="cell-num">
                            {/* Once sold, the asking price is history — show
                                what the unit actually went for. */}
                            {isSold
                              ? formatCurrency(toNumber(v.sold_price))
                              : formatCurrency(toNumber(v.sell_price))}
                            {isSold && due > 0 ? (
                              <span className="block text-xs money-neg">
                                {formatCurrency(due)} বাকি
                              </span>
                            ) : null}
                          </td>
                          <td>
                            <span className={vehicleStatusBadge(v.status)}>
                              {vehicleStatusLabel(v.status)}
                            </span>
                          </td>
                          <td>
                            {v.customer_name || "—"}
                            {isSold ? (
                              <span className="block text-xs text-slate-500">
                                {formatUnitDate(v.sold_at)}
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="plane-section border-t border-slate-200">
            <div className="section-title">বিবরণ</div>
            <p className="text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          </div>
        )}

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <>
            <div className="plane-section border-t border-slate-200">
              <div className="section-title">ভ্যারিয়েন্ট</div>
              <p className="text-xs text-slate-500">
                * ভ্যারিয়েন্টে আলাদা দাম বসানো থাকতে পারে, নিচে সেটাই দেখানো হচ্ছে
              </p>
            </div>

            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ভ্যারিয়েন্ট</th>
                    <th>SKU</th>
                    <th className="cell-num">কেনা দাম</th>
                    <th className="cell-num">বিক্রির দাম</th>
                    <th className="cell-num">লাভ</th>
                    <th className="cell-num">স্টক</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="cell-strong">
                        {[
                          variant.color,
                          variant.size,
                          variant.weight &&
                            `${variant.weight}${variant.weight_unit}`,
                          variant.custom_variant,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="num">
                        {variant.sku_suffix
                          ? `${product.product_code}-${variant.sku_suffix}`
                          : "—"}
                      </td>
                      <td className="cell-num">
                        {(() => {
                          const variantBuyPrice =
                            variant.buy_price || variant.cost;
                          const baseBuyPrice =
                            Number(product.cost) ||
                            Number(product.buy_price) ||
                            0;
                          const priceAdjustment =
                            Number(variant.price_adjustment) || 0;
                          let price = baseBuyPrice + priceAdjustment;
                          if (
                            variantBuyPrice !== undefined &&
                            variantBuyPrice !== null
                          ) {
                            const p = Number(variantBuyPrice);
                            if (!isNaN(p)) price = p;
                          }
                          return price > 0 ? formatCurrency(price) : "—";
                        })()}
                      </td>
                      <td className="cell-num">
                        {(() => {
                          const variantSellPrice =
                            variant.sell_price || variant.price;
                          const baseSellPrice =
                            Number(product.price) ||
                            Number(product.sell_price) ||
                            0;
                          const priceAdjustment =
                            Number(variant.price_adjustment) || 0;
                          let price = baseSellPrice + priceAdjustment;
                          if (
                            variantSellPrice !== undefined &&
                            variantSellPrice !== null
                          ) {
                            const p = Number(variantSellPrice);
                            if (!isNaN(p)) price = p;
                          }
                          return price > 0 ? formatCurrency(price) : "—";
                        })()}
                      </td>
                      <td
                        className={`cell-num ${(() => {
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
                          let buyPrice = baseBuyPrice + priceAdjustment;
                          let sellPrice = baseSellPrice + priceAdjustment;
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
                            return "";
                          const profit = sellPrice - buyPrice;
                          return profit >= 0 ? "money-pos" : "money-neg";
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
                          let buyPrice = baseBuyPrice + priceAdjustment;
                          let sellPrice = baseSellPrice + priceAdjustment;
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
                            return "—";
                          const profit = sellPrice - buyPrice;
                          return (
                            (profit >= 0 ? "+" : "") +
                            formatCurrency(Math.abs(profit))
                          );
                        })()}
                      </td>
                      <td className="cell-num cell-strong">{variant.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab strip */}
        <div className="plane-section border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk stock entry is meaningless for a serial-tracked model —
                a bike enters stock as its own unit with engine/chassis
                numbers, added from the vehicles screen above. */}
            {!isVehicleModel && (
              <button
                onClick={() => setActiveTab("addStock")}
                className={`btn btn-sm ${
                  activeTab === "addStock" ? "btn-primary" : "btn-ghost"
                }`}
              >
                <Plus className="h-4 w-4" />
                স্টক যোগ করুন
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab("history");
                // Load history when switching to history tab if not already loaded
                if (
                  stockHistory.length === 0 &&
                  !isLoadingHistory &&
                  product?.id
                ) {
                  loadStockHistory(1);
                }
              }}
              className={`btn btn-sm ${
                activeTab === "history" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <History className="h-4 w-4" />
              স্টকের হিস্ট্রি
            </button>
          </div>
        </div>

        {/* Add stock */}
        {activeTab === "addStock" && !isVehicleModel && (
          <div className="plane-section border-t border-slate-200">
            <div className="section-title">নতুন স্টক যোগ করুন</div>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">কত পিস যোগ হবে *</label>
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
                    className="input"
                    placeholder="যত পিস যোগ করবেন লিখুন"
                  />
                </div>

                <div>
                  <label className="label">প্রতি পিসের কেনা দাম *</label>
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
                    className="input"
                    placeholder="0.00"
                  />

                  {/* Average Price Preview */}
                  {stockForm.quantity && stockForm.buy_price && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <div className="mb-1 text-slate-500">
                        দামে যা প্রভাব পড়বে
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>এখনকার গড় দাম</span>
                        <span className="num">
                          {formatCurrency(Number(
                            product.buy_price ||
                            product.cost ||
                            product.average_buy_price ||
                            0
                          ))}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium text-cyan-600">
                        <span>নতুন গড় দাম</span>
                        <span className="num">
                          {(() => {
                            const currentStock = stockForm.variant_id
                              ? product.variants?.find(v => v.id === parseInt(stockForm.variant_id))?.stock || 0
                              : getTotalStock();
                            const currentBuyPrice = Number(
                              product.buy_price ||
                              product.cost ||
                              product.average_buy_price ||
                              0
                            );
                            const newBuyPrice = parseFloat(stockForm.buy_price);
                            const addedQuantity = parseInt(stockForm.quantity);

                            const totalCurrentValue = currentStock * currentBuyPrice;
                            const totalNewValue = addedQuantity * newBuyPrice;
                            const totalQuantity = currentStock + addedQuantity;
                            const newAverageBuyPrice = totalQuantity > 0 ? (totalCurrentValue + totalNewValue) / totalQuantity : newBuyPrice;

                            return formatCurrency(newAverageBuyPrice);
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Variant Selection */}
              <div>
                <label className="label">কোন ভ্যারিয়েন্ট</label>
                <select
                  value={stockForm.variant_id}
                  onChange={(e) =>
                    setStockForm({
                      ...stockForm,
                      variant_id: e.target.value,
                    })
                  }
                  className="select"
                >
                  <option value="">
                    {product.variants && product.variants.length > 0
                      ? "সব ভ্যারিয়েন্ট (সাধারণ স্টক)"
                      : "কোনো ভ্যারিয়েন্ট নাই (মূল প্রোডাক্ট)"}
                  </option>
                  {product.variants &&
                    product.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {[
                          variant.color,
                          variant.size,
                          variant.weight &&
                            `${variant.weight}${variant.weight_unit}`,
                          variant.custom_variant,
                        ]
                          .filter(Boolean)
                          .join(" - ")}{" "}
                        (এখন আছে: {variant.stock})
                      </option>
                    ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="label">বাড়তি নোট</label>
                <textarea
                  rows={3}
                  value={stockForm.notes}
                  onChange={(e) =>
                    setStockForm({
                      ...stockForm,
                      notes: e.target.value,
                    })
                  }
                  className="textarea"
                  placeholder="এই স্টক যোগ নিয়ে কিছু লিখতে চাইলে লিখুন…"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStockForm({
                      quantity: "",
                      buy_price: "",
                      reason: "restock",
                      notes: "",
                      variant_id: "",
                    });
                  }}
                  className="btn btn-ghost"
                >
                  মুছে ফেলুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStock}
                  className="btn btn-primary"
                >
                  {isSubmittingStock ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      যোগ হচ্ছে…
                    </>
                  ) : (
                    "স্টক যোগ করুন"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stock history */}
        {activeTab === "history" && (
          <>
            <div className="plane-section flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
              <div className="section-title mb-0">স্টকের হিস্ট্রি</div>
              <button
                onClick={() => loadStockHistory(currentPage)}
                disabled={isLoadingHistory}
                className="btn btn-ghost btn-sm"
                aria-label="স্টকের হিস্ট্রি আবার আনুন"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingHistory ? "animate-spin" : ""}`}
                />
                রিফ্রেশ
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="plane-section">
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-1/3 rounded bg-slate-100" />
                      <div className="h-3 w-2/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-500">লোড হচ্ছে…</p>
              </div>
            ) : stockHistory.length === 0 ? (
              <div className="empty border-t border-slate-200">
                <History className="mx-auto mb-3 h-10 w-10 text-slate-500" />
                <p className="mb-1 font-medium text-slate-900">
                  কিছু পাওয়া যায়নি
                </p>
                <p>এই প্রোডাক্টের স্টকের কোনো হিসাব এখনো জমা হয়নি।</p>
                <p className="mt-1 text-xs">
                  স্টক যোগ করলে, বিক্রি হলে বা হিসাব ঠিক করলে এখানে দেখা যাবে।
                </p>
              </div>
            ) : (
              <>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>কে করেছে</th>
                        <th className="cell-num">পরিমাণ</th>
                        <th>কারণ</th>
                        <th className="cell-num">কেনা দাম</th>
                        <th>তারিখ</th>
                        <th>স্টকের পরিবর্তন</th>
                        <th className="text-right">কাজ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td
                            className="max-w-[140px] truncate"
                            title={entry.created_by}
                          >
                            {entry.created_by}
                          </td>
                          <td
                            className={`cell-num font-semibold ${
                              entry.type === "add" ? "money-pos" : "money-neg"
                            }`}
                          >
                            {entry.type === "add" ? "+" : "-"}
                            {entry.quantity}
                          </td>
                          <td className="cell-strong">{entry.reason}</td>
                          <td className="cell-num">
                            {entry.cost_per_unit
                              ? formatCurrency(Number(entry.cost_per_unit))
                              : "—"}
                          </td>
                          <td className="num whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </td>
                          <td className="num whitespace-nowrap">
                            {entry.previous_stock !== undefined &&
                              entry.new_stock !== undefined && (
                                <span>
                                  {entry.previous_stock} → {entry.new_stock}
                                </span>
                              )}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleDeleteStockEntry(entry.id)}
                              className="btn btn-ghost btn-sm"
                              title="এই এন্ট্রি ডিলিট করুন"
                              aria-label="এই এন্ট্রি ডিলিট করুন"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Results Summary */}
                <div className="plane-section border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      মোট {totalRecords} টার মধ্যে {stockHistory.length} টা
                      দেখাচ্ছে
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="money-pos">
                        +
                        {stockHistory
                          .filter((h) => h.type === "add")
                          .reduce((sum, h) => sum + h.quantity, 0)}{" "}
                        যোগ হয়েছে
                      </span>
                      <span className="money-neg">
                        -
                        {stockHistory
                          .filter((h) => h.type === "remove")
                          .reduce((sum, h) => sum + h.quantity, 0)}{" "}
                        বাদ গেছে
                      </span>
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1 border-t border-slate-200 pt-3">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="btn btn-ghost btn-sm"
                        aria-label="আগের পাতা"
                      >
                        আগের
                      </button>

                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                        // Adjust startPage if we're near the end
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`btn btn-sm num ${
                                i === currentPage ? "btn-primary" : "btn-ghost"
                              }`}
                              aria-label={`পাতা ${i}`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="btn btn-ghost btn-sm"
                        aria-label="পরের পাতা"
                      >
                        পরের
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
