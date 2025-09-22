"use client";

import Pagination from "@/components/ui/Pagination";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ApiService } from "@/lib/api";
import { Product, ProductVariant } from "@/types/product";
import { Crown, AlertTriangle, TrendingUp } from "lucide-react";
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
          error instanceof Error ? error.message : "Failed to load products"
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
        `"${productToDelete.name}" has been deleted successfully`
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      // Show error notification
      showNotification("error", "Failed to delete product. Please try again.");
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
        showNotification('error', 'No products found to download');
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

      showNotification('success', `Successfully downloaded ${allProducts.length} products as ${filename}`);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      showNotification('error', 'Failed to download products list. Please try again.');
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
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
          border: 1px solid rgba(30, 41, 59, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        .custom-scrollbar-sm::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-sm::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 8px;
        }
        .custom-scrollbar-sm::-webkit-scrollbar-thumb {
          background: #64748b;
          border-radius: 8px;
        }
        .custom-scrollbar-sm::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #475569 rgba(30, 41, 59, 0.5);
        }
        .custom-scrollbar-sm {
          scrollbar-width: thin;
          scrollbar-color: #64748b rgba(51, 65, 85, 0.3);
        }
      `}</style>
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
                  {isStatsLoading ? (
                    <div className="animate-pulse space-y-1">
                      <div className="h-6 bg-cyan-600/30 rounded w-12"></div>
                      <div className="h-3 bg-cyan-600/20 rounded w-20"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base font-bold text-cyan-400">
                        {overallStats.totalProducts}
                      </p>
                      <p className="text-xs text-cyan-500 opacity-80">
                        Active inventory items
                      </p>
                    </>
                  )}
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
                  {isStatsLoading ? (
                    <div className="animate-pulse space-y-1">
                      <div className="h-6 bg-red-600/30 rounded w-16"></div>
                      <div className="h-3 bg-red-600/20 rounded w-20"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base font-bold text-red-400">
                        {formatCurrency(overallStats.totalBuyPrice)}
                      </p>
                      <p className="text-xs text-red-500 opacity-80">
                        Total investment
                      </p>
                    </>
                  )}
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
                  {isStatsLoading ? (
                    <div className="animate-pulse space-y-1">
                      <div className="h-6 bg-green-600/30 rounded w-16"></div>
                      <div className="h-3 bg-green-600/20 rounded w-24"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base font-bold text-green-400">
                        {formatCurrency(overallStats.totalSalePrice)}
                      </p>
                      <p className="text-xs text-green-500 opacity-80">
                        Potential revenue
                      </p>
                    </>
                  )}
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
                  {isStatsLoading ? (
                    <div className="animate-pulse space-y-1">
                      <div className="h-6 bg-purple-600/30 rounded w-16"></div>
                      <div className="h-3 bg-purple-600/20 rounded w-32"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base font-bold text-purple-400">
                        {formatCurrency(overallStats.estimatedProfit)}
                      </p>
                      <p className="text-xs text-purple-500 opacity-80">
                        If all sold at full price
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Usage Indicator for Free Users */}
          {!isPro && !subscriptionLoading && (
            <div className="bg-amber-500/10 border border-amber-500/20 mb-2 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <span className="text-base font-medium text-amber-200">
                      Product Usage
                    </span>
                  </div>
                  <span className="text-sm text-amber-300">
                    {totalItems}/{FREE_PLAN_PRODUCT_LIMIT} products used
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-700 rounded-full h-0.5">
                    <div
                      className={`h-0.5 rounded-full transition-all duration-300 ${
                        getProductUsagePercentage() >= 80
                          ? 'bg-red-500'
                          : getProductUsagePercentage() >= 60
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${getProductUsagePercentage()}%` }}
                    ></div>
                  </div>
                  {getRemainingProducts() <= 5 && getRemainingProducts() > 0 ? (
                    <span className="text-sm text-amber-300 font-medium">
                      {getRemainingProducts()} left
                    </span>
                  ) : getRemainingProducts() === 0 ? (
                    <span className="text-sm text-red-300 font-medium">
                      Limit reached
                    </span>
                  ) : (
                    <span className="text-sm text-green-300 opacity-75">
                      {Math.round(getProductUsagePercentage())}% used
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Products Table/List */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg flex flex-col">
            {/* Header and filters - Fixed at top */}
            <div className="sm:p-4 p-2 flex-shrink-0 border-b border-slate-700/50">
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-slate-200">
                  Product Inventory
                </h3>

                {/* Controls */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0 w-full lg:w-auto">
                    {/* Add Product Button */}
                    <button
                      onClick={handleAddProduct}
                      disabled={loadingStates.addProduct}
                      className={`px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-1 lg:flex-initial justify-center ${
                        !canAddMoreProducts() && !isPro
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500 cursor-pointer"
                          : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-500"
                      } ${
                        loadingStates.addProduct
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {loadingStates.addProduct ? (
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
                      ) : !canAddMoreProducts() && !isPro ? (
                        <>
                          <Crown className="w-4 h-4" />
                          Upgrade
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

                    {/* Download Excel Button */}
                    <button
                      onClick={handleDownloadExcel}
                      disabled={loadingStates.downloadingExcel}
                      className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-1 lg:flex-initial justify-center ${
                        loadingStates.downloadingExcel
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {loadingStates.downloadingExcel ? (
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
                          Downloading...
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
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Excel
                        </>
                      )}
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative w-full lg:flex-1 lg:min-w-0">
                    <input
                      type="text"
                      placeholder="Search products by name or code..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
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

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm w-full lg:min-w-[160px] lg:w-auto cursor-pointer"
                  >
                    <option value="all" className="bg-slate-800">
                      All Categories
                    </option>
                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={String(category.id)}
                        className="bg-slate-800"
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm w-full lg:min-w-[180px] lg:w-auto cursor-pointer"
                  >
                    <option value="newest" className="bg-slate-800">
                      Newest First
                    </option>
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
            </div>

            {/* Scrollable content area */}
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
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <button
                          onClick={() => handleProductClick(product)}
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
                        <p className="text-xs text-slate-400">Stock & Sold</p>
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
                        <div className="text-xs text-slate-400 mt-1">
                          {product.sold || 0} sold
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
                            <p className="text-xs text-slate-400">
                              Total Profit
                            </p>
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
                                (total, variant) =>
                                  total + (variant.stock || 0),
                                0
                              )}{" "}
                              total units
                            </div>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar-sm">
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
                                              const profit =
                                                sellPrice - buyPrice;
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
                                              const profit =
                                                sellPrice - buyPrice;
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
                                  disabled={
                                    loadingStates.navigating[product.id]
                                  }
                                  className={`text-xs transition-colors cursor-pointer ${
                                    loadingStates.navigating[product.id]
                                      ? "text-slate-500 cursor-not-allowed"
                                      : "text-cyan-400 hover:text-cyan-300"
                                  }`}
                                >
                                  {loadingStates.navigating[product.id] ? (
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="animate-spin h-3 w-3"
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
                                    </span>
                                  ) : (
                                    `View ${
                                      product.variants.length - 4
                                    } more variants`
                                  )}
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
              <div className="hidden lg:block">
                <table className="min-w-full">
                  <thead className="bg-slate-900/95 backdrop-blur-sm z-10">
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
                        className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <button
                            onClick={() => handleProductClick(product)}
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
                              {formatCurrency(
                                getDisplayPrices(product).buyPrice
                              )}
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
                              disabled={
                                loadingStates.navigating[`edit-${product.id}`]
                              }
                              className={`text-slate-300 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors ${
                                loadingStates.navigating[`edit-${product.id}`]
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              title="Edit"
                            >
                              {loadingStates.navigating[
                                `edit-${product.id}`
                              ] ? (
                                <svg
                                  className="animate-spin w-4 h-4"
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
                              ) : (
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
                              )}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product);
                              }}
                              disabled={loadingStates.navigating[product.id]}
                              className={`bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5 ${
                                loadingStates.navigating[product.id]
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              title="Add Stock"
                            >
                              {loadingStates.navigating[product.id] ? (
                                <>
                                  <svg
                                    className="animate-spin h-3 w-3"
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
                                "Add Stock"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No products found */}
              {filteredProducts.length === 0 && !isLoading && (
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-700/50">
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
                    className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    disabled={
                      productToDelete &&
                      loadingStates.deleting[productToDelete.id]
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {productToDelete &&
                    loadingStates.deleting[productToDelete.id]
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Modal */}
          {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4">
                    <Crown className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Product Limit Reached
                  </h3>
                  <p className="text-slate-300 mb-4">
                    You&apos;ve reached the limit of {FREE_PLAN_PRODUCT_LIMIT} products for free users. 
                    Upgrade to PRO to add unlimited products and unlock all features.
                  </p>
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Current usage:</span>
                      <span className="text-white font-medium">
                        {totalItems}/{FREE_PLAN_PRODUCT_LIMIT} products
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      router.push("/dashboard/subscriptions");
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Loading component for Suspense fallback
function ProductsPageLoading() {
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

// Main component wrapped with Suspense
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}
