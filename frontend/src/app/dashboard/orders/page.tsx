"use client";

import OrdersControls from "@/components/orders/OrdersControls";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrdersList from "@/components/orders/OrdersList";
import OrdersStats from "@/components/orders/OrdersStats";
import SalesRangeFilter from "@/components/orders/SalesRangeFilter";
import SmsComposer from "@/components/sms/SmsComposer";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Feedback";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { num } from "@/lib/money";
import { printSheet } from "@/lib/printSheet";
import { calculateSmsSegments } from "@/lib/utils/sms";
import { Order, OrderItem } from "@/types/order";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Define interface for product sales summary
interface ProductSale {
  id: number;
  product_id?: number;
  variant_id?: number;
  product_name: string;
  variant_display?: string;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  last_sold: string;
  last_sold_customer?: string;
  stock_remaining?: number;
  available_stock?: number;
  avg_unit_price: number;
  avg_buy_price: number;
  total_buy_price: number; // To track total for calculating average
  sales_count: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  
  // Orders tab state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(""); // For immediate UI updates
  const [searchTerm, setSearchTerm] = useState(""); // For debounced API calls
  const [filterCustomer, setFilterCustomer] = useState("all");
  // Custom range for the sales report; empty means "everything".
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [isNavigating, setIsNavigating] = useState(false);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState<number | null>(null); // Track which order is sending SMS
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsOrder, setSmsOrder] = useState<Order | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [userProfile, setUserProfile] = useState<{
    user?: { email?: string };
    profile?: {
      company?: string;
      company_address?: string;
      phone?: string;
      contact_number?: string;
      store_logo?: string;
    };
  } | null>(null);

  // Products tab state
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSortBy, setProductSortBy] = useState("last_sold");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  
  // Product date filtering state
  const [productDateFilter, setProductDateFilter] = useState("all_time");
  const [productStartDate, setProductStartDate] = useState("");
  const [productEndDate, setProductEndDate] = useState("");
  
  // Product pagination state
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(50);
  const [productTotalItems, setProductTotalItems] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);

  // Date filter state for Excel export
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportPreset, setExportPreset] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Overall statistics (not affected by search/filter)
  const [overallStats, setOverallStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    todaysOrders: 0,
    todaysRevenue: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Function to update URL parameters for orders
  const updateOrdersUrlParams = (updates: { 
    page?: number; 
    pageSize?: number;
    search?: string;
    customer?: string;
    sort?: string;
  }) => {
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

    if (updates.search !== undefined) {
      if (updates.search === '') {
        current.delete('search');
      } else {
        current.set('search', updates.search);
      }
    }

    if (updates.customer !== undefined) {
      if (updates.customer === 'all') {
        current.delete('customer');
      } else {
        current.set('customer', updates.customer);
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort === 'date') {
        current.delete('sort'); // Remove default sort to keep URLs clean
      } else {
        current.set('sort', updates.sort);
      }
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    // Use replace to avoid adding to browser history for every change
    router.replace(`/dashboard/orders${query}`, { scroll: false });
  };

  // Function to update URL parameters for products
  const updateProductsUrlParams = (updates: { 
    page?: number; 
    pageSize?: number;
    search?: string;
    sort?: string;
  }) => {
    const current = new URLSearchParams(searchParams);
    
    // Set active tab
    current.set('tab', 'products');
    
    if (updates.page !== undefined) {
      if (updates.page === 1) {
        current.delete('productsPage');
      } else {
        current.set('productsPage', updates.page.toString());
      }
    }
    
    if (updates.pageSize !== undefined) {
      if (updates.pageSize === 50) {
        current.delete('productsPageSize');
      } else {
        current.set('productsPageSize', updates.pageSize.toString());
      }
    }

    if (updates.search !== undefined) {
      if (updates.search === '') {
        current.delete('productsSearch');
      } else {
        current.set('productsSearch', updates.search);
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort === 'last_sold') {
        current.delete('productsSort');
      } else {
        current.set('productsSort', updates.sort);
      }
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    router.replace(`/dashboard/orders${query}`, { scroll: false });
  };

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      // Only update if the search input actually changed from user typing
      if (searchTerm !== searchInput) {
        setSearchTerm(searchInput);
        if (activeTab === 'orders') {
          updateOrdersUrlParams({ search: searchInput, page: 1 });
        }
      }
    }, 400); // Consistent 400ms debounce for optimal UX

    return () => clearTimeout(debounceTimer);
  }, [searchInput, activeTab]); // Removed searchTerm from dependency to avoid loops

  // Debounce product search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      // Only update if the search input actually changed from user typing
      if (productSearchTerm !== productSearchInput) {
        setProductSearchTerm(productSearchInput);
        if (activeTab === 'products') {
          updateProductsUrlParams({ search: productSearchInput, page: 1 });
        }
      }
    }, 400); // Consistent 400ms debounce for optimal UX

    return () => clearTimeout(debounceTimer);
  }, [productSearchInput, activeTab]); // Removed productSearchTerm from dependency to avoid loops

  // State to track if URL parameters have been initialized
  const [urlParamsInitialized, setUrlParamsInitialized] = useState(false);

  // Initial URL parameter setup - run once on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('pageSize');
    const searchParam = searchParams.get('search');
    const customerParam = searchParams.get('customer');
    const sortParam = searchParams.get('sort');
    
    // Products tab parameters
    const productsPageParam = searchParams.get('productsPage');
    const productsSizeParam = searchParams.get('productsPageSize');
    const productsSearchParam = searchParams.get('productsSearch');
    const productsSortParam = searchParams.get('productsSort');
    
    // Set active tab first
    if (tabParam === 'products') {
      setActiveTab('products');
    } else {
      setActiveTab('orders');
    }
    
    // Set orders parameters
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;
    const urlPageSize = sizeParam ? parseInt(sizeParam, 10) : 10;
    const urlSearch = searchParam || '';
    const urlCustomer = customerParam || 'all';
    const urlSort = sortParam || 'date';
    
    setCurrentPage(urlPage);
    setPageSize(urlPageSize);
    setSearchInput(urlSearch);
    setSearchTerm(urlSearch); // Also set the debounced term immediately
    setFilterCustomer(urlCustomer);
    setSortBy(urlSort);
    
    // Set products parameters
    const urlProductsPage = productsPageParam ? parseInt(productsPageParam, 10) : 1;
    const urlProductsPageSize = productsSizeParam ? parseInt(productsSizeParam, 10) : 50;
    const urlProductsSearch = productsSearchParam || '';
    const urlProductsSort = productsSortParam || 'last_sold';
    
    setProductCurrentPage(urlProductsPage);
    setProductPageSize(urlProductsPageSize);
    setProductSearchInput(urlProductsSearch);
    setProductSearchTerm(urlProductsSearch); // Also set the debounced term immediately
    setProductSortBy(urlProductsSort);
    
    // Mark URL parameters as initialized
    setUrlParamsInitialized(true);
  }, []); // Run only once on mount

  // Initialize product date filter to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setProductStartDate(today);
    setProductEndDate(today);
  }, []);

  // Handle URL parameter changes for browser navigation (back/forward)
  useEffect(() => {
    // Skip the initial mount since we handle it in the setup effect
    const tabParam = searchParams.get('tab');
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('pageSize');
    const searchParam = searchParams.get('search');
    const customerParam = searchParams.get('customer');
    const sortParam = searchParams.get('sort');
    
    // Products tab parameters
    const productsPageParam = searchParams.get('productsPage');
    const productsSizeParam = searchParams.get('productsPageSize');
    const productsSearchParam = searchParams.get('productsSearch');
    const productsSortParam = searchParams.get('productsSort');
    
    // Update active tab
    const newTab = tabParam === 'products' ? 'products' : 'orders';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
    
    // Update orders parameters only if they changed
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;
    const urlPageSize = sizeParam ? parseInt(sizeParam, 10) : 10;
    const urlSearch = searchParam || '';
    const urlCustomer = customerParam || 'all';
    const urlSort = sortParam || 'date';
    
    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlPageSize !== pageSize) setPageSize(urlPageSize);
    if (urlSearch !== searchInput) {
      setSearchInput(urlSearch);
      setSearchTerm(urlSearch);
    }
    if (urlCustomer !== filterCustomer) setFilterCustomer(urlCustomer);
    if (urlSort !== sortBy) setSortBy(urlSort);
    
    // Update products parameters only if they changed
    const urlProductsPage = productsPageParam ? parseInt(productsPageParam, 10) : 1;
    const urlProductsPageSize = productsSizeParam ? parseInt(productsSizeParam, 10) : 50;
    const urlProductsSearch = productsSearchParam || '';
    const urlProductsSort = productsSortParam || 'last_sold';
    
    if (urlProductsPage !== productCurrentPage) setProductCurrentPage(urlProductsPage);
    if (urlProductsPageSize !== productPageSize) setProductPageSize(urlProductsPageSize);
    if (urlProductsSearch !== productSearchInput) {
      setProductSearchInput(urlProductsSearch);
      setProductSearchTerm(urlProductsSearch);
    }
    if (urlProductsSort !== productSortBy) setProductSortBy(urlProductsSort);
  }, [searchParams.toString()]); // React to URL changes only

  // Handle success message from edit page
  useEffect(() => {
    const updated = searchParams.get("updated");
    if (updated === "true") {
      setSuccessMessage("অর্ডার আপডেট হয়েছে!");
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("updated");
      window.history.replaceState({}, "", url.toString());

      // Clear message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      // Show appropriate loading state
      if (currentPage === 1 && !searchTerm && filterCustomer === "all") {
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
        customer?: string;
        ordering?: string;
        start_date?: string;
        end_date?: string;
      } = {
        page: currentPage,
        page_size: pageSize,
      };

      // The API already understands start_date/end_date; the UI just never
      // offered a way to set them.
      if (dateFrom) params.start_date = dateFrom;
      if (dateTo) params.end_date = dateTo;

      // Add search if exists
      if (searchTerm.trim()) {
        // If search starts with #, remove it for order number search
        let processedSearch = searchTerm.trim();
        if (processedSearch.startsWith('#')) {
          processedSearch = processedSearch.substring(1).trim();
          console.log(`🔍 Order number search: "${searchTerm}" -> "${processedSearch}"`);
        }
        if (processedSearch) {
          params.search = processedSearch;
        }
      }

      // Add customer filter if not "all"
      if (filterCustomer !== "all") {
        params.customer = filterCustomer;
      }

      // Add ordering
      if (sortBy) {
        switch (sortBy) {
          case "date":
            params.ordering = "-sale_date";
            break;
          case "product":
            params.ordering = "product_name";
            break;
          case "customer":
            params.ordering = "customer_name";
            break;
          case "amount-high":
            params.ordering = "-total_amount";
            break;
          case "amount-low":
            params.ordering = "total_amount";
            break;
          case "quantity-high":
            params.ordering = "-quantity";
            break;
          case "quantity-low":
            params.ordering = "quantity";
            break;
          default:
            params.ordering = "-sale_date";
        }
      }

      console.log('🚀 Fetching orders with params:', params);
      const ordersData = await ApiService.getProductSalesWithPagination(params);
      console.log('📊 API Response:', ordersData);

      // Handle paginated response
      if (
        ordersData &&
        typeof ordersData === "object" &&
        "results" in ordersData
      ) {
        // Backend returned paginated data
        setOrders(ordersData.results || []);
        setTotalItems(ordersData.count || 0);
        setTotalPages(Math.ceil((ordersData.count || 0) / pageSize));
      } else {
        // Handle non-paginated response (fallback)
        const ordersList = Array.isArray(ordersData) ? ordersData : [];
        setOrders(ordersList);
        setTotalItems(ordersList.length);
        setTotalPages(Math.ceil(ordersList.length / pageSize));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("অর্ডার লোড করা যায়নি");
      setOrders([]); // Clear orders on error
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, pageSize, searchTerm, filterCustomer, sortBy, dateFrom, dateTo]);

  // Fetch product sales summary (server-side pagination)
  const fetchProductSales = useCallback(async () => {
    try {
      setIsSearchingProducts(true);
      setIsLoadingProducts(true);

      const params: any = {
        page: productCurrentPage,
        page_size: productPageSize,
      };

      if (productSearchTerm.trim()) {
        params.search = productSearchTerm.trim();
      }

      // Add date filtering based on selected filter
      if (productDateFilter === "all_time") {
        // No date filter — include all orders
      } else if (productDateFilter === "today") {
        const today = new Date().toISOString().split('T')[0];
        params.start_date = today;
        params.end_date = today;
      } else if (productDateFilter === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        params.start_date = yesterdayStr;
        params.end_date = yesterdayStr;
      } else if (productDateFilter === "last_7_days") {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = endDate;
      } else if (productDateFilter === "last_30_days") {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = endDate;
      } else if (productDateFilter === "custom") {
        if (productStartDate) params.start_date = productStartDate;
        if (productEndDate) params.end_date = productEndDate;
      }

      // Map sort to backend ordering
      switch (productSortBy) {
        case "total_quantity":
          params.ordering = "-total_quantity";
          break;
        case "total_profit":
          params.ordering = "-total_profit";
          break;
        case "profit_margin":
          params.ordering = "-profit_margin";
          break;
        case "last_sold":
          params.ordering = "-last_sold";
          break;
        case "product_name":
          params.ordering = "product_name";
          break;
        default:
          params.ordering = "-total_quantity";
      }

      // Use the product_summary endpoint which aggregates sold products
      const response = await ApiService.getProductSalesSummary(params);

      // The backend already returns aggregated data
      if (response && response.results) {
        setProductSales(response.results);
        setProductTotalItems(response.count || response.results.length);
        setProductTotalPages(Math.ceil((response.count || response.results.length) / productPageSize));
      } else {
        setProductSales([]);
        setProductTotalItems(0);
        setProductTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching product sales summary:", error);
      setProductSales([]);
      setProductTotalItems(0);
      setProductTotalPages(0);
    } finally {
      setIsLoadingProducts(false);
      setIsSearchingProducts(false);
    }
  }, [productCurrentPage, productPageSize, productSearchTerm, productSortBy, productDateFilter, productStartDate, productEndDate]);

  // Fetch orders when dependencies change
  useEffect(() => {
    if (activeTab === 'orders' && urlParamsInitialized) {
      fetchOrders();
    }
  }, [fetchOrders, activeTab, urlParamsInitialized]);

  // Handle order update success notification and refetch data
  useEffect(() => {
    const updated = searchParams.get("updated");
    if (updated === "true" && activeTab === 'orders') {
      // Refetch orders to show updated data
      fetchOrders();
    }
  }, [searchParams, fetchOrders, activeTab]);

  // Fetch product sales when dependencies change
  useEffect(() => {
    if (activeTab === "products" && urlParamsInitialized) {
      fetchProductSales();
    }
  }, [fetchProductSales, activeTab, urlParamsInitialized]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log("User profile data:", profile); // Debug log
      console.log("Store logo URL:", profile?.profile?.store_logo); // Debug log for logo
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  const fetchOverallStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      // Fetch stats from dedicated endpoint
      const statsData = await ApiService.getOrderStats();

      setOverallStats({
        totalOrders: statsData.totalOrders || 0,
        totalRevenue: statsData.totalRevenue || 0,
        totalProfit: statsData.totalProfit || 0,
        todaysOrders: statsData.todaysOrders || 0,
        todaysRevenue: statsData.todaysRevenue || 0,
      });
    } catch (error) {
      console.error("Error fetching overall statistics:", error);
      setOverallStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        todaysOrders: 0,
        todaysRevenue: 0,
      });
    } finally {
      setIsStatsLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount

  // Fetch user profile and stats only once on mount
  useEffect(() => {
    fetchUserProfile();
    fetchOverallStats();
  }, [fetchUserProfile, fetchOverallStats]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateOrdersUrlParams({ page });
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    updateOrdersUrlParams({ page: 1, pageSize: newPageSize });
  }, []);

  /**
   * Sales report for whatever range is on screen.
   *
   * Fetches the whole filtered set rather than printing the current page —
   * a report of "page 3 of the sales" would be useless.
   */
  const handleDownloadSalesReport = useCallback(async () => {
    try {
      const response = await ApiService.getOrdersList({
        page_size: 500,
        search: searchTerm.trim().replace(/^#/, "") || undefined,
        customer: filterCustomer !== "all" ? filterCustomer : undefined,
        start_date: dateFrom || undefined,
        end_date: dateTo || undefined,
        ordering: "-created_at",
      });
      const rows: Order[] = Array.isArray(response)
        ? response
        : response?.results ?? [];

      if (rows.length === 0) {
        toast.error("এই সময়ে কোনো বিক্রি নেই");
        return;
      }

      const total = rows.reduce((sum, o) => sum + num(o.total_amount), 0);
      const cost = rows.reduce((sum, o) => sum + num(o.total_buy_price), 0);
      const paid = rows.reduce((sum, o) => sum + num(o.paid_amount), 0);
      const rangeLabel =
        dateFrom || dateTo
          ? `${dateFrom || "শুরু"} — ${dateTo || "আজ"}`
          : "সব সময়";

      const opened = printSheet({
        title: "বিক্রির রিপোর্ট",
        subtitle: rangeLabel,
        cards: [
          { label: "অর্ডার", value: String(rows.length) },
          { label: "মোট বিক্রি", value: formatCurrency(total) },
          { label: "কেনা দাম", value: formatCurrency(cost) },
          { label: "নিট লাভ", value: formatCurrency(total - cost) },
        ],
        head: ["অর্ডার", "তারিখ", "কাস্টমার", "কেনা", "মোট", "জমা", "লাভ"],
        numericColumns: [3, 4, 5, 6],
        rows: rows.map((o) => [
          `#${o.id}`,
          new Date(o.sale_date).toLocaleDateString("bn-BD"),
          o.customer_name || "—",
          formatCurrency(num(o.total_buy_price)),
          formatCurrency(num(o.total_amount)),
          formatCurrency(num(o.paid_amount)),
          formatCurrency(num(o.total_amount) - num(o.total_buy_price)),
        ]),
        footNote: `মোট বিক্রি ${formatCurrency(total)} · জমা ${formatCurrency(
          paid
        )} · নিট লাভ ${formatCurrency(total - cost)}`,
      });

      if (!opened) {
        toast.error("প্রিন্ট উইন্ডো খোলা যায়নি — পপ-আপ চালু করুন");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "রিপোর্ট বানানো গেল না");
    }
  }, [searchTerm, filterCustomer, dateFrom, dateTo, formatCurrency, toast]);

  const handleAddOrder = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push("/dashboard/orders/add");
    }, 300);
  }, [router]);

  // Clicking a row opens that order's invoice — the app has no separate
  // order-details route, and the invoice is the full view of an order.
  // (Previously this only logged to the console, so rows looked clickable
  // but did nothing.)
  const handleOrderClick = useCallback((order: Order) => {
    window.open(`/invoice/${order.id}`, "_blank");
  }, []);

  const handleCustomerClick = useCallback(
    async (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event

      if (!order.customer_name && !order.customer_phone) {
        toast.error("কাস্টমারের কোনো তথ্য নেই");
        return;
      }

      try {
        // Look up customer by name and phone to get customer ID
        const customers = await ApiService.getCustomers({ page_size: 500 });
        const customer = customers.find((c: any) => {
          const nameMatch =
            c.name?.toLowerCase().trim() ===
            order.customer_name?.toLowerCase().trim();
          const phoneMatch = c.phone === order.customer_phone;
          return nameMatch || phoneMatch;
        });

        if (customer) {
          // Navigate to customer details page
          setIsNavigating(true);
          setTimeout(() => {
            router.push(`/dashboard/customers/${customer.id}`);
          }, 300);
        } else {
          toast.error("সিস্টেমে এই কাস্টমারকে পাওয়া যায়নি");
        }
      } catch (error) {
        console.error("Error finding customer:", error);
        toast.error("কাস্টমারের তথ্য বের করা যায়নি");
      }
    },
    [router, toast]
  );

  const handleEditInvoice = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      router.push(`/dashboard/orders/edit/${order.id}`);
    },
    [router]
  );

  const handleViewInvoice = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      // Open invoice in new tab instead of popup
      const invoiceUrl = `/invoice/${order.id}`;
      window.open(invoiceUrl, '_blank');
    },
    []
  );

  const handlePrintInvoice = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      // Open invoice popup first, then user can print from there
      handleViewInvoice(order, event);
    },
    [handleViewInvoice]
  );

  const handleDeleteOrder = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      setOrderToDelete(order);
      setShowDeleteConfirm(true);
    },
    []
  );

  const handleSendSms = useCallback(
    async (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event

      if (!order.customer_phone) {
        toast.error("এই কাস্টমারের ফোন নম্বর দেওয়া নেই", {
          label: "নম্বর যোগ করুন",
          href: "/dashboard/customers",
        });
        return;
      }

      if (!userProfile?.profile?.company) {
        toast.error("প্রোফাইলে স্টোরের নাম দেওয়া নেই", {
          label: "নাম যোগ করুন",
          href: "/dashboard/settings?tab=store",
        });
        return;
      }

      try {
        // Get customer financial details
        let dueAmount = 0;
        let advanceAmount = 0;
        console.log(
          "Fetching customer financial details for:",
          order.customer_name,
          order.customer_phone
        );

        if (order.customer_name && order.customer_phone) {
          try {
            // Try to get customer due amount from backend
            const customers = await ApiService.getCustomers({ page_size: 500 });
            console.log("All customers:", customers);

            const customer = customers.find((c: any) => {
              const nameMatch =
                c.name?.toLowerCase().trim() ===
                order.customer_name?.toLowerCase().trim();
              const phoneMatch = c.phone === order.customer_phone;
              return nameMatch || phoneMatch;
            });

            console.log("Found customer:", customer);

            if (customer) {
              // Use the customer summary endpoint to get financial details
              const response = await ApiService.get(
                `/customers/${customer.id}/summary/`
              );
              console.log("Customer summary response:", response);

              // Get the financial summary
              const financialSummary = response.financial_summary || {};

              // Log all financial data for debugging
              console.log("Financial summary:", financialSummary);
              console.log("Total due:", financialSummary.total_due);
              console.log("Total advance:", financialSummary.total_advance);
              console.log("Net amount:", financialSummary.net_amount);

              // Calculate net balance - positive means customer owes money (due), negative means customer has credit (advance)
              let netBalance = 0;

              if (
                financialSummary.net_amount !== undefined &&
                financialSummary.net_amount !== null
              ) {
                netBalance = parseFloat(financialSummary.net_amount);
              } else if (
                financialSummary.total_due !== undefined &&
                financialSummary.total_advance !== undefined
              ) {
                netBalance =
                  parseFloat(financialSummary.total_due || 0) -
                  parseFloat(financialSummary.total_advance || 0);
              }

              console.log("Calculated net balance:", netBalance);

              // Determine financial state based on net balance
              if (netBalance > 0) {
                dueAmount = netBalance;
                advanceAmount = 0;
                console.log("Customer has due amount:", dueAmount);
              } else if (netBalance < 0) {
                dueAmount = 0;
                advanceAmount = Math.abs(netBalance);
                console.log("Customer has advance amount:", advanceAmount);
              } else {
                dueAmount = 0;
                advanceAmount = 0;
                console.log("Customer has no due or advance amount");
              }
            } else {
              console.log("Customer not found in database");

              // Check if the order itself has due amount information
              if (order.remaining_balance && order.remaining_balance > 0) {
                dueAmount = order.remaining_balance;
                console.log("Using order remaining balance as due:", dueAmount);
              } else if (order.due_amount && order.due_amount > 0) {
                dueAmount = order.due_amount;
                console.log("Using order due amount:", dueAmount);
              }
            }
          } catch (error) {
            console.log("Error fetching customer financial details:", error);

            // Fallback: check order's due amount fields
            if (order.remaining_balance && order.remaining_balance > 0) {
              dueAmount = order.remaining_balance;
            } else if (order.due_amount && order.due_amount > 0) {
              dueAmount = order.due_amount;
            }
          }
        }

        // Format the SMS message
        const storeName = userProfile.profile.company;
        const amount = formatCurrency(order.total_amount);

        let message = `সম্মানিত কাস্টমার, আপনার কেনাকাটা ${amount} টাকা, ${storeName} এ কেনাকাটা করার জন্য আপনাকে ধন্যবাদ!`;

        // Add due message only if customer has due money (greater than 0)
        console.log("Final due amount to check:", dueAmount);
        console.log("Final advance amount to check:", advanceAmount);

        if (dueAmount > 0) {
          const dueAmountFormatted = formatCurrency(dueAmount);
          message += ` আমাদের খাতায় আপনার বাকি রয়েছে ${dueAmountFormatted} টাকা`;
          console.log("Added due message to SMS");
        } else if (advanceAmount > 0) {
          const advanceAmountFormatted = formatCurrency(advanceAmount);
          message += ` আমাদের খাতায় আপনার এডভান্স করা রয়েছে ${advanceAmountFormatted} টাকা`;
          console.log("Added advance message to SMS");
        }
        // If neither due nor advance, send only the basic thank you message

        console.log("Final SMS message:", message);

        // Set the message and show composer
        setSmsMessage(message);
        setSmsOrder(order);
        setShowSmsComposer(true);
      } catch (error) {
        console.error("Error preparing SMS:", error);
        toast.error("এসএমএস তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      }
    },
    [formatCurrency, userProfile, toast]
  );

  // Handle actual SMS sending from composer
  const handleSendSmsFromComposer = useCallback(
    async (message: string) => {
      if (!smsOrder || !smsOrder.customer_phone) return;

      try {
        // Set loading state for this specific order
        setIsSendingSms(smsOrder.id);

        // Send SMS
        console.log(
          "Sending SMS to:",
          smsOrder.customer_phone,
          "Message:",
          message
        );
        const response = await ApiService.sendSmsNotification(
          smsOrder.customer_phone,
          message
        );
        console.log("SMS Response:", response);

        // Check if the response indicates success
        if (response.success === false) {
          throw new Error(response.error || "SMS sending failed");
        }

        // Use actual credits used from backend response, fallback to frontend calculation
        const creditsUsed =
          response.credits_used || calculateSmsSegments(message).segments;
        toast.success(
          `এসএমএস পাঠানো হয়েছে! ${creditsUsed}টি এসএমএস ক্রেডিট খরচ হয়েছে।`
        );

        // Close composer
        setShowSmsComposer(false);
        setSmsOrder(null);
        setSmsMessage("");
      } catch (error) {
        console.error("Error sending SMS:", error);

        // Show more detailed error message
        let errorMessage = "এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "error" in error
        ) {
          errorMessage = (error as any).error;
        }

        toast.error(`এসএমএস সমস্যা: ${errorMessage}`);
      } finally {
        // Clear loading state
        setIsSendingSms(null);
      }
    },
    [smsOrder, toast]
  );

  // Handle SMS composer cancel
  const handleCancelSms = useCallback(() => {
    setShowSmsComposer(false);
    setSmsOrder(null);
    setSmsMessage("");
  }, []);

  // Memoized state setters
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // URL update is handled in debounced effect
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilterCustomer(value);
    setCurrentPage(1); // Reset to first page when filtering
    updateOrdersUrlParams({ customer: value, page: 1 });
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    updateOrdersUrlParams({ sort: value });
  }, []);

  // Product tab handlers
  const handleProductSearchChange = useCallback((value: string) => {
    setProductSearchInput(value);
    // URL update is handled in debounced effect
  }, []);

  const handleProductSortChange = useCallback((value: string) => {
    setProductSortBy(value);
    setProductCurrentPage(1); // Reset to first page when sorting
    updateProductsUrlParams({ sort: value, page: 1 });
  }, []);

  const handleProductDateFilterChange = useCallback((filter: string) => {
    setProductDateFilter(filter);
    setProductCurrentPage(1); // Reset to first page when changing filter
    
    // Set default dates for predefined filters
    if (filter === "today") {
      const today = new Date().toISOString().split('T')[0];
      setProductStartDate(today);
      setProductEndDate(today);
    } else if (filter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setProductStartDate(yesterdayStr);
      setProductEndDate(yesterdayStr);
    }
  }, []);

  const handleTabChange = useCallback((tab: "orders" | "products") => {
    setActiveTab(tab);
    // Update URL with tab parameter
    const current = new URLSearchParams(searchParams);
    if (tab === 'products') {
      current.set('tab', 'products');
    } else {
      current.delete('tab'); // Default to orders
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.replace(`/dashboard/orders${query}`, { scroll: false });
  }, [searchParams, router]);

  // Handle product name click navigation
  const handleProductClick = useCallback((productId?: number) => {
    if (productId) {
      router.push(`/dashboard/products/${productId}`);
    }
  }, [router]);

  // Product pagination handlers
  const handleProductPageChange = useCallback((page: number) => {
    setProductCurrentPage(page);
    updateProductsUrlParams({ page });
  }, []);

  const handleProductPageSizeChange = useCallback((newPageSize: number) => {
    setProductPageSize(newPageSize);
    setProductCurrentPage(1); // Reset to first page when changing page size
    updateProductsUrlParams({ page: 1, pageSize: newPageSize });
  }, []);

  // Excel export functionality
  const exportToExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      console.log("Starting export with dates:", exportStartDate, exportEndDate);
      
      // Use the same endpoint as the products tab (getProductSalesSummary)
      const params: any = {
        page_size: 10000, // Get all data for export
        ordering: "-total_quantity",
      };

      if (exportStartDate) {
        params.start_date = exportStartDate;
        console.log("Added start_date:", exportStartDate);
      }
      if (exportEndDate) {
        params.end_date = exportEndDate;
        console.log("Added end_date:", exportEndDate);
      }

      console.log("Export API params:", params);
      // Use the product summary endpoint - same as what the products tab uses
      const response = await ApiService.getProductSalesSummary(params);
      console.log("Export API response:", response);
      
      let salesData: ProductSale[] = [];
      if (response && typeof response === "object" && "results" in response) {
        salesData = response.results || [];
      } else if (Array.isArray(response)) {
        salesData = response;
      } else {
        console.error("Unexpected response format:", response);
        throw new Error("সার্ভার থেকে ঠিক তথ্য আসেনি");
      }

      console.log("Processing", salesData.length, "products for export");

      if (salesData.length === 0) {
        toast.info("এই তারিখের মধ্যে কোনো তথ্য পাওয়া যায়নি");
        return;
      }

      // Create Excel data directly from the API response
      // Convert string values to numbers before using toFixed
      const excelData = salesData.map((product: ProductSale) => ({
        'প্রোডাক্টের নাম': product.product_name || 'নাম নেই',
        'ভ্যারিয়েন্ট': product.variant_display || '',
        'মোট বিক্রি': Number(product.total_quantity) || 0,
        'বিক্রির দাম': Number(product.avg_unit_price || 0).toFixed(2),
        'কেনা দাম': Number(product.avg_buy_price || 0).toFixed(2),
        'মোট বিক্রির টাকা': Number(product.total_revenue || 0).toFixed(2),
        'মোট লাভ': Number(product.total_profit || 0).toFixed(2),
        'লাভের হার (%)': Number(product.profit_margin || 0).toFixed(2),
        'স্টকে আছে': product.available_stock ?? product.stock_remaining ?? '—',
        'শেষ বিক্রি': product.last_sold ? new Date(product.last_sold).toLocaleDateString() : '—',
      }));

      // Convert to CSV and download
      const csvContent = convertToCSV(excelData);
      if (!csvContent) {
        throw new Error("সিএসভি ফাইল বানানো যায়নি");
      }
      
      downloadCSV(csvContent, `product-sales-${exportStartDate || 'all'}-to-${exportEndDate || 'now'}.csv`);
      console.log("Export completed successfully");
      
      setShowExportDialog(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(
        `এক্সপোর্ট করা যায়নি: ${error instanceof Error ? error.message : "কিছু একটা সমস্যা হয়েছে"}`
      );
    } finally {
      setIsExporting(false);
    }
  }, [exportStartDate, exportEndDate, toast]);

  // Handle preset date selection
  const handlePresetChange = (preset: string) => {
    setExportPreset(preset);
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (preset) {
      case "today":
        setExportStartDate(formatDate(today));
        setExportEndDate(formatDate(today));
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setExportStartDate(formatDate(yesterday));
        setExportEndDate(formatDate(yesterday));
        break;
      case "this_week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setExportStartDate(formatDate(startOfWeek));
        setExportEndDate(formatDate(today));
        break;
      case "last_week":
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        setExportStartDate(formatDate(lastWeekStart));
        setExportEndDate(formatDate(lastWeekEnd));
        break;
      case "this_month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setExportStartDate(formatDate(startOfMonth));
        setExportEndDate(formatDate(today));
        break;
      case "last_month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setExportStartDate(formatDate(lastMonth));
        setExportEndDate(formatDate(lastMonthEnd));
        break;
      case "custom":
        // Keep existing dates or clear them
        break;
      default:
        setExportStartDate("");
        setExportEndDate("");
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Helper function to download CSV
  const downloadCSV = (csvContent: string, filename: string) => {
    try {
      console.log("Attempting to download CSV with filename:", filename);
      console.log("CSV content length:", csvContent.length);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log("Blob created successfully, size:", blob.size);
      
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        console.log("Object URL created:", url);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        console.log("Triggering download...");
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Download completed and cleanup done");
      } else {
        throw new Error("এই ব্রাউজারে ফাইল ডাউনলোড করা যায় না");
      }
    } catch (error) {
      console.error("Error in downloadCSV:", error);
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);
      await ApiService.deleteProductSale(orderToDelete.id);

      // Refresh the orders list
      await fetchOrders();

      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      // You might want to show an error notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const closeInvoicePopup = () => {
    setShowInvoicePopup(false);
    setSelectedOrder(null);
  };

  const printInvoice = () => {
    window.print();
  };

  // Calculate statistics from filtered results for current view - removed since pagination handles filtering on backend
  // Orders are now pre-filtered and sorted by the backend API based on search/filter parameters

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">বিক্রি ও অর্ডার</h1>
            <p className="page-sub">কাস্টমারের সব বিক্রি আর লেনদেনের হিসাব</p>
          </div>
        </header>
        <div className="plane">
          <div className="plane-section">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-40 rounded bg-slate-100"></div>
              <div className="h-4 w-full rounded bg-slate-100"></div>
              <div className="h-4 w-5/6 rounded bg-slate-100"></div>
              <div className="h-4 w-2/3 rounded bg-slate-100"></div>
            </div>
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
            <h1 className="page-title">বিক্রি ও অর্ডার</h1>
            <p className="page-sub">কাস্টমারের সব বিক্রি আর লেনদেনের হিসাব</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">
            <p className="text-slate-900 font-medium mb-1">
              অর্ডার লোড করা যায়নি
            </p>
            <p className="mb-4">{error}</p>
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

  return (
    <div className="page">
      {/* Page Header */}
      <OrdersHeader />

      {/* Success Message */}
      {successMessage && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-emerald-700 hover:text-emerald-900"
            aria-label="বার্তাটি বন্ধ করুন"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="plane">
        {/* KPIs */}
        <OrdersStats
          overallStats={overallStats}
          isStatsLoading={isStatsLoading}
        />

        {/* Tab Navigation — the range picker shares this row rather than
            taking a band of its own: the window applies to both tabs, and the
            row was otherwise empty from the tabs to the right edge. */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTabChange("orders")}
                className={`btn btn-sm ${
                  activeTab === "orders" ? "btn-primary" : "btn-ghost"
                }`}
              >
                অর্ডার
              </button>
              <button
                onClick={() => handleTabChange("products")}
                className={`btn btn-sm ${
                  activeTab === "products" ? "btn-primary" : "btn-ghost"
                }`}
              >
                বিক্রি হওয়া প্রোডাক্ট
              </button>
            </div>

            <SalesRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
                setCurrentPage(1);
              }}
              onDownloadReport={handleDownloadSalesReport}
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "orders" ? (
          <>
            <OrdersControls
              searchInput={searchInput}
              searchTerm={searchTerm}
              isSearching={isSearching}
              filterCustomer={filterCustomer}
              sortBy={sortBy}
              isNavigating={isNavigating}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onAddOrder={handleAddOrder}
            />

            <OrdersList
              orders={orders}
              totalItems={totalItems}
              isSearching={isSearching}
              searchInput={searchInput}
              isSendingSms={isSendingSms}
              onOrderClick={handleOrderClick}
              onCustomerClick={handleCustomerClick}
              onViewInvoice={handleViewInvoice}
              onPrintInvoice={handlePrintInvoice}
              onEditInvoice={handleEditInvoice}
              onDeleteOrder={handleDeleteOrder}
              onSendSms={handleSendSms}
              onAddOrder={handleAddOrder}
            />

            {/* Pagination Controls */}
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
          </>
        ) : (
          <>
            {/* Product Sales Controls */}
            <div className="plane-section">
              <div className="section-title">তারিখ ফিল্টার</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleProductDateFilterChange("all_time")}
                  className={`btn btn-sm ${
                    productDateFilter === "all_time" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  সব সময়
                </button>
                <button
                  onClick={() => handleProductDateFilterChange("today")}
                  className={`btn btn-sm ${
                    productDateFilter === "today" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  আজকে
                </button>
                <button
                  onClick={() => handleProductDateFilterChange("yesterday")}
                  className={`btn btn-sm ${
                    productDateFilter === "yesterday"
                      ? "btn-primary"
                      : "btn-ghost"
                  }`}
                >
                  গতকাল
                </button>
                <button
                  onClick={() => handleProductDateFilterChange("last_7_days")}
                  className={`btn btn-sm ${
                    productDateFilter === "last_7_days"
                      ? "btn-primary"
                      : "btn-ghost"
                  }`}
                >
                  শেষ ৭ দিন
                </button>
                <button
                  onClick={() => handleProductDateFilterChange("last_30_days")}
                  className={`btn btn-sm ${
                    productDateFilter === "last_30_days"
                      ? "btn-primary"
                      : "btn-ghost"
                  }`}
                >
                  শেষ ৩০ দিন
                </button>
                <button
                  onClick={() => handleProductDateFilterChange("custom")}
                  className={`btn btn-sm ${
                    productDateFilter === "custom" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  নিজে তারিখ দিন
                </button>
              </div>

              {productDateFilter === "custom" && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="date"
                    value={productStartDate}
                    onChange={(e) => setProductStartDate(e.target.value)}
                    className="input sm:w-auto"
                    aria-label="শুরুর তারিখ"
                  />
                  <span className="text-slate-500 text-sm">থেকে</span>
                  <input
                    type="date"
                    value={productEndDate}
                    onChange={(e) => setProductEndDate(e.target.value)}
                    className="input sm:w-auto"
                    aria-label="শেষের তারিখ"
                  />
                </div>
              )}
            </div>

            <div className="plane-section">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-1">
                  {/* Search Input */}
                  <div className="relative w-full sm:max-w-xs">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none"
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
                    <input
                      type="text"
                      placeholder="প্রোডাক্ট খুঁজুন…"
                      value={productSearchInput}
                      onChange={(e) => handleProductSearchChange(e.target.value)}
                      className="input pl-9 pr-9"
                    />
                    {isSearchingProducts && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="animate-spin h-4 w-4 text-cyan-600"
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

                  {/* Sort Dropdown */}
                  <select
                    value={productSortBy}
                    onChange={(e) => handleProductSortChange(e.target.value)}
                    className="select sm:w-auto"
                    aria-label="সাজানোর নিয়ম"
                  >
                    <option value="total_quantity">সবচেয়ে বেশি বিক্রি</option>
                    <option value="total_profit">সবচেয়ে বেশি লাভ</option>
                    <option value="profit_margin">সবচেয়ে বেশি লাভের হার</option>
                    <option value="last_sold">সদ্য বিক্রি হওয়া</option>
                    <option value="product_name">প্রোডাক্টের নাম</option>
                  </select>

                  {/* Export Button */}
                  <button
                    onClick={() => setShowExportDialog(true)}
                    className="btn btn-ghost"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    এক্সেলে নামান
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  মোট {productTotalItems}টি প্রোডাক্ট • পাতা {productCurrentPage} /{" "}
                  {productTotalPages}
                </div>
              </div>
            </div>

            {/* Product Sales List */}
            {isLoadingProducts ? (
              <div className="empty">লোড হচ্ছে…</div>
            ) : productSales.length === 0 ? (
              <div className="empty">
                <p className="text-slate-900 font-medium mb-1">
                  কোনো প্রোডাক্ট পাওয়া যায়নি
                </p>
                <p>
                  {productSearchTerm
                    ? "খোঁজার সাথে মেলে এমন প্রোডাক্ট নেই।"
                    : "এখনো কোনো প্রোডাক্ট বিক্রি হয়নি।"}
                </p>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>প্রোডাক্ট</th>
                      <th className="cell-num">মোট বিক্রি</th>
                      <th className="cell-num">দাম</th>
                      <th className="cell-num">লাভ</th>
                      <th className="cell-num">স্টকে আছে</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSales.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div
                            className={`font-medium ${
                              product.product_id
                                ? "text-cyan-600 hover:text-cyan-700 cursor-pointer transition-colors"
                                : "text-slate-900"
                            }`}
                            onClick={() =>
                              product.product_id &&
                              handleProductClick(product.product_id)
                            }
                          >
                            {product.product_name}
                          </div>
                          {product.variant_display && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {product.variant_display}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-0.5">
                            {new Date(product.last_sold).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="cell-num cell-strong">
                          {product.total_quantity}
                        </td>
                        <td className="cell-num">
                          <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5">
                            <span className="num text-slate-500">
                              কেনা {formatCurrency(product.avg_buy_price)}
                            </span>
                            <span className="text-slate-300">→</span>
                            <span className="num money-pos">
                              বিক্রি {formatCurrency(product.avg_unit_price)}
                            </span>
                          </span>
                        </td>
                        <td className="cell-num money-pos">
                          {formatCurrency(product.total_profit)}
                        </td>
                        <td className="cell-num">
                          {product.available_stock !== undefined ? (
                            <span
                              className={`badge ${
                                (product.available_stock || 0) === 0
                                  ? "badge-danger"
                                  : (product.available_stock || 0) < 10
                                  ? "badge-warn"
                                  : "badge-success"
                              }`}
                            >
                              {product.available_stock}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Product Pagination Controls */}
            {productTotalPages > 1 && (
              <div className="plane-section">
                <Pagination
                  currentPage={productCurrentPage}
                  totalPages={productTotalPages}
                  totalItems={productTotalItems}
                  itemsPerPage={productPageSize}
                  onPageChange={handleProductPageChange}
                  onPageSizeChange={handleProductPageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Invoice Popup Modal */}
      {showInvoicePopup && selectedOrder && (
        <div className="modal-backdrop" onClick={closeInvoicePopup}>
          <div
            className="modal max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head print:hidden">
              <h2 className="modal-title">
                ইনভয়েস #{selectedOrder.id}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={printInvoice} className="btn btn-primary btn-sm">
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  প্রিন্ট
                </button>
                <button
                  onClick={closeInvoicePopup}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="বন্ধ করুন"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* Invoice Header */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center justify-start">
                  {userProfile?.profile?.store_logo &&
                  userProfile.profile.store_logo.trim() !== "" ? (
                    <img
                      src={ApiService.getImageUrl(
                        userProfile.profile.store_logo
                      )}
                      alt="স্টোরের লোগো"
                      className="h-12 max-w-48 object-contain object-left"
                      onError={(e) => {
                        console.log(
                          "Image failed to load:",
                          userProfile.profile?.store_logo
                        );
                        // Fallback to default logo if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback =
                          target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg items-center justify-center ${
                      userProfile?.profile?.store_logo &&
                      userProfile.profile.store_logo.trim() !== ""
                        ? "hidden"
                        : "flex"
                    }`}
                  >
                    <span className="text-slate-500 font-semibold text-xs">
                      লোগো
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(selectedOrder.sale_date).toLocaleDateString()}
                </p>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs text-slate-600">
                <div>
                  <div className="section-title">স্টোর</div>
                  <p className="font-medium text-slate-900">
                    {userProfile?.profile?.company || "আপনার স্টোরের নাম"}
                  </p>
                  <p>
                    {userProfile?.profile?.company_address ||
                      "স্টোরের ঠিকানা"}
                  </p>
                  <p>
                    ফোন:{" "}
                    {userProfile?.profile?.phone ||
                      userProfile?.profile?.contact_number ||
                      "—"}
                  </p>
                  <p>ইমেইল: {userProfile?.user?.email || "—"}</p>
                </div>

                <div>
                  <div className="section-title">কাস্টমার</div>
                  {selectedOrder.customer_name ? (
                    <>
                      <p className="font-medium text-slate-900">
                        {selectedOrder.customer_name}
                      </p>
                      {selectedOrder.customer_phone && (
                        <p>{selectedOrder.customer_phone}</p>
                      )}
                      {selectedOrder.customer_email && (
                        <p>{selectedOrder.customer_email}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500">সরাসরি আসা কাস্টমার</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="tbl-wrap mb-5">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>প্রোডাক্ট</th>
                      <th className="cell-num">পরিমাণ</th>
                      <th className="cell-num">দাম</th>
                      <th className="cell-num">মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Check if order has multiple items or is a single item order */}
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      // Multiple items - display all items
                      selectedOrder.items.map(
                        (item: OrderItem, index: number) => (
                          <tr key={index}>
                            <td>
                              <div className="cell-strong">
                                {item.product_name}
                              </div>
                              {item.variant_details && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {item.variant_details}
                                </div>
                              )}
                            </td>
                            <td className="cell-num">{item.quantity}</td>
                            <td className="cell-num">
                              {formatCurrency(item.unit_price || 0)}
                            </td>
                            <td className="cell-num cell-strong">
                              {formatCurrency(
                                item.total_price ||
                                  item.quantity * item.unit_price
                              )}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      // Single item order - display the main order data
                      <tr>
                        <td>
                          <div className="cell-strong">
                            {selectedOrder.product_name}
                          </div>
                          {selectedOrder.variant && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {selectedOrder.variant.color &&
                                `রং: ${selectedOrder.variant.color}`}
                              {selectedOrder.variant.size &&
                                ` | সাইজ: ${selectedOrder.variant.size}`}
                              {selectedOrder.variant.custom_variant &&
                                ` | ${selectedOrder.variant.custom_variant}`}
                            </div>
                          )}
                        </td>
                        <td className="cell-num">{selectedOrder.quantity}</td>
                        <td className="cell-num">
                          {formatCurrency(selectedOrder.unit_price || 0)}
                        </td>
                        <td className="cell-num cell-strong">
                          {formatCurrency(selectedOrder.total_amount || 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>সাবটোটাল</span>
                    <span className="num">
                      {formatCurrency(
                        selectedOrder.items && selectedOrder.items.length > 0
                          ? selectedOrder.items.reduce(
                              (sum, item) =>
                                sum +
                                (item.total_price ||
                                  item.quantity * item.unit_price),
                              0
                            )
                          : selectedOrder.total_amount || 0
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-900">
                    <span>মোট</span>
                    <span className="num text-cyan-600">
                      {formatCurrency(
                        selectedOrder.items && selectedOrder.items.length > 0
                          ? selectedOrder.items.reduce(
                              (sum, item) =>
                                sum +
                                (item.total_price ||
                                  item.quantity * item.unit_price),
                              0
                            )
                          : selectedOrder.total_amount || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Composer Modal */}
      {showSmsComposer && smsOrder && (
        <SmsComposer
          recipientName={smsOrder.customer_name}
          recipientPhone={smsOrder.customer_phone || ""}
          initialMessage={smsMessage}
          onSend={handleSendSmsFromComposer}
          onCancel={handleCancelSms}
          isLoading={isSendingSms === smsOrder.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && orderToDelete && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">অর্ডারটি ডিলিট করবেন?</h3>
              <button
                onClick={cancelDelete}
                className="text-slate-400 hover:text-slate-700"
                aria-label="বন্ধ করুন"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm text-slate-600 mb-2">
                সত্যিই ডিলিট করবেন? এই অর্ডারটা ডিলিট করলে:
              </p>
              <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-3">
                <li>অর্ডারটি আপনার খাতা থেকে একেবারে মুছে যাবে</li>
              </ul>
              <p className="text-sm text-slate-500">
                <strong>মনে রাখবেন:</strong> এটা আর ফেরানো যাবে না।
              </p>
            </div>

            <div className="modal-foot">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? (
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

      {/* Export Dialog */}
      {showExportDialog && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowExportDialog(false);
            setExportPreset("");
            setExportStartDate("");
            setExportEndDate("");
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">প্রোডাক্ট বিক্রির হিসাব নামান</h3>
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  setExportPreset("");
                  setExportStartDate("");
                  setExportEndDate("");
                }}
                className="text-slate-400 hover:text-slate-700"
                aria-label="বন্ধ করুন"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="modal-body space-y-3">
              {/* Preset Options */}
              <div>
                <label className="label">তারিখ বেছে নিন</label>
                <select
                  value={exportPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="select"
                >
                  <option value="">সব সময়</option>
                  <option value="today">আজকে</option>
                  <option value="yesterday">গতকাল</option>
                  <option value="this_week">এই সপ্তাহ</option>
                  <option value="last_week">গত সপ্তাহ</option>
                  <option value="this_month">এই মাস</option>
                  <option value="last_month">গত মাস</option>
                  <option value="custom">নিজে তারিখ দিন</option>
                </select>
              </div>

              {/* Custom Date Inputs */}
              {(exportPreset === "custom" || exportPreset === "") && (
                <>
                  <div>
                    <label className="label">শুরুর তারিখ (না দিলেও চলবে)</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">শেষের তারিখ (না দিলেও চলবে)</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="input"
                    />
                  </div>
                </>
              )}

              {/* Show selected date range for presets */}
              {exportPreset && exportPreset !== "custom" && exportStartDate && (
                <div className="text-sm text-slate-500 bg-slate-100 p-2 rounded-lg">
                  <strong>সিলেক্ট করা সময়:</strong> {exportStartDate} থেকে{" "}
                  {exportEndDate}
                </div>
              )}

              {exportPreset === "" && (
                <p className="text-sm text-slate-500">
                  তারিখ খালি রাখলে সব প্রোডাক্টের বিক্রির হিসাব নামবে।
                </p>
              )}
            </div>

            <div className="modal-foot">
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  setExportPreset("");
                  setExportStartDate("");
                  setExportEndDate("");
                }}
                className="btn btn-ghost"
                disabled={isExporting}
              >
                বাতিল
              </button>
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="btn btn-primary"
              >
                {isExporting ? (
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
                    ডাউনলোড হচ্ছে…
                  </>
                ) : (
                  "নামান"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
