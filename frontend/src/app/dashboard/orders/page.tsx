"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import { Order } from "@/types/order";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

export default function OrdersPage() {
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterBy, setFilterBy] = useState("date");
  const [isNavigating, setIsNavigating] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getProductSales();
      setOrders(Array.isArray(response) ? response : response?.results || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrder = () => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push("/dashboard/orders/add");
    }, 300);
  };

  // Get context-aware search placeholder
  const getSearchPlaceholder = () => {
    switch (filterBy) {
      case "product":
        return "Search product names...";
      case "customer":
        return "Search customer names and phones...";
      case "today":
        return "Search today's orders by product or customer...";
      default:
        return "Search orders, customers, products...";
    }
  };

  const handleOrderClick = (order: Order) => {
    // TODO: Navigate to order details page
    console.log("Order clicked:", order);
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Today's orders
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const ordersToday = orders.filter(
    (order) => new Date(order.sale_date) >= todayStart
  );

  // Filter and sort orders
  const filteredOrders = orders.filter((order) => {
    // Search logic based on filter selection
    let matchesSearch = false;

    if (filterBy === "product") {
      // Only search in product names
      matchesSearch =
        !searchTerm ||
        Boolean(
          order.product_name &&
            order.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    } else if (filterBy === "customer") {
      // Only search in customer names and phones
      matchesSearch =
        !searchTerm ||
        Boolean(
          (order.customer_name &&
            order.customer_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
            (order.customer_phone && order.customer_phone.includes(searchTerm))
        );
    } else {
      // Default search in all fields (for "today", "date", and amount/quantity filters)
      matchesSearch =
        !searchTerm ||
        Boolean(
          (order.product_name &&
            order.product_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
            (order.customer_name &&
              order.customer_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (order.customer_phone && order.customer_phone.includes(searchTerm))
        );
    }

    const matchesCustomer =
      filterCustomer === "all" ||
      (filterCustomer === "with_customer" && order.customer_name) ||
      (filterCustomer === "without_customer" && !order.customer_name);

    // Date filtering logic
    let matchesDateRange = true;

    if (filterBy === "today") {
      // Show only today's orders
      const orderDate = new Date(order.sale_date);
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      );
      matchesDateRange = orderDate >= todayStart && orderDate <= todayEnd;
    } else {
      // Use date range picker (ignore if "today" is selected)
      const orderDate = new Date(order.sale_date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + "T23:59:59") : null;

      matchesDateRange =
        (!fromDate || orderDate >= fromDate) &&
        (!toDate || orderDate <= toDate);
    }

    return matchesSearch && matchesCustomer && matchesDateRange;
  });

  const sortedOrders = filteredOrders.sort((a, b) => {
    switch (filterBy) {
      case "today":
      case "date":
        return (
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
        );
      case "product":
        return (a.product_name || "").localeCompare(b.product_name || "");
      case "customer":
        return (a.customer_name || "").localeCompare(b.customer_name || "");
      case "amount-high":
        return b.total_amount - a.total_amount;
      case "amount-low":
        return a.total_amount - b.total_amount;
      case "quantity-high":
        return b.quantity - a.quantity;
      case "quantity-low":
        return a.quantity - b.quantity;
      default:
        return 0;
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
              Failed to Load Orders
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
            Orders
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            View and manage customer orders and sales
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Orders */}
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-300 font-medium">
                  Total Orders
                </p>
                <p className="text-base font-bold text-cyan-400">
                  {totalOrders}
                </p>
                <p className="text-xs text-cyan-500 opacity-80">
                  All completed orders
                </p>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">
                  Total Revenue
                </p>
                <p className="text-base font-bold text-green-400">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-green-500 opacity-80">
                  Total sales income
                </p>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/8 border border-blue-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-blue-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-300 font-medium">Avg. Order</p>
                <p className="text-base font-bold text-blue-400">
                  {formatCurrency(averageOrderValue)}
                </p>
                <p className="text-xs text-blue-500 opacity-80">
                  Per order value
                </p>
              </div>
            </div>
          </div>

          {/* Today's Orders */}
          <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/8 border border-yellow-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-yellow-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-yellow-300 font-medium">Today</p>
                <p className="text-base font-bold text-yellow-400">
                  {ordersToday.length}
                </p>
                <p className="text-xs text-yellow-500 opacity-80">
                  {formatCurrency(
                    ordersToday.reduce(
                      (sum, order) => sum + order.total_amount,
                      0
                    )
                  )}{" "}
                  revenue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table/List */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Order History
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {filteredOrders.length} of {orders.length} orders
                </p>
              </div>

              <button
                onClick={handleAddOrder}
                disabled={isNavigating}
                className={`inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm ${
                  isNavigating ? "cursor-not-allowed" : ""
                }`}
              >
                {isNavigating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4"
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
                    Add Order
                  </>
                )}
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-4 mb-6">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
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
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Date Range */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Date Range:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={filterBy === "today"}
                      className="block w-full sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      to
                    </span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={filterBy === "today"}
                      className="block w-full sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {(dateFrom || dateTo) && filterBy !== "today" && (
                      <button
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 text-xs font-medium rounded text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                      >
                        <svg
                          className="h-3 w-3 mr-1"
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
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Customer:
                  </label>
                  <select
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    className="block w-full sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  >
                    <option value="all">All Orders</option>
                    <option value="with_customer">With Customer</option>
                    <option value="without_customer">Without Customer</option>
                  </select>
                </div>

                {/* Filter By */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Filter by:
                  </label>
                  <select
                    value={filterBy}
                    onChange={(e) => {
                      const newFilterBy = e.target.value;
                      setFilterBy(newFilterBy);
                      // Clear date range when switching to "today"
                      if (newFilterBy === "today") {
                        setDateFrom("");
                        setDateTo("");
                      }
                    }}
                    className="block w-full sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  >
                    <option value="date">Date (Newest)</option>
                    <option value="today">Date (Today)</option>
                    <option value="product">Product Name</option>
                    <option value="customer">Customer Name</option>
                    <option value="amount-high">Amount: High to Low</option>
                    <option value="amount-low">Amount: Low to High</option>
                    <option value="quantity-high">Quantity: High to Low</option>
                    <option value="quantity-low">Quantity: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Filter Status/Help Text */}
              {filterBy === "today" && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Showing today&apos;s orders only. Search works for product
                      and customer names. Date range is disabled.
                    </span>
                  </div>
                </div>
              )}
              {filterBy === "product" && searchTerm && (
                <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 flex-shrink-0"
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
                    <span>
                      Searching in product names only for &ldquo;{searchTerm}
                      &rdquo;
                    </span>
                  </div>
                </div>
              )}
              {filterBy === "customer" && searchTerm && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>
                      Searching in customer names and phones only for &ldquo;
                      {searchTerm}&rdquo;
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {sortedOrders.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
                  No orders found
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {orders.length === 0
                    ? "Get started by creating your first order."
                    : "Try adjusting your search or filter criteria."}
                </p>
                {orders.length === 0 && (
                  <div className="mt-6">
                    <button
                      onClick={handleAddOrder}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                      <svg
                        className="-ml-1 mr-2 h-4 w-4"
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
                      Create First Order
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-4">
                  {sortedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4 hover:shadow-md dark:hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {order?.product_name || "Unknown Product"}
                          </h4>
                          {order.variant && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {order.variant_display}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(order.sale_date)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Customer
                          </p>
                          {order.customer_name ? (
                            <div>
                              <p className="text-slate-900 dark:text-slate-100 font-medium">
                                {order.customer_name}
                              </p>
                              {order.customer_phone && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {order.customer_phone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-400 dark:text-slate-500 italic">
                              No customer info
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Quantity & Price
                          </p>
                          <p className="text-slate-900 dark:text-slate-100 font-medium">
                            {order.quantity} ×{" "}
                            {formatCurrency(order.unit_price)}
                          </p>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Notes
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {order.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-slate-700 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            Customer
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            Unit Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            Total
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-150"
                            onClick={() => handleOrderClick(order)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {order?.product_name || "Unknown Product"}
                                </div>
                                {order.variant && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {order.variant_display}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {order.customer_name ? (
                                <div>
                                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {order.customer_name}
                                  </div>
                                  {order.customer_phone && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {order.customer_phone}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400 dark:text-slate-500 italic">
                                  No customer info
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                              {order.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                              {formatCurrency(order.unit_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                              {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(order.sale_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
