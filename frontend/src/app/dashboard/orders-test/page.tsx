"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Order } from "@/types/order";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrdersTestPage() {
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [isNavigating, setIsNavigating] = useState(false);

  // Enhanced filtering states
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getProductSales();
      const ordersData = Array.isArray(response)
        ? response
        : response?.results || [];
      setOrders(ordersData);
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

  const handleOrderClick = (order: Order) => {
    // TODO: Navigate to order details page
    console.log("Order clicked:", order);
  };

  // Date filter helper functions
  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 86400000) };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 86400000);
        return { start: yesterday, end: today };
      case "this_week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: new Date(now.getTime() + 86400000) };
      case "last_week":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        return { start: lastWeekStart, end: lastWeekEnd };
      case "this_month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: new Date(now.getTime() + 86400000) };
      case "last_month":
        const lastMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: lastMonthStart, end: lastMonthEnd };
      case "this_year":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: new Date(now.getTime() + 86400000) };
      case "custom":
        if (customDateFrom && customDateTo) {
          return {
            start: new Date(customDateFrom),
            end: new Date(new Date(customDateTo).getTime() + 86400000),
          };
        }
        return null;
      default:
        return null;
    }
  };

  // Print functionality
  const handlePrint = () => {
    const printContent = document.getElementById("orders-table-print");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Orders Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
                .filters { margin-bottom: 15px; font-size: 14px; }
                @media print { 
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Orders Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="filters">
                <strong>Filters Applied:</strong><br>
                Date Filter: ${
                  dateFilter === "all"
                    ? "All Time"
                    : dateFilter.replace("_", " ").toUpperCase()
                }<br>
                ${productFilter ? `Product Filter: ${productFilter}<br>` : ""}
                ${
                  customerNameFilter
                    ? `Customer Filter: ${customerNameFilter}<br>`
                    : ""
                }
                Total Records: ${sortedOrders.length}
              </div>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Calculate statistics
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((sum, order) => {
    const amount = parseFloat(String(order.total_amount || 0));
    const validAmount = isNaN(amount) ? 0 : amount;
    return sum + validAmount;
  }, 0);
  const averageOrderValue =
    totalOrders > 0 && totalRevenue > 0 ? totalRevenue / totalOrders : 0;

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

  // Calculate today's revenue properly
  const todaysRevenue = ordersToday.reduce((sum, order) => {
    const amount = parseFloat(String(order.total_amount || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Filter and sort orders
  const filteredOrders = orders.filter((order) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      (order.product_name &&
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_name &&
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.includes(searchTerm));

    // Customer filter
    const matchesCustomer =
      filterCustomer === "all" ||
      (filterCustomer === "with_customer" && order.customer_name) ||
      (filterCustomer === "without_customer" && !order.customer_name);

    // Product name filter
    const matchesProduct =
      !productFilter ||
      (order.product_name &&
        order.product_name.toLowerCase().includes(productFilter.toLowerCase()));

    // Customer name filter
    const matchesCustomerName =
      !customerNameFilter ||
      (order.customer_name &&
        order.customer_name
          .toLowerCase()
          .includes(customerNameFilter.toLowerCase()));

    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        const orderDate = new Date(order.sale_date);
        matchesDate = orderDate >= dateRange.start && orderDate < dateRange.end;
      }
    }

    return (
      matchesSearch &&
      matchesCustomer &&
      matchesProduct &&
      matchesCustomerName &&
      matchesDate
    );
  });

  const sortedOrders = filteredOrders.sort((a, b) => {
    // Default sort by date (newest first)
    return new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime();
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Orders - Test Page
            </h1>
            <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium rounded-full">
              TESTING
            </span>
          </div>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Test environment for new features - View and manage customer orders
            and sales
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
                  {formatCurrency(totalRevenue || 0)}
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
                  {formatCurrency(averageOrderValue || 0)}
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
                  {formatCurrency(todaysRevenue || 0)} revenue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table/List */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="sm:p-4 p-2">
            {/* Header and filters */}
            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-xl font-bold text-slate-200">
                Order History
              </h3>

              {/* Controls */}
              <div className="flex flex-col gap-4">
                {/* First Row - Main Actions */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                  {/* Add Order Button */}
                  <button
                    onClick={handleAddOrder}
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
                        Add Order
                      </>
                    )}
                  </button>

                  {/* Print Button */}
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-shrink-0"
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
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print Report
                  </button>

                  {/* General Search */}
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Search orders, customers..."
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
                </div>

                {/* Second Row - Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">
                      Date Filter
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm w-full"
                    >
                      <option value="all" className="bg-slate-800">
                        All Time
                      </option>
                      <option value="today" className="bg-slate-800">
                        Today
                      </option>
                      <option value="yesterday" className="bg-slate-800">
                        Yesterday
                      </option>
                      <option value="this_week" className="bg-slate-800">
                        This Week
                      </option>
                      <option value="last_week" className="bg-slate-800">
                        Last Week
                      </option>
                      <option value="this_month" className="bg-slate-800">
                        This Month
                      </option>
                      <option value="last_month" className="bg-slate-800">
                        Last Month
                      </option>
                      <option value="this_year" className="bg-slate-800">
                        This Year
                      </option>
                      <option value="custom" className="bg-slate-800">
                        Custom Range
                      </option>
                    </select>
                  </div>

                  {/* Product Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">
                      Product Name
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by product..."
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Customer Name Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by customer..."
                      value={customerNameFilter}
                      onChange={(e) => setCustomerNameFilter(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Customer Type Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">
                      Customer Type
                    </label>
                    <select
                      value={filterCustomer}
                      onChange={(e) => setFilterCustomer(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm w-full"
                    >
                      <option value="all" className="bg-slate-800">
                        All Orders
                      </option>
                      <option value="with_customer" className="bg-slate-800">
                        With Customer
                      </option>
                      <option value="without_customer" className="bg-slate-800">
                        Without Customer
                      </option>
                    </select>
                  </div>
                </div>

                {/* Custom Date Range */}
                {dateFilter === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Active Filters Summary */}
                {(dateFilter !== "all" ||
                  productFilter ||
                  customerNameFilter ||
                  filterCustomer !== "all") && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
                    <span className="text-xs text-slate-400 font-medium">
                      Active Filters:
                    </span>
                    {dateFilter !== "all" && (
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
                        Date: {dateFilter.replace("_", " ")}
                      </span>
                    )}
                    {productFilter && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        Product: {productFilter}
                      </span>
                    )}
                    {customerNameFilter && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                        Customer: {customerNameFilter}
                      </span>
                    )}
                    {filterCustomer !== "all" && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                        Type: {filterCustomer.replace("_", " ")}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setDateFilter("all");
                        setProductFilter("");
                        setCustomerNameFilter("");
                        setFilterCustomer("all");
                        setCustomDateFrom("");
                        setCustomDateTo("");
                      }}
                      className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full hover:bg-red-500/30 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-4">
              {sortedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-4"
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
                  <h3 className="text-xl font-medium text-slate-300 mb-2">
                    No orders found
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {orders.length === 0
                      ? "Get started by creating your first order."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  <button
                    onClick={handleAddOrder}
                    className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Create First Order
                  </button>
                </div>
              ) : (
                sortedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-slate-100 font-medium line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">
                          {order?.product_name || "Unknown Product"}
                        </h4>
                        {order.variant && (
                          <p className="text-slate-400 text-sm mt-1">
                            {order.variant.color} - {order.variant.size}
                            {order.variant.custom_variant &&
                              ` - ${order.variant.custom_variant}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-400">
                          {formatCurrency(order.total_amount || 0)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(order.sale_date)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Customer</p>
                        {order.customer_name ? (
                          <div>
                            <p className="text-sm text-slate-100">
                              {order.customer_name}
                            </p>
                            {order.customer_phone && (
                              <p className="text-xs text-slate-400">
                                {order.customer_phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No customer info
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          Quantity & Price
                        </p>
                        <p className="text-sm font-medium text-slate-100">
                          {order.quantity} ×{" "}
                          {formatCurrency(order.unit_price || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">Notes</p>
                        <p className="text-sm text-slate-300">{order.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block">
              {sortedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-4"
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
                  <h3 className="text-xl font-medium text-slate-300 mb-2">
                    No orders found
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {orders.length === 0
                      ? "Get started by creating your first order."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  <button
                    onClick={handleAddOrder}
                    className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Create First Order
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto" id="orders-table-print">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Product
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Quantity
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Unit Price
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Total
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors cursor-pointer"
                          onClick={() => handleOrderClick(order)}
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {order?.product_name || "Unknown Product"}
                              </p>
                              {order.variant && (
                                <p className="text-xs text-slate-400">
                                  {order.variant.color} - {order.variant.size}
                                  {order.variant.custom_variant &&
                                    ` - ${order.variant.custom_variant}`}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {order.customer_name ? (
                              <div>
                                <p className="text-sm text-slate-100">
                                  {order.customer_name}
                                </p>
                                {order.customer_phone && (
                                  <p className="text-xs text-slate-400">
                                    {order.customer_phone}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">
                                No customer info
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-100">
                            {order.quantity}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-100">
                            {formatCurrency(order.unit_price || 0)}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-cyan-400">
                            {formatCurrency(order.total_amount || 0)}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-400">
                            {formatDate(order.sale_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {(dateFilter !== "all" ||
          productFilter ||
          customerNameFilter ||
          filterCustomer !== "all" ||
          searchTerm) && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-200 mb-2">
                  Filter Results
                </h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>
                    Showing {sortedOrders.length} of {orders.length} total
                    orders
                  </p>
                  {sortedOrders.length > 0 && (
                    <>
                      <p>
                        Total Revenue:{" "}
                        <span className="text-green-400 font-medium">
                          {formatCurrency(
                            sortedOrders.reduce((sum, order) => {
                              const amount = parseFloat(
                                String(order.total_amount || 0)
                              );
                              return sum + (isNaN(amount) ? 0 : amount);
                            }, 0)
                          )}
                        </span>
                      </p>
                      <p>
                        Average Order Value:{" "}
                        <span className="text-blue-400 font-medium">
                          {formatCurrency(
                            sortedOrders.length > 0
                              ? sortedOrders.reduce((sum, order) => {
                                  const amount = parseFloat(
                                    String(order.total_amount || 0)
                                  );
                                  return sum + (isNaN(amount) ? 0 : amount);
                                }, 0) / sortedOrders.length
                              : 0
                          )}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>
              {sortedOrders.length > 0 && (
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg flex items-center gap-2"
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Filtered Results
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
