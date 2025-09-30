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
import { X } from "lucide-react";
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
    // Open invoice in new tab
    const invoiceUrl = `/dashboard/orders/invoice/${saleId}`;
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
    <div className="py-4 px-1 sm:p-6 lg:p-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Buy Price Card */}
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
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-300 font-medium">Buy Price</p>
                <div className="flex items-center space-x-1">
                  {isLoadingStats && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-400/30"></div>
                  )}
                  <button
                    onClick={refetchStats}
                    disabled={isLoadingStats}
                    className="p-1 rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Refresh stats"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 text-red-400 hover:text-red-300 ${
                        isLoadingStats ? "animate-spin" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-base font-bold text-red-400">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-400 text-sm">Error</span>
                ) : (
                  formatCurrency(stats?.total_buy_value || 0)
                )}
              </p>
              <p className="text-xs text-red-500 opacity-80">
                Total purchase cost
              </p>
            </div>
          </div>
        </div>

        {/* Sell Price Card */}
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-cyan-300 font-medium">Sell Price</p>
                <div className="flex items-center space-x-1">
                  {isLoadingStats && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400/30"></div>
                  )}
                </div>
              </div>
              <p className="text-base font-bold text-cyan-400">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-400 text-sm">Error</span>
                ) : (
                  formatCurrency(stats?.total_sell_value || 0)
                )}
              </p>
              <p className="text-xs text-cyan-500 opacity-80">
                Total sales revenue
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Profit Card */}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2v-14a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-300 font-medium">
                  Estimated Profit
                </p>
                <div className="flex items-center space-x-1">
                  {isLoadingStats && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400/30"></div>
                  )}
                </div>
              </div>
              <p className="text-base font-bold text-green-400">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-400 text-sm">Error</span>
                ) : (
                  formatCurrency(
                    (stats?.total_sell_value || 0) -
                      (stats?.total_buy_value || 0)
                  )
                )}
              </p>
              <p className="text-xs text-green-500 opacity-80">
                {isLoadingStats
                  ? "Loading..."
                  : statsError
                  ? "Error"
                  : `${(
                      (((stats?.total_sell_value || 0) -
                        (stats?.total_buy_value || 0)) /
                        (stats?.total_sell_value || 1)) *
                      100
                    ).toFixed(1)}% profit margin`}
              </p>
            </div>
          </div>
        </div>

        {/* Customers Card */}
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-purple-300 font-medium">
                  Total Customers
                </p>
                <div className="flex items-center space-x-1">
                  {isLoadingCustomerStats && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400/30"></div>
                  )}
                  <button
                    onClick={refetchCustomerStats}
                    disabled={isLoadingCustomerStats}
                    className="p-1 rounded-full hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                    title="Refresh customer stats"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 text-purple-400 hover:text-purple-300 ${
                        isLoadingCustomerStats ? "animate-spin" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-base font-bold text-purple-400">
                {isLoadingCustomerStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : customerStatsError ? (
                  <span className="text-red-400 text-sm">Error</span>
                ) : (
                  customerStats?.total_customers || 0
                )}
              </p>
              <p className="text-xs text-purple-500 opacity-80">
                {isLoadingCustomerStats
                  ? "Loading..."
                  : customerStatsError
                  ? "Error loading data"
                  : `${customerStats?.active_customers || 0} active customers`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Recent Activities */}
        <div className="xl:col-span-2 bg-white/3 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-sm">
          <div className="py-4 px-2 sm:p-6">
            {/* Mobile Layout - Single Row */}
            <div className="md:hidden">
              <div className="flex flex-col space-y-3 mb-4">
                <h3 className="text-lg font-bold text-white">
                  Recent Activities
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleNewOrder}
                    disabled={isNavigating}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
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
                    Create Sale
                  </button>
                  <FilterDropdown
                    currentFilter={currentFilter}
                    currentFilterLabel={currentFilterLabel}
                    onFilterChange={handleFilterChange}
                    onCustomDateRange={handleCustomDateRange}
                    isMobile={true}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-white">
                  Recent Activities
                </h3>
                <button
                  onClick={handleNewOrder}
                  disabled={isNavigating}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Create Sale
                </button>
              </div>
              <FilterDropdown
                currentFilter={currentFilter}
                currentFilterLabel={currentFilterLabel}
                onFilterChange={handleFilterChange}
                onCustomDateRange={handleCustomDateRange}
                isMobile={false}
              />
            </div>

            {/* First row: Buy Price and Sell Price (2 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-green-300 font-medium">
                      Buy Price
                    </p>
                    <p className="text-base font-bold text-green-400">
                      {isLoadingSales ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : salesError ? (
                        <span className="text-red-400 text-sm">Error</span>
                      ) : (
                        formatCurrency(recentActivitiesStats.totalBuyPrice)
                      )}
                    </p>
                    <p className="text-xs text-green-500 opacity-80">
                      {recentActivitiesStats.salesCount} recent sales
                    </p>
                  </div>
                </div>
              </div>

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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-red-300 font-medium">
                      Sell Price
                    </p>
                    <p className="text-base font-bold text-red-400">
                      {isLoadingSales ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : salesError ? (
                        <span className="text-red-400 text-sm">Error</span>
                      ) : (
                        formatCurrency(recentActivitiesStats.totalSellPrice)
                      )}
                    </p>
                    <p className="text-xs text-red-500 opacity-80">
                      Total revenue
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Card - Appears in first row on desktop, but full width in a separate row on mobile */}
              <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/8 border border-purple-500/25 rounded-lg p-2.5 backdrop-blur-sm hidden md:block">
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
                      Profit
                    </p>
                    <p className="text-base font-bold text-purple-400">
                      {isLoadingSales ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : salesError ? (
                        <span className="text-red-400 text-sm">Error</span>
                      ) : (
                        formatCurrency(recentActivitiesStats.totalProfit)
                      )}
                    </p>
                    <p className="text-xs text-purple-500 opacity-80">
                      {isLoadingSales || salesError
                        ? "Loading..."
                        : `${recentActivitiesStats.profitMargin.toFixed(
                            1
                          )}% profit margin`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Second row: Profit Card (full width on mobile only) */}
            <div className="md:hidden mb-4">
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
                      Profit
                    </p>
                    <p className="text-base font-bold text-purple-400">
                      {isLoadingSales ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : salesError ? (
                        <span className="text-red-400 text-sm">Error</span>
                      ) : (
                        formatCurrency(recentActivitiesStats.totalProfit)
                      )}
                    </p>
                    <p className="text-xs text-purple-500 opacity-80">
                      {isLoadingSales || salesError
                        ? "Loading..."
                        : `${recentActivitiesStats.profitMargin.toFixed(
                            1
                          )}% profit margin`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Order Activities */}
            <div className="bg-black/20 rounded-xl p-2 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-medium text-white">
                  Recent Order Activities
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    Filter: {currentFilterLabel}
                  </span>
                  <button
                    onClick={refetchSales}
                    disabled={isLoadingSales}
                    className="p-1 rounded-full hover:bg-white/3 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Refresh sales data"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 text-gray-400 hover:text-white ${
                        isLoadingSales ? "animate-spin" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
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

        {/* Quick Actions & Tasks */}
        <div className="space-y-6">
          {/* Communications Hub */}
          <div className="bg-white/3 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-4">
            <h3 className="text-lg font-bold text-white mb-6">
              Communications Hub
            </h3>

            {/* SMS Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-3">
                    <span className="text-white text-sm">�</span>
                  </div>
                  <span className="text-white font-medium">SMS Balance</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isLoadingSmsCredits && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400/30"></div>
                  )}
                  <span className="text-blue-400 font-bold">
                    {isLoadingSmsCredits ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : smsCreditsError ? (
                      <span className="text-red-400 text-xs">Error</span>
                    ) : (
                      `${smsCredits.toLocaleString()} credits`
                    )}
                  </span>
                  <button
                    onClick={() => {
                      refetchSmsCredits();
                      refetchRecentSms();
                    }}
                    disabled={isLoadingSmsCredits || isLoadingRecentSms}
                    className="p-1 rounded-full hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                    title="Refresh SMS data"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 text-blue-400 hover:text-blue-300 ${
                        isLoadingSmsCredits || isLoadingRecentSms ? "animate-spin" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleBuySubscription}
                    disabled={isNavigating}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs font-medium text-white px-2 py-1 rounded transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy
                  </button>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                {isLoadingRecentSms ? (
                  // Loading state
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400/30"></div>
                    <span className="ml-2 text-xs text-gray-400">Loading recent SMS...</span>
                  </div>
                ) : recentSmsError ? (
                  // Error state
                  <div className="text-center py-4">
                    <p className="text-xs text-red-400 mb-2">Failed to load recent SMS</p>
                    <button
                      onClick={refetchRecentSms}
                      className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : recentSms ? (
                  // Recent SMS data
                  <>
                    <p className="text-xs text-gray-400 mb-1">Last SMS sent:</p>
                    <p className="text-sm text-white font-medium">
                      {recentSms.recipient}
                    </p>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      &ldquo;{recentSms.message.length > 50 
                        ? `${recentSms.message.substring(0, 50)}...` 
                        : recentSms.message}&rdquo;
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {new Date(recentSms.sent_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          recentSms.status === 'sent' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {recentSms.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {recentSms.sms_count} SMS
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  // No SMS data
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400 mb-1">No SMS sent yet</p>
                    <p className="text-xs text-gray-500">Your SMS history will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={handleSendSms}
                disabled={isNavigating}
                className="w-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send SMS
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/3 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-4">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleNewOrder}
                disabled={isNavigating}
                className="p-3 bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 backdrop-blur-sm rounded-xl hover:from-green-500/20 hover:to-green-600/15 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
                  🛒
                </span>
                <span className="text-sm text-white font-medium">
                  New Sale
                </span>
              </button>
              <button
                onClick={handleAddProduct}
                disabled={isNavigating}
                className="p-3 bg-gradient-to-br from-blue-500/15 to-blue-600/8 border border-blue-500/25 backdrop-blur-sm rounded-xl hover:from-blue-500/20 hover:to-blue-600/15 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
                  📦
                </span>
                <span className="text-sm text-white font-medium">
                  Add Product
                </span>
              </button>
              <button
                onClick={handleNewCustomer}
                className="p-3 bg-gradient-to-br from-purple-500/15 to-purple-600/8 border border-purple-500/25 backdrop-blur-sm rounded-xl hover:from-purple-500/20 hover:to-purple-600/15 transition-all duration-200 group cursor-pointer"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
                  👥
                </span>
                <span className="text-sm text-white font-medium">
                  New Customer
                </span>
              </button>
              <button
                onClick={handleDueBook}
                disabled={isNavigating}
                className="p-3 bg-gradient-to-br from-orange-500/15 to-orange-600/8 border border-orange-500/25 backdrop-blur-sm rounded-xl hover:from-orange-500/20 hover:to-orange-600/15 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
                  �
                </span>
                <span className="text-sm text-white font-medium">Due Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Banking & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Low Stock Alert */}
        <div className="bg-white/3 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm py-6 px-2 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 mr-3">
                <span className="text-white">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-white">Low Stock Alert</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {outOfStockProducts.length + lowStockProducts.length} alerts
              </span>
              <button
                onClick={refetchStock}
                disabled={isLoadingStock}
                className="p-1 rounded-full hover:bg-white/3 transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh stock data"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 text-gray-400 hover:text-white ${
                    isLoadingStock ? "animate-spin" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

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

          <div className="flex justify-center mt-4">
            <button
              className="px-6 py-2 bg-gradient-to-r from-orange-500/30 to-red-500/30 hover:from-orange-500/50 hover:to-red-500/50 text-white rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
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
        <div className="bg-white/3 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm py-6 sm:px-6 px-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 mr-3">
                <span className="text-white">🏦</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Banking Overview
                </h3>
                <p className="text-sm text-gray-300">
                  {isLoadingBanking
                    ? "Loading..."
                    : bankingError
                    ? "Error loading accounts"
                    : `Across ${bankingOverview?.total_accounts || 0} accounts`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isLoadingBanking && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/30"></div>
              )}
              <button
                onClick={refetchBanking}
                disabled={isLoadingBanking}
                className="p-1 rounded-full hover:bg-white/3 transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh banking data"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 text-gray-400 hover:text-white ${
                    isLoadingBanking ? "animate-spin" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {isLoadingBanking ? (
                    <span className="animate-pulse text-lg">Loading...</span>
                  ) : bankingError ? (
                    <span className="text-red-400 text-lg">Error</span>
                  ) : (
                    formatCurrency(bankingOverview?.total_balance || 0)
                  )}
                </p>
                <p className="text-sm text-green-300">
                  {isLoadingBanking
                    ? "Loading..."
                    : bankingError
                    ? "Error"
                    : `+${
                        bankingOverview?.monthly_change_percentage || 0
                      }% this month`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isLoadingBanking ? (
              // Loading state
              [...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-500/10 border border-gray-400/30 rounded-xl p-3 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-gray-400/30 rounded w-20"></div>
                    <div className="w-2 h-2 bg-gray-400/30 rounded-full"></div>
                  </div>
                  <div className="h-6 bg-gray-400/30 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-400/30 rounded w-16"></div>
                </div>
              ))
            ) : bankingError ? (
              // Error state
              <div className="col-span-2 flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-red-400 mb-2">⚠️</div>
                  <p className="text-sm text-red-400">{bankingError}</p>
                  <button
                    onClick={refetchBanking}
                    className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : bankingOverview?.accounts.length === 0 ? (
              // Empty state
              <div className="col-span-2 flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">🏦</div>
                  <p className="text-sm text-gray-400">
                    No bank accounts found
                  </p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">
                    Create your first account to get started
                  </p>
                  <button
                    onClick={handleCreateMainAccount}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    Create Main Account
                  </button>
                </div>
              </div>
            ) : (
              bankingOverview?.accounts.map((account, index) => {
                // Define colors for accounts
                const colors = ["green", "blue", "purple", "red"];
                const accountColor = colors[index % colors.length];
                const accountStatus =
                  index === 0
                    ? "Primary"
                    : index === 1
                    ? "Business"
                    : index === 2
                    ? "Investment"
                    : "Reserve";

                return (
                  <div
                    key={account.id}
                    className={`bg-gradient-to-br from-${accountColor}-500/10 to-${accountColor}-600/10 border border-${accountColor}-400/30 rounded-xl p-3 hover:from-${accountColor}-500/20 hover:to-${accountColor}-600/20 transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`text-${accountColor}-400 text-sm font-medium`}
                      >
                        {account.name}
                      </p>
                      <div
                        className={`w-2 h-2 bg-${accountColor}-400 rounded-full`}
                      ></div>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {formatCurrency(account.balance)}
                    </p>
                    <p className={`text-${accountColor}-300 text-xs`}>
                      {accountStatus}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <button
            className="w-full mt-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 hover:from-green-500/50 hover:to-emerald-500/50 text-white rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
            onClick={() => {
              setIsNavigating(true);
              router.push("/dashboard/banking");
            }}
            disabled={isNavigating}
          >
            See More Banking Details
          </button>
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
