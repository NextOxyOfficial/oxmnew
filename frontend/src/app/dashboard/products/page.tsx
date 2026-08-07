"use client";

import Pagination from "@/components/ui/Pagination";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ApiService } from "@/lib/api";
import { Product, ProductVariant } from "@/types/product";
import {
  Crown,
  Download,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import * as XLSX from 'xlsx';

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formatCurrency = useCurrencyFormatter();
  const { subscriptionStatus, isPro, isLoading: subscriptionLoading } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  // Store categories as objects to have access to IDs for backend filtering
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(""); // For immediate UI updates
  const [searchTerm, setSearchTerm] = useState(""); // For debounced API calls
  // Filter by category ID as required by backend (use "all" for no filter)
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    deleting: { [key: string]: boolean };
    navigating: { [key: string]: boolean };
    addProduct: boolean;
    downloadingExcel: boolean;
  }>({
    deleting: {},
    navigating: {},
    addProduct: false,
    downloadingExcel: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });

  // Pagination state - initialize from URL parameters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Initialize pagination from URL on first load
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('pageSize');
    
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;
    const urlPageSize = sizeParam ? parseInt(sizeParam, 10) : 10;
    
    setCurrentPage(urlPage);
    setPageSize(urlPageSize);
  }, []); // Only run once on mount

  // Overall statistics (not affected by search/filter)
  const [overallStats, setOverallStats] = useState({
    totalProducts: 0,
    totalBuyPrice: 0,
    totalSalePrice: 0,
    estimatedProfit: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  // Product limit constants and functions
  const FREE_PLAN_PRODUCT_LIMIT = 25;
  
  const canAddMoreProducts = () => {
    if (isPro) return true;
    return totalItems < FREE_PLAN_PRODUCT_LIMIT;
  };

  const getProductUsagePercentage = () => {
    if (isPro) return 0; // No limit for pro users
    return Math.min((totalItems / FREE_PLAN_PRODUCT_LIMIT) * 100, 100);
  };

  const getRemainingProducts = () => {
    if (isPro) return Infinity;
    return Math.max(FREE_PLAN_PRODUCT_LIMIT - totalItems, 0);
  };

  // Function to update URL parameters
  const updateUrlParams = (updates: { page?: number; pageSize?: number }) => {
    const current = new URLSearchParams(searchParams);
    
    if (updates.page !== undefined) {
      if (updates.page === 1) {
        current.delete('page'); // Remove page=1 to keep URLs clean
      } else {
        current.set('page', updates.page.toString());
      }
    }
    
    if (updates.pageSize !== undefined) {
      if (updates.pageSize === 10) {
        current.delete('pageSize'); // Remove default page size to keep URLs clean
      } else {
        current.set('pageSize', updates.pageSize.toString());
      }
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    // Use replace to avoid adding to browser history for every page change
    router.replace(`/dashboard/products${query}`, { scroll: false });
  };

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

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
    // A vehicle model is counted per unit — each bike/CNG is its own row with
    // its own engine and chassis number, so the bulk `stock` column is
    // meaningless for it. Fall back to the normal columns for everything else.
    if (product.is_vehicle) return product.vehicle_stock || 0;
    return product.has_variants ? product.total_stock || 0 : product.stock || 0;
  };

  // Units sold — same reasoning as getDisplayStock.
  const getDisplaySold = (product: Product) =>
    product.is_vehicle ? product.vehicle_sold || 0 : product.sold || 0;

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

  // Fetch products and categories on component mount and when pagination changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only show full loading on very first load when no products exist
        // For all other cases (search/filter/pagination), show subtle loading
        const hasNoProducts = products.length === 0;
        if (isInitialLoad && hasNoProducts) {
          setIsLoading(true);
        } else {
          setIsSearching(true);
        }
        setError(null);

        // Build search parameters
        const params: {
          page: number;
          page_size: number;
          search?: string;
          category?: string;
          ordering?: string;
        } = {
          page: currentPage,
          page_size: pageSize,
        };

        // Add search if exists
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        // Add category filter (backend expects category ID via `category`)
        if (filterCategory !== "all") {
          const catId = Number(filterCategory);
          if (!Number.isNaN(catId)) {
            params.category = String(catId);
          }
        }

        // Add ordering
        if (sortBy) {
          switch (sortBy) {
            case "newest":
              params.ordering = "-created_at";
              break;
            case "name":
              params.ordering = "name";
              break;
            case "stock-high":
              // Backend doesn't support ordering by stock; handle client-side
              // by leaving ordering undefined here
              delete params.ordering;
              break;
            case "stock-low":
              // Backend doesn't support ordering by stock; handle client-side
              delete params.ordering;
              break;
            case "price-high":
              params.ordering = "-sell_price";
              break;
            case "price-low":
              params.ordering = "sell_price";
              break;
            default:
              params.ordering = "-created_at";
          }
        }

        const productsData = await ApiService.getProducts(params);

        // Handle paginated response
        if (productsData.results) {
          setProducts(productsData.results);
          setTotalItems(productsData.count);
          setTotalPages(Math.ceil(productsData.count / pageSize));
        } else {
          // Handle non-paginated response (fallback)
          const productsList = Array.isArray(productsData) ? productsData : [];
          setProducts(productsList);
          setTotalItems(productsList.length);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(
          error instanceof Error ? error.message : "প্রোডাক্টের তালিকা লোড করা যায়নি"
        );
      } finally {
        setIsLoading(false);
        setIsSearching(false);
        setIsInitialLoad(false);
      }
    };

    fetchData();
  }, [
    currentPage,
    pageSize,
    searchTerm,
    filterCategory,
    sortBy,
    isInitialLoad,
    products.length,
  ]);

  // Fetch categories on component mount from backend (provides IDs and names)
  useEffect(() => {
    const fetchCategories = async () => {
      if (categories.length === 0) {
        try {
          const cats = await ApiService.getCategories();
          // Normalize to id/name shape in case of different backend responses
          const normalized = (cats || [])
            .map((c: any) => ({ id: Number(c.id), name: String(c.name) }))
            .filter((c: any) => !!c.id && !!c.name);
          setCategories(normalized);
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      }
    };

    fetchCategories();
  }, [categories.length]);

  // Fetch overall statistics on component mount (not affected by search/filter)
  useEffect(() => {
    const fetchOverallStats = async () => {
      try {
        setIsStatsLoading(true);

        // Use the dedicated stats endpoint to get overall statistics
        const statsData = await ApiService.getInventoryStats();

        setOverallStats({
          totalProducts: statsData.total_products || 0,
          totalBuyPrice: statsData.total_buy_value || 0,
          totalSalePrice: statsData.total_sell_value || 0,
          estimatedProfit:
            (statsData.total_sell_value || 0) -
            (statsData.total_buy_value || 0),
        });
      } catch (error) {
        console.error("Error fetching overall statistics:", error);
        // Set default values on error
        setOverallStats({
          totalProducts: 0,
          totalBuyPrice: 0,
          totalSalePrice: 0,
          estimatedProfit: 0,
        });
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchOverallStats();
  }, []); // Only run once on mount

  const handleProductClick = (product: Product) => {
    setLoadingStates((prev) => ({
      ...prev,
      navigating: { ...prev.navigating, [product.id]: true },
    }));
    setTimeout(() => {
      router.push(`/dashboard/products/${product.id}`);
    }, 300);
  };

  const handleEditProduct = (product: Product) => {
    setLoadingStates((prev) => ({
      ...prev,
      navigating: { ...prev.navigating, [`edit-${product.id}`]: true },
    }));
    // Navigate to edit page
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setLoadingStates((prev) => ({
      ...prev,
      deleting: { ...prev.deleting, [productToDelete.id]: true },
    }));
    try {
      await ApiService.deleteProduct(productToDelete.id);

      // Remove product from local state
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

      setShowDeleteModal(false);
      setProductToDelete(null);

      // Show success notification
      showNotification(
        "success",
        `"${productToDelete.name}" ডিলিট হয়ে গেছে`
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      // Show error notification
      showNotification("error", "প্রোডাক্টটা ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        deleting: { ...prev.deleting, [productToDelete.id]: false },
      }));
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
    // Check if user can add more products
    if (!canAddMoreProducts()) {
      setShowUpgradeModal(true);
      return;
    }

    setLoadingStates((prev) => ({
      ...prev,
      addProduct: true,
    }));
    setTimeout(() => {
      router.push("/dashboard/products/add");
    }, 300);
  };

  const handleDownloadExcel = async () => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        downloadingExcel: true,
      }));

      // Fetch all products with pagination to ensure we get everything
      let allProducts: Product[] = [];
      let currentPage = 1;
      let hasMoreData = true;
      const pageSize = 100; // Use larger page size for efficiency

      while (hasMoreData) {
        try {
          const productsData = await ApiService.getProducts({
            page: currentPage,
            page_size: pageSize,
          });

          if (productsData.results) {
            // Paginated response
            allProducts = [...allProducts, ...productsData.results];
            hasMoreData = productsData.next !== null; // Check if there's a next page
            currentPage++;
          } else {
            // Non-paginated response (fallback)
            const productsList = Array.isArray(productsData) ? productsData : [];
            allProducts = [...allProducts, ...productsList];
            hasMoreData = false;
          }

          // Safety check to prevent infinite loops
          if (currentPage > 1000) {
            console.warn('Reached maximum page limit (1000) while fetching products');
            break;
          }
        } catch (pageError) {
          console.error(`Error fetching page ${currentPage}:`, pageError);
          // If we have some products already, continue with those
          if (allProducts.length > 0) {
            console.warn(`Continuing with ${allProducts.length} products fetched so far`);
            break;
          } else {
            throw pageError; // Re-throw if we have no products at all
          }
        }
      }

      if (allProducts.length === 0) {
        showNotification('error', 'নামানোর মতো কোনো প্রোডাক্ট নেই');
        return;
      }

      // Prepare data for Excel
      const excelData = allProducts.map((product: Product) => {
        const totals = getProductTotals(product);
        const displayPrices = getDisplayPrices(product);
        
        return {
          'Product Name': product.name || '',
          'Product Code': product.product_code || '',
          'Category': product.category_name || '',
          'Stock': getDisplayStock(product),
          'Buy Price': displayPrices.buyPrice,
          'Sell Price': displayPrices.sellPrice,
          'Total Buy Value': totals.totalBuyPrice,
          'Total Sell Value': totals.totalSellPrice,
          'Expected Profit': totals.totalProfit,
          'Has Variants': product.has_variants ? 'Yes' : 'No',
          'Status': product.is_active ? 'Active' : 'Inactive',
          'Description': product.details || '',
          'Supplier': product.supplier_name || '',
          'Location': product.location || '',
          'Created Date': product.created_at ? new Date(product.created_at).toLocaleDateString() : '',
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 25 }, // Product Name
        { wch: 15 }, // Product Code
        { wch: 15 }, // Category
        { wch: 10 }, // Stock
        { wch: 12 }, // Buy Price
        { wch: 12 }, // Sell Price
        { wch: 15 }, // Total Buy Value
        { wch: 15 }, // Total Sell Value
        { wch: 15 }, // Expected Profit
        { wch: 12 }, // Has Variants
        { wch: 10 }, // Status
        { wch: 30 }, // Description
        { wch: 20 }, // Supplier
        { wch: 15 }, // Location
        { wch: 12 }, // Created Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      // Generate filename with current date and total count
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `products_${allProducts.length}_items_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      showNotification('success', `${allProducts.length}টি প্রোডাক্ট নামানো হয়েছে — ${filename}`);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      showNotification('error', 'প্রোডাক্টের তালিকা নামানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        downloadingExcel: false,
      }));
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams({ page });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    updateUrlParams({ page: 1, pageSize: newPageSize });
  };

  // Handle URL parameter changes (browser back/forward navigation and page reloads)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('pageSize');
    
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;
    const urlPageSize = sizeParam ? parseInt(sizeParam, 10) : 10;
    
    // Only update state if it's different from URL to avoid loops
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
    
    if (urlPageSize !== pageSize) {
      setPageSize(urlPageSize);
    }
  }, [searchParams.toString()]); // Use toString() to avoid reference issues

  // Reset to first page when search or filter changes (but don't update URL here to avoid conflicts)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateUrlParams({ page: 1 });
    }
  }, [searchTerm, filterCategory, sortBy]);

  // Apply any client-side sorting that's not supported by backend (stock)
  const filteredProducts = (() => {
    if (sortBy === "stock-high" || sortBy === "stock-low") {
      const sorted = [...products].sort((a, b) => {
        const sa = getDisplayStock(a);
        const sb = getDisplayStock(b);
        return sortBy === "stock-high" ? sb - sa : sa - sb;
      });
      return sorted;
    }
    return products;
  })();

  // Loading state - only show full skeleton on initial load
  if (isLoading && isInitialLoad) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">প্রোডাক্ট</h1>
            <p className="page-sub">স্টক আর প্রোডাক্টের হিসাব এক জায়গায়</p>
          </div>
        </header>

        <div className="plane">
          <div className="stat-strip">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-100"></div>
                  <div className="h-6 w-24 rounded bg-slate-100"></div>
                  <div className="h-3 w-16 rounded bg-slate-100"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="empty">লোড হচ্ছে…</div>
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
            <h1 className="page-title">প্রোডাক্ট</h1>
            <p className="page-sub">স্টক আর প্রোডাক্টের হিসাব এক জায়গায়</p>
          </div>
        </header>

        <div className="plane">
          <div className="plane-section text-center">
            <h3 className="text-base font-semibold text-slate-900">
              কিছু একটা সমস্যা হয়েছে
            </h3>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mt-4"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">প্রোডাক্ট</h1>
          <p className="page-sub">স্টক আর প্রোডাক্টের হিসাব এক জায়গায়</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={loadingStates.downloadingExcel}
            className="btn btn-ghost"
          >
            {loadingStates.downloadingExcel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ডাউনলোড হচ্ছে…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                এক্সেল
              </>
            )}
          </button>

          <button
            onClick={handleAddProduct}
            disabled={loadingStates.addProduct}
            className="btn btn-primary"
          >
            {loadingStates.addProduct ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                লোড হচ্ছে…
              </>
            ) : !canAddMoreProducts() && !isPro ? (
              <>
                <Crown className="h-4 w-4" />
                আপগ্রেড করুন
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                নতুন প্রোডাক্ট
              </>
            )}
          </button>
        </div>
      </header>

      {/* Notification */}
      {notification.isVisible && (
        <div
          className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
          role="status"
        >
          {notification.message}
        </div>
      )}

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট প্রোডাক্ট</div>
            {isStatsLoading ? (
              <div className="mt-1 h-6 w-16 animate-pulse rounded bg-slate-100" />
            ) : (
              <div className="stat-value num">{overallStats.totalProducts}</div>
            )}
            <div className="stat-meta">স্টকে থাকা প্রোডাক্টের সংখ্যা</div>
          </div>

          <div className="stat">
            <div className="stat-label">মোট কেনা দাম</div>
            {isStatsLoading ? (
              <div className="mt-1 h-6 w-24 animate-pulse rounded bg-slate-100" />
            ) : (
              <div className="stat-value money-neg">
                {formatCurrency(overallStats.totalBuyPrice)}
              </div>
            )}
            <div className="stat-meta">সব মিলিয়ে যত টাকা লেগেছে</div>
          </div>

          <div className="stat">
            <div className="stat-label">মোট বিক্রির দাম</div>
            {isStatsLoading ? (
              <div className="mt-1 h-6 w-24 animate-pulse rounded bg-slate-100" />
            ) : (
              <div className="stat-value money-pos">
                {formatCurrency(overallStats.totalSalePrice)}
              </div>
            )}
            <div className="stat-meta">সব বিক্রি হলে যত টাকা</div>
          </div>

          <div className="stat">
            <div className="stat-label">আনুমানিক লাভ</div>
            {isStatsLoading ? (
              <div className="mt-1 h-6 w-24 animate-pulse rounded bg-slate-100" />
            ) : (
              <div
                className={`stat-value ${
                  overallStats.estimatedProfit < 0 ? "money-neg" : "money-pos"
                }`}
              >
                {formatCurrency(overallStats.estimatedProfit)}
              </div>
            )}
            <div className="stat-meta">পুরো দামে বিক্রি হলে</div>
          </div>
        </div>

        {/* Free plan usage */}
        {!isPro && !subscriptionLoading && (
          <div className="plane-section">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">
                  ফ্রি প্ল্যানে প্রোডাক্টের সীমা
                </span>
                <span className="num text-sm text-slate-500">
                  {totalItems}/{FREE_PLAN_PRODUCT_LIMIT} প্রোডাক্ট ব্যবহার হয়েছে
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 sm:w-40">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      getProductUsagePercentage() >= 80
                        ? "bg-rose-600"
                        : getProductUsagePercentage() >= 60
                        ? "bg-amber-700"
                        : "bg-emerald-700"
                    }`}
                    style={{ width: `${getProductUsagePercentage()}%` }}
                  ></div>
                </div>
                {getRemainingProducts() <= 5 && getRemainingProducts() > 0 ? (
                  <span className="badge badge-warn">
                    আর {getRemainingProducts()}টি যোগ করা যাবে
                  </span>
                ) : getRemainingProducts() === 0 ? (
                  <span className="badge badge-danger">সীমা শেষ</span>
                ) : (
                  <span className="badge badge-muted">
                    {Math.round(getProductUsagePercentage())}% ব্যবহার হয়েছে
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2">
            {/* .input sets width/padding itself, so size it from the wrapper */}
            <div className="flex w-full items-center gap-2 sm:w-72">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="নাম বা কোড দিয়ে প্রোডাক্ট খুঁজুন"
                aria-label="প্রোডাক্ট খুঁজুন"
                className="input"
              />
              {(searchInput !== searchTerm || isSearching) && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-600" />
              )}
            </div>

            <div className="w-full sm:w-44">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="ক্যাটাগরি ফিল্টার"
                className="select"
              >
                <option value="all">সব ক্যাটাগরি</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="সাজানোর নিয়ম"
                className="select"
              >
                <option value="newest">নতুন আগে</option>
                <option value="name">নাম অনুযায়ী</option>
                <option value="stock-high">স্টক: বেশি থেকে কম</option>
                <option value="stock-low">স্টক: কম থেকে বেশি</option>
                <option value="price-high">দাম: বেশি থেকে কম</option>
                <option value="price-low">দাম: কম থেকে বেশি</option>
              </select>
            </div>

            {isSearching && (
              <span className="text-xs text-slate-500">প্রোডাক্ট খোঁজা হচ্ছে…</span>
            )}
          </div>
        </div>

        {/* Product table */}
        {filteredProducts.length === 0 && !isLoading ? (
          <div className="empty">
            <Package className="mx-auto mb-2 h-8 w-8 text-slate-500" />
            <p className="font-medium text-slate-600">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            <p className="mt-1 text-slate-500">
              খোঁজার শব্দ বদলে দেখুন, বা নতুন প্রোডাক্ট যোগ করুন।
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: plain hairline-separated rows */}
            <div className="block divide-y divide-slate-200 lg:hidden">
              {filteredProducts.map((product) => (
                <div key={product.id} className="px-4 py-3">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="group w-full text-left"
                  >
                    <div
                      className="truncate text-sm font-medium text-slate-900 group-hover:text-cyan-600"
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

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500">স্টক</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="num text-sm text-slate-900">
                          {getDisplayStock(product)} টি
                        </span>
                        {(() => {
                          const stock = getDisplayStock(product);
                          if (stock === 0) {
                            return (
                              <span className="badge badge-danger">
                                স্টক নাই
                              </span>
                            );
                          }
                          if (stock < 5) {
                            return (
                              <span className="badge badge-warn">স্টক কম</span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="num mt-0.5 text-xs text-slate-500">
                        {getDisplaySold(product)} টি বিক্রি হয়েছে
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">
                        প্রতি পিসে লাভ
                      </div>
                      {(() => {
                        const { buyPrice, sellPrice } =
                          getDisplayPrices(product);
                        const profit = sellPrice - buyPrice;
                        const profitMargin =
                          sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                        const totals = getProductTotals(product);

                        return (
                          <div>
                            <div
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
                            </div>
                            <div className="num mt-0.5 text-xs text-slate-500">
                              {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                              {Math.abs(profitMargin).toFixed(1)}% মার্জিন
                            </div>
                            <div className="num mt-0.5 text-xs text-slate-600">
                              মোট: {formatCurrency(totals.totalProfit)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">কেনা দাম</div>
                      <div className="money-neg text-sm font-medium">
                        {formatCurrency(getDisplayPrices(product).buyPrice)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">বিক্রির দাম</div>
                      <div className="money-pos text-sm font-medium">
                        {formatCurrency(getDisplayPrices(product).sellPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Totals for variant products */}
                  {product.has_variants && (
                    <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                      <div>
                        <div className="text-xs text-slate-500">মোট কেনা</div>
                        <div className="money-neg text-sm font-medium">
                          {formatCurrency(
                            getProductTotals(product).totalBuyPrice
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">মোট বিক্রি</div>
                        <div className="money-pos text-sm font-medium">
                          {formatCurrency(
                            getProductTotals(product).totalSellPrice
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">মোট লাভ</div>
                        <div className="num text-sm font-medium text-slate-900">
                          {formatCurrency(getProductTotals(product).totalProfit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">মোট পরিমাণ</div>
                        <div className="num text-sm font-medium text-slate-900">
                          {getProductTotals(product).totalQuantity} টি
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show variants only if variants exist and have data */}
                  {product.has_variants &&
                    product.variants &&
                    product.variants.length > 0 && (
                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">
                            ভ্যারিয়েন্ট ({product.variants.length})
                          </span>
                          <span className="num text-xs text-slate-500">
                            মোট{" "}
                            {product.variants.reduce(
                              (total, variant) => total + (variant.stock || 0),
                              0
                            )}{" "}
                            টি
                          </span>
                        </div>
                        <div className="mt-1 max-h-40 divide-y divide-slate-200 overflow-y-auto">
                          {product.variants.slice(0, 4).map((variant, index) => (
                            <div key={variant.id || index} className="py-2">
                              <div className="flex flex-wrap items-center gap-1">
                                {variant.color && (
                                  <span className="badge badge-info">
                                    {variant.color}
                                  </span>
                                )}
                                {variant.size && (
                                  <span className="badge badge-info">
                                    {variant.size}
                                  </span>
                                )}
                                {variant.weight && (
                                  <span className="badge badge-info">
                                    {variant.weight}
                                    {variant.weight_unit}
                                  </span>
                                )}
                                {variant.custom_variant && (
                                  <span className="badge badge-info">
                                    {variant.custom_variant}
                                  </span>
                                )}
                                {!variant.color &&
                                  !variant.size &&
                                  !variant.weight &&
                                  !variant.custom_variant && (
                                    <span className="badge badge-muted">
                                      ভ্যারিয়েন্ট {index + 1}
                                    </span>
                                  )}
                              </div>

                              <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                <div>
                                  <span className="text-slate-500">কেনা: </span>
                                  <span className="money-neg font-medium">
                                    {formatCurrency(
                                      getBuyPrice(product, variant)
                                    )}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">
                                    বিক্রি:{" "}
                                  </span>
                                  <span className="money-pos font-medium">
                                    {formatCurrency(
                                      getSellPrice(product, variant)
                                    )}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">লাভ: </span>
                                  <span
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
                                        ? "money-pos"
                                        : profit < 0
                                        ? "money-neg"
                                        : "num text-slate-600";
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
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">স্টক: </span>
                                  <span className="num font-medium text-slate-900">
                                    {variant.stock || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {product.variants.length > 4 && (
                            <div className="py-2">
                              <button
                                onClick={() => handleProductClick(product)}
                                disabled={loadingStates.navigating[product.id]}
                                className="btn btn-ghost btn-sm"
                              >
                                {loadingStates.navigating[product.id] ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    লোড হচ্ছে…
                                  </>
                                ) : (
                                  `আরও ${
                                    product.variants.length - 4
                                  }টি ভ্যারিয়েন্ট দেখুন`
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                      disabled={loadingStates.navigating[product.id]}
                      className="btn btn-ghost btn-sm"
                      title="স্টক যোগ করুন"
                    >
                      {loadingStates.navigating[product.id] ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          লোড হচ্ছে…
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          স্টক যোগ
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                      disabled={loadingStates.navigating[`edit-${product.id}`]}
                      className="btn btn-ghost btn-sm"
                      title="এডিট করুন"
                      aria-label="এডিট করুন"
                    >
                      {loadingStates.navigating[`edit-${product.id}`] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pencil className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(product);
                      }}
                      className="btn btn-ghost btn-sm"
                      title="ডিলিট করুন"
                      aria-label="ডিলিট করুন"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="tbl-wrap hidden lg:block">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>প্রোডাক্টের নাম</th>
                    <th>স্টক ও বিক্রি</th>
                    <th className="cell-num">কেনা ও বিক্রির দাম</th>
                    <th className="cell-num">প্রতি পিসে লাভ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="max-w-[15rem]">
                        <button
                          onClick={() => handleProductClick(product)}
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
                          {product.has_variants &&
                            product.variants &&
                            product.variants.length > 0 && (
                              <span className="badge badge-info mt-1">
                                {product.variants.length}টি ভ্যারিয়েন্ট
                              </span>
                            )}
                          {/* Marks a model whose stock is counted per unit, so
                              the number beside it reads as units, not pieces. */}
                          {product.is_vehicle && (
                            <span className="badge badge-muted mt-1">বাইক</span>
                          )}
                        </button>
                      </td>

                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="num text-slate-900">
                            {getDisplayStock(product)} টি
                          </span>
                          {(() => {
                            const stock = getDisplayStock(product);
                            if (stock === 0) {
                              return (
                                <span className="badge badge-danger">
                                  স্টক নাই
                                </span>
                              );
                            }
                            if (stock < 5) {
                              return (
                                <span className="badge badge-warn">স্টক কম</span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="num mt-1 text-xs text-slate-500">
                          {getDisplaySold(product)} টি বিক্রি হয়েছে
                        </div>
                      </td>

                      <td className="cell-num">
                        <div className="money-neg">
                          {formatCurrency(getDisplayPrices(product).buyPrice)}
                        </div>
                        <div className="money-pos">
                          {formatCurrency(getDisplayPrices(product).sellPrice)}
                        </div>
                        {product.has_variants &&
                          product.variants &&
                          product.variants.length > 0 && (
                            <div className="mt-1 text-xs text-slate-500">
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
                                    <div className="num">
                                      <div>
                                        কেনা: {formatCurrency(minBuy)} –{" "}
                                        {formatCurrency(maxBuy)}
                                      </div>
                                      <div>
                                        বিক্রি: {formatCurrency(minSell)} –{" "}
                                        {formatCurrency(maxSell)}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                      </td>

                      <td className="cell-num">
                        {(() => {
                          const { buyPrice, sellPrice } =
                            getDisplayPrices(product);
                          const profit = sellPrice - buyPrice;
                          const profitMargin =
                            sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                          const totals = getProductTotals(product);

                          return (
                            <div>
                              <div
                                className={`font-semibold ${
                                  profit > 0
                                    ? "money-pos"
                                    : profit < 0
                                    ? "money-neg"
                                    : "num text-slate-600"
                                }`}
                              >
                                {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                                {formatCurrency(Math.abs(profit))}
                              </div>
                              <div className="num mt-0.5 text-xs text-slate-500">
                                {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                                {Math.abs(profitMargin).toFixed(1)}% মার্জিন
                              </div>
                              <div className="num mt-0.5 text-xs text-slate-600">
                                মোট: {formatCurrency(totals.totalProfit)}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product);
                            }}
                            disabled={loadingStates.navigating[product.id]}
                            className="btn btn-ghost btn-sm"
                            title="স্টক যোগ করুন"
                          >
                            {loadingStates.navigating[product.id] ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                লোড হচ্ছে…
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                স্টক যোগ
                              </>
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                            disabled={
                              loadingStates.navigating[`edit-${product.id}`]
                            }
                            className="btn btn-ghost btn-sm"
                            title="এডিট করুন"
                            aria-label="এডিট করুন"
                          >
                            {loadingStates.navigating[`edit-${product.id}`] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pencil className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(product);
                            }}
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
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="plane-section">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">প্রোডাক্টটা ডিলিট করবেন?</h2>
              <button
                onClick={cancelDelete}
                className="text-slate-500 hover:text-slate-900"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                &quot;{productToDelete.name}&quot; ডিলিট করে দেবেন? একবার ডিলিট
                হলে আর ফেরানো যাবে না।
              </p>
            </div>
            <div className="modal-foot">
              <button onClick={cancelDelete} className="btn btn-ghost">
                বাতিল
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={loadingStates.deleting[productToDelete.id]}
                className="btn btn-danger"
              >
                {loadingStates.deleting[productToDelete.id] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ডিলিট হচ্ছে…
                  </>
                ) : (
                  "ডিলিট করুন"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">প্রোডাক্টের সীমা শেষ</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-500 hover:text-slate-900"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-slate-900">
                  PRO নিলে প্রোডাক্টের কোনো সীমা থাকবে না
                </span>
              </div>
              <p className="text-sm text-slate-600">
                ফ্রি প্ল্যানে সর্বোচ্চ {FREE_PLAN_PRODUCT_LIMIT}টি প্রোডাক্ট রাখা যায়,
                আপনার সেটা শেষ হয়ে গেছে। PRO নিলে যত খুশি প্রোডাক্ট যোগ করতে পারবেন
                আর সব সুবিধা খুলে যাবে।
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-500">এখন ব্যবহার হয়েছে</span>
                <span className="num font-medium text-slate-900">
                  {totalItems}/{FREE_PLAN_PRODUCT_LIMIT} প্রোডাক্ট
                </span>
              </div>
            </div>
            <div className="modal-foot">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn btn-ghost"
              >
                পরে দেখব
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push("/dashboard/subscriptions");
                }}
                className="btn btn-primary"
              >
                <Crown className="h-4 w-4" />
                এখনই আপগ্রেড করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading component for Suspense fallback
function ProductsPageLoading() {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">প্রোডাক্ট</h1>
          <p className="page-sub">স্টক আর প্রোডাক্টের হিসাব এক জায়গায়</p>
        </div>
      </header>

      <div className="plane">
        <div className="stat-strip">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat">
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-20 rounded bg-slate-100"></div>
                <div className="h-6 w-24 rounded bg-slate-100"></div>
                <div className="h-3 w-16 rounded bg-slate-100"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="empty">লোড হচ্ছে…</div>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}
