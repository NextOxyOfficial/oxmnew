"use client";

import FilterDropdown from "@/components/dashboard/FilterDropdown";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useBankingOverview } from "@/hooks/useBankingOverview";
import { useCustomerStats } from "@/hooks/useCustomerStats";
import { useInventoryStats } from "@/hooks/useInventoryStats";
import { useLowStock } from "@/hooks/useLowStock";
import { useRecentActivitiesStats } from "@/hooks/useRecentActivitiesStats";
import { useRecentSales } from "@/hooks/useRecentSales";
import { useRecentSms } from "@/hooks/useRecentSms";
import { useSmsCredits } from "@/hooks/useSmsCredits";
import { customersAPI } from "@/lib/api/customers";
import {
  formatDateTime,
  generateOrderId,
  getOrderStatus,
} from "@/lib/utils/salesUtils";
import {
  formatVariantName,
  getLowestStockVariant,
  getStockStatus,
  getStockStatusColor,
  getTotalStock,
} from "@/lib/utils/stockUtils";
import { X, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Wallet, MessageSquare, Plus, ArrowRight, RefreshCw, Calendar, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("today");
  const [currentFilterLabel, setCurrentFilterLabel] = useState("Today");

  // Use the custom hook for recent sales
  const {
    recentSales,
    isLoadingSales,
    salesError,
    refetchSales,
    fetchSalesWithFilter,
  } = useRecentSales(5);

  // Use the custom hook for low stock alerts
  const {
    lowStockProducts,
    outOfStockProducts,
    isLoadingStock,
    stockError,
    refetchStock,
  } = useLowStock(10);

  // Use the custom hook for inventory statistics
  const {
    stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useInventoryStats();

  // Use the custom hook for recent activities statistics
  const recentActivitiesStats = useRecentActivitiesStats(recentSales);

  // Use the custom hook for customer statistics
  const {
    stats: customerStats,
    isLoading: isLoadingCustomerStats,
    error: customerStatsError,
    refetch: refetchCustomerStats,
  } = useCustomerStats();

  // Use the custom hook for banking overview
  const {
    overview: bankingOverview,
    isLoading: isLoadingBanking,
    error: bankingError,
    refetch: refetchBanking,
  } = useBankingOverview();

  // Use the custom hook for SMS credits
  const {
    credits: smsCredits,
    isLoading: isLoadingSmsCredits,
    error: smsCreditsError,
    refetch: refetchSmsCredits,
  } = useSmsCredits();

  // Use the custom hook for recent SMS
  const {
    recentSms,
    isLoadingRecentSms,
    recentSmsError,
    refetchRecentSms,
  } = useRecentSms();

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active" as const,
    notes: "",
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  // Apply initial filter on mount
  useEffect(() => {
    console.log("Dashboard: Applying initial filter:", currentFilter);
    fetchSalesWithFilter({ dateFilter: currentFilter });
  }, []); // Empty dependency array - only run once on mount

  // Filter handling functions
  const handleFilterChange = (filter: string, label: string) => {
    console.log("Dashboard: Filter changing to:", filter, label);
    setCurrentFilter(filter);
    setCurrentFilterLabel(label);

    // Apply the filter immediately
    console.log("Calling fetchSalesWithFilter with:", { dateFilter: filter });
    fetchSalesWithFilter({ dateFilter: filter });
  };

  const handleCustomDateRange = () => {
    setShowDateRangePicker(true);
  };

  const handleCustomDateRangeApply = () => {
    const startDate = dateRange.startDate.toISOString().split("T")[0];
    const endDate = dateRange.endDate.toISOString().split("T")[0];

    fetchSalesWithFilter({
      startDate,
      endDate,
    });

    setCurrentFilter("custom");
    setCurrentFilterLabel(
      `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
    );
    setSortDropdownOpen(false);
    setShowDateRangePicker(false);
  };

  // Quick Actions handlers
  const handleNewOrder = () => {
    setIsNavigating(true);
    router.push("/dashboard/orders/add");
  };

  const handleAddProduct = () => {
    setIsNavigating(true);
    router.push("/dashboard/products/add");
  };

  const handleNewCustomer = () => {
    setShowNewCustomerModal(true);
  };

  const handleDueBook = () => {
    setIsNavigating(true);
    router.push("/dashboard/duebook");
  };

  const handleBuySubscription = () => {
    setIsNavigating(true);
    router.push("/dashboard/subscriptions");
  };

  const handleSendSms = () => {
    setIsNavigating(true);
    router.push("/dashboard/sms");
  };

  const handleViewInvoice = (saleId: number) => {
    // Open invoice in new tab using standalone invoice page (without dashboard layout)
    const invoiceUrl = `/invoice/${saleId}`;
    window.open(invoiceUrl, '_blank');
  };

  const handleCreateMainAccount = async () => {
    try {
      // Create main account via API using the banking API
      const response = await fetch("/api/banking/accounts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken") || ""}`,
        },
        body: JSON.stringify({
          name: "Main",
          balance: 0.0,
        }),
      });

      if (response.ok) {
        // Refresh banking data
        refetchBanking();
        alert("Main account created successfully!");
      } else {
        const errorData = await response.json();
        console.error("Failed to create account:", errorData);
        alert("Failed to create account. Please try again.");
      }
    } catch (error) {
      console.error("Error creating main account:", error);
      alert("Failed to create account. Please try again.");
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      alert("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    try {
      setIsCreatingCustomer(true);
      await customersAPI.createCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        status: newCustomer.status,
        notes: newCustomer.notes,
      });
      alert("Customer created successfully!");
      setShowNewCustomerModal(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "active" as const,
        notes: "",
      });
    } catch (err) {
      console.error("Error creating customer:", err);
      alert("Failed to create customer. Please try again.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCloseCustomerModal = () => {
    setShowNewCustomerModal(false);
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "active" as const,
      notes: "",
    });
  };

  useEffect(() => {
    // Add click outside listener to close dropdown and date picker
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (sortDropdownOpen && !target.closest("[data-dropdown-toggle]")) {
        setSortDropdownOpen(false);
      }
      if (
        showDateRangePicker &&
        !target.closest(".calendar-container") &&
        !target.closest("[data-dropdown-toggle]")
      ) {
        setShowDateRangePicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortDropdownOpen, showDateRangePicker]);

  // Apply initial filter when component mounts
  useEffect(() => {
    // Apply the default filter after the hook has initialized
    const timer = setTimeout(() => {
      console.log("Dashboard: Applying initial filter:", currentFilter);
      fetchSalesWithFilter({ dateFilter: currentFilter });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="py-4 px-1 sm:px-4 lg:px-6 sm:py-6 lg:py-8 space-y-4">
      {/* Welcome Message */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-white">Welcome to OxyManager 👋</h1>
          <p className="text-xs text-slate-500 mt-0.5">Here&apos;s your business overview for today</p>
        </div>
        <button
          onClick={handleNewOrder}
          disabled={isNavigating}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-semibold rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Buy Price Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-red-500/30 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-all">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium uppercase">Buy Price</span>
            {isLoadingStats && <div className="animate-spin rounded-full h-3 w-3 border border-red-400/30 border-t-red-400 ml-auto"></div>}
          </div>
          <p className="text-base sm:text-lg font-bold text-white truncate">
            {isLoadingStats ? "---" : statsError ? <span className="text-red-400 text-xs">Error</span> : formatCurrency(stats?.total_buy_value || 0)}
          </p>
        </div>

        {/* Sell Price Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-all">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium uppercase">Sell Price</span>
            {isLoadingStats && <div className="animate-spin rounded-full h-3 w-3 border border-cyan-400/30 border-t-cyan-400 ml-auto"></div>}
          </div>
          <p className="text-base sm:text-lg font-bold text-white truncate">
            {isLoadingStats ? "---" : statsError ? <span className="text-red-400 text-xs">Error</span> : formatCurrency(stats?.total_sell_value || 0)}
          </p>
        </div>

        {/* Estimated Profit Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium uppercase">Profit</span>
            <span className="text-[10px] text-emerald-400 ml-auto">
              {isLoadingStats ? "" : statsError ? "" : `${((((stats?.total_sell_value || 0) - (stats?.total_buy_value || 0)) / (stats?.total_sell_value || 1)) * 100).toFixed(0)}%`}
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-400 truncate">
            {isLoadingStats ? "---" : statsError ? <span className="text-red-400 text-xs">Error</span> : formatCurrency((stats?.total_sell_value || 0) - (stats?.total_buy_value || 0))}
          </p>
        </div>

        {/* Customers Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium uppercase">Customers</span>
            <span className="text-[10px] text-purple-400 ml-auto">
              {isLoadingCustomerStats ? "" : customerStatsError ? "" : `${customerStats?.active_customers || 0} active`}
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-white">
            {isLoadingCustomerStats ? "---" : customerStatsError ? <span className="text-red-400 text-xs">Error</span> : customerStats?.total_customers || 0}
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div className="xl:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
          {/* Section Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Sales</h3>
                  <p className="text-xs text-slate-500">Filter: {currentFilterLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <FilterDropdown
                  currentFilter={currentFilter}
                  currentFilterLabel={currentFilterLabel}
                  onFilterChange={handleFilterChange}
                  onCustomDateRange={handleCustomDateRange}
                  isMobile={true}
                />
                <button
                  onClick={refetchSales}
                  disabled={isLoadingSales}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSales ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Period Stats - Mini Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Buy Price</p>
                <p className="text-sm sm:text-base font-bold text-white">
                  {isLoadingSales ? "---" : formatCurrency(recentActivitiesStats.totalBuyPrice)}
                </p>
                <p className="text-xs text-slate-500">{recentActivitiesStats.salesCount} sales</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Sell Price</p>
                <p className="text-sm sm:text-base font-bold text-cyan-400">
                  {isLoadingSales ? "---" : formatCurrency(recentActivitiesStats.totalSellPrice)}
                </p>
                <p className="text-xs text-slate-500">Revenue</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Profit</p>
                <p className="text-sm sm:text-base font-bold text-emerald-400">
                  {isLoadingSales ? "---" : formatCurrency(recentActivitiesStats.totalProfit)}
                </p>
                <p className="text-xs text-slate-500">
                  {isLoadingSales ? "---" : `${recentActivitiesStats.profitMargin.toFixed(1)}%`}
                </p>
              </div>
            </div>

            {/* Recent Order Activities */}
            <div>
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
                {isLoadingSales ? (
                  // Loading state
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/30"></div>
                    <span className="ml-2 text-sm text-gray-400">
                      Loading recent sales...
                    </span>
                  </div>
                ) : salesError ? (
                  // Error state
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="text-red-400 mb-2">⚠️</div>
                      <p className="text-sm text-red-400">{salesError}</p>
                      <button
                        onClick={refetchSales}
                        className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : recentSales.length === 0 ? (
                  // Empty state
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">📋</div>
                      <p className="text-sm text-gray-400">
                        No recent sales found
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Sales will appear here once you make some
                      </p>
                    </div>
                  </div>
                ) : (
                  recentSales.map((sale) => {
                    const orderStatus = getOrderStatus(sale);
                    const { date, time } = formatDateTime(sale.sale_date);
                    const orderId = generateOrderId(sale.id);

                    return (
                      <div
                        key={sale.id}
                        className="bg-white/5 rounded-lg p-3 hover:bg-white/3 transition-colors"
                      >
                        {/* First row - always visible */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 ${
                                orderStatus === "Completed"
                                  ? "bg-green-400"
                                  : "bg-yellow-400"
                              } rounded-full mr-2`}
                              title={
                                orderStatus === "Completed"
                                  ? "Sale Completed"
                                  : "Sale Draft"
                              }
                            ></div>
                            <span className="text-sm font-medium text-white mr-2">
                              Order {orderId}
                            </span>
                            <span
                              className={`mr-2 ${
                                orderStatus === "Draft"
                                  ? "text-yellow-200 bg-yellow-400/10"
                                  : "text-green-200 bg-green-400/10"
                              } text-xs font-medium px-1.5 py-0.5 rounded`}
                            >
                              {orderStatus}
                            </span>
                            <span className="hidden sm:inline text-sm text-gray-300">
                              {sale.customer_name || "Walk-in Customer"}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <span className="hidden sm:inline text-sm font-bold text-white">
                              {formatCurrency(sale.total_amount)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(sale.id);
                              }}
                              disabled={isNavigating}
                              className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-white/3 transition-all ml-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title="View Invoice"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Second row - Mobile only for customer name and amount */}
                        <div className="sm:hidden flex justify-between items-center mt-2 mb-1">
                          <span className="text-sm text-gray-300">
                            {sale.customer_name || "Walk-in Customer"}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(sale.total_amount)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between mt-2 bg-black/20 rounded-lg p-1.5">
                          <div className="flex items-center space-x-3 px-1.5">
                            {/* Show order items information */}
                            {sale.items && sale.items.length > 1 ? (
                              // Multiple items - show items count and total info
                              <>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    Items
                                  </span>
                                  <span className="text-xs font-medium text-purple-400 ml-1.5">
                                    {sale.items.length} items
                                  </span>
                                </div>
                                <div className="h-3 w-px bg-gray-600"></div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    Total Qty
                                  </span>
                                  <span className="text-xs font-medium text-gray-300 ml-1.5">
                                    {sale.items?.reduce((total, item) => total + item.quantity, 0) || sale.quantity}
                                  </span>
                                </div>
                                <div className="h-3 w-px bg-gray-600"></div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    Profit
                                  </span>
                                  <span
                                    className={`text-xs font-medium ml-1.5 ${
                                      (sale.gross_profit || sale.profit || 0) >=
                                      0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {formatCurrency(
                                      sale.gross_profit || sale.profit || 0
                                    )}
                                  </span>
                                </div>
                              </>
                            ) : (
                              // Single item - show unit price, quantity, and profit
                              <>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    Unit Price
                                  </span>
                                  <span className="text-xs font-medium text-blue-400 ml-1.5">
                                    {formatCurrency(sale.unit_price)}
                                  </span>
                                </div>
                                <div className="h-3 w-px bg-gray-600"></div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    Qty
                                  </span>
                                  <span className="text-xs font-medium text-gray-300 ml-1.5">
                                    {sale.quantity}
                                  </span>
                                </div>
                                <div className="h-3 w-px bg-gray-600"></div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    Profit
                                  </span>
                                  <span
                                    className={`text-xs font-medium ml-1.5 ${
                                      (sale.gross_profit || sale.profit || 0) >=
                                      0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {formatCurrency(
                                      sale.gross_profit || sale.profit || 0
                                    )}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 px-1.5 mt-1 sm:mt-0">
                            {date}, {time}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <button
                className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/50 hover:to-purple-500/50 text-white rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
                onClick={() => {
                  setIsNavigating(true);
                  router.push("/dashboard/sales");
                }}
                disabled={isNavigating}
              >
                View All Sales
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Actions & SMS */}
        <div className="space-y-4">
          {/* SMS Balance Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">SMS Credits</h3>
                    <p className="text-xl font-bold text-blue-400">
                      {isLoadingSmsCredits ? "---" : smsCreditsError ? "Error" : smsCredits.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBuySubscription}
                  disabled={isNavigating}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-all"
                >
                  Buy More
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {isLoadingRecentSms ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400/30 border-t-blue-400"></div>
                </div>
              ) : recentSms ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Last SMS sent:</p>
                  <p className="text-sm text-white font-medium truncate">{recentSms.recipient}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">&ldquo;{recentSms.message.substring(0, 60)}...&rdquo;</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${recentSms.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {recentSms.status}
                    </span>
                    <span className="text-xs text-slate-500">{recentSms.sms_count} SMS</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">No SMS sent yet</p>
              )}
              
              <button 
                onClick={handleSendSms}
                disabled={isNavigating}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-900 font-semibold rounded-xl transition-all text-sm"
              >
                Send SMS
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleNewOrder}
                disabled={isNavigating}
                className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 hover:bg-emerald-500/10 border border-slate-700/50 hover:border-emerald-500/30 rounded-xl transition-all group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-slate-300 font-medium">New Sale</span>
              </button>
              <button
                onClick={handleAddProduct}
                disabled={isNavigating}
                className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 hover:bg-blue-500/10 border border-slate-700/50 hover:border-blue-500/30 rounded-xl transition-all group"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs text-slate-300 font-medium">Add Product</span>
              </button>
              <button
                onClick={handleNewCustomer}
                className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 hover:bg-purple-500/10 border border-slate-700/50 hover:border-purple-500/30 rounded-xl transition-all group"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs text-slate-300 font-medium">New Customer</span>
              </button>
              <button
                onClick={handleDueBook}
                disabled={isNavigating}
                className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 hover:bg-orange-500/10 border border-slate-700/50 hover:border-orange-500/30 rounded-xl transition-all group"
              >
                <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-all">
                  <Wallet className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs text-slate-300 font-medium">Due Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Banking & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Low Stock Alert */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Low Stock Alert</h3>
                  <p className="text-xs text-slate-500">{outOfStockProducts.length + lowStockProducts.length} items need attention</p>
                </div>
              </div>
              <button
                onClick={refetchStock}
                disabled={isLoadingStock}
                className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStock ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">

          <div className="space-y-2 overflow-y-auto max-h-80 scrollbar-hide">
            {isLoadingStock ? (
              // Loading state
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/30"></div>
                <span className="ml-2 text-sm text-gray-400">
                  Loading stock alerts...
                </span>
              </div>
            ) : stockError ? (
              // Error state
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-red-400 mb-2">⚠️</div>
                  <p className="text-sm text-red-400">{stockError}</p>
                  <button
                    onClick={refetchStock}
                    className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : outOfStockProducts.length === 0 &&
              lowStockProducts.length === 0 ? (
              // Empty state
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-green-400 mb-2">✅</div>
                  <p className="text-sm text-green-400">
                    All products have sufficient stock
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Great job managing your inventory!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Out of Stock Products */}
                {outOfStockProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const totalStock = getTotalStock(product);
                  const statusColor = getStockStatusColor(stockStatus);
                  const lowestVariant = getLowestStockVariant(product);

                  return (
                    <div
                      key={`out-${product.id}`}
                      className="bg-red-500/10 border border-red-400/30 rounded-lg p-3"
                    >
                      <div className="flex items-center mb-2">
                        <div
                          className={`w-2 h-2 bg-${statusColor}-500 rounded-full mr-2`}
                        ></div>
                        <button
                          className="text-sm font-medium text-white hover:text-blue-300 transition-colors cursor-pointer"
                          onClick={() => {
                            setIsNavigating(true);
                            router.push(
                              `/dashboard/products?search=${encodeURIComponent(
                                product.name
                              )}`
                            );
                          }}
                        >
                          {product.name}
                          {lowestVariant &&
                            ` - ${formatVariantName(lowestVariant)}`}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center mt-2 bg-black/20 rounded-lg p-1.5">
                        <div className="flex items-center space-x-3 px-1.5">
                          <div>
                            <span className="text-xs text-gray-400">
                              Stock:
                            </span>
                            <span
                              className={`text-xs font-medium text-${statusColor}-400 ml-1`}
                            >
                              {totalStock}
                            </span>
                          </div>
                          <div className="h-3 w-px bg-gray-600"></div>
                          <div>
                            <span className="text-xs text-gray-400">
                              Location:
                            </span>
                            <span className="text-xs font-medium text-gray-300 ml-1">
                              {product.location || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Low Stock Products */}
                {lowStockProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const totalStock = getTotalStock(product);
                  const statusColor = getStockStatusColor(stockStatus);
                  const lowestVariant = getLowestStockVariant(product);

                  return (
                    <div
                      key={`low-${product.id}`}
                      className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3"
                    >
                      <div className="flex items-center mb-2">
                        <div
                          className={`w-2 h-2 bg-${statusColor}-500 rounded-full mr-2`}
                        ></div>
                        <button
                          className="text-sm font-medium text-white hover:text-blue-300 transition-colors cursor-pointer"
                          onClick={() => {
                            setIsNavigating(true);
                            router.push(
                              `/dashboard/products?search=${encodeURIComponent(
                                product.name
                              )}`
                            );
                          }}
                        >
                          {product.name}
                          {lowestVariant &&
                            ` - ${formatVariantName(lowestVariant)}`}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center mt-2 bg-black/20 rounded-lg p-1.5">
                        <div className="flex items-center space-x-3 px-1.5">
                          <div>
                            <span className="text-xs text-gray-400">
                              Stock:
                            </span>
                            <span
                              className={`text-xs font-medium text-${statusColor}-400 ml-1`}
                            >
                              {totalStock}
                            </span>
                          </div>
                          <div className="h-3 w-px bg-gray-600"></div>
                          <div>
                            <span className="text-xs text-gray-400">
                              Location:
                            </span>
                            <span className="text-xs font-medium text-gray-300 ml-1">
                              {product.location || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <button
            className="w-full mt-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white rounded-xl transition-all text-sm font-medium"
            onClick={() => {
              setIsNavigating(true);
              router.push("/dashboard/products");
            }}
            disabled={isNavigating}
          >
            View Inventory Report
          </button>
          </div>
        </div>

        {/* Banking Overview */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Banking Overview</h3>
                  <p className="text-xs text-slate-500">
                    {isLoadingBanking ? "Loading..." : bankingError ? "Error" : `${bankingOverview?.total_accounts || 0} accounts`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">
                    {isLoadingBanking ? "---" : bankingError ? "Error" : formatCurrency(bankingOverview?.total_balance || 0)}
                  </p>
                  <p className="text-xs text-emerald-400/70">
                    {isLoadingBanking ? "---" : bankingError ? "" : `+${bankingOverview?.monthly_change_percentage || 0}% this month`}
                  </p>
                </div>
                <button
                  onClick={refetchBanking}
                  disabled={isLoadingBanking}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBanking ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">

          <div className="grid grid-cols-2 gap-3">
            {isLoadingBanking ? (
              // Loading state
              [...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 animate-pulse"
                >
                  <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-slate-700 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-slate-700 rounded w-16"></div>
                </div>
              ))
            ) : bankingError ? (
              // Error state
              <div className="col-span-2 flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-sm text-red-400 mb-2">{bankingError}</p>
                  <button
                    onClick={refetchBanking}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : bankingOverview?.accounts.length === 0 ? (
              // Empty state
              <div className="col-span-2 flex items-center justify-center py-8">
                <div className="text-center">
                  <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 mb-1">No bank accounts found</p>
                  <p className="text-xs text-slate-500 mb-4">Create your first account to get started</p>
                  <button
                    onClick={handleCreateMainAccount}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 text-sm font-semibold rounded-xl transition-all"
                  >
                    Create Main Account
                  </button>
                </div>
              </div>
            ) : (
              bankingOverview?.accounts.map((account, index) => {
                const colors = [
                  { bg: "emerald", text: "emerald" },
                  { bg: "blue", text: "blue" },
                  { bg: "purple", text: "purple" },
                  { bg: "orange", text: "orange" }
                ];
                const color = colors[index % colors.length];

                return (
                  <div
                    key={account.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-xs font-medium">{account.name}</p>
                      <div className={`w-2 h-2 bg-${color.bg}-400 rounded-full`}></div>
                    </div>
                    <p className="text-white font-bold text-lg">{formatCurrency(account.balance)}</p>
                  </div>
                );
              })
            )}
          </div>

          <button
            className="w-full mt-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white rounded-xl transition-all text-sm font-medium"
            onClick={() => {
              setIsNavigating(true);
              router.push("/dashboard/banking");
            }}
            disabled={isNavigating}
          >
            View Banking Details
          </button>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Create New Customer
                </h2>
                <button
                  onClick={handleCloseCustomerModal}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                    placeholder="Enter customer address (optional)"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={handleCloseCustomerModal}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={
                    isCreatingCustomer ||
                    !newCustomer.name ||
                    !newCustomer.email ||
                    !newCustomer.phone
                  }
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {isCreatingCustomer ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
