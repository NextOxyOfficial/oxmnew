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
  const [sortBy, setSortBy] = useState("date");
  const [isNavigating, setIsNavigating] = useState(false);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleEditInvoice = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent order click event
    // TODO: Navigate to invoice edit page or open edit modal
    console.log("Edit invoice clicked for order:", order.id);
  };

  const handleViewInvoice = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent order click event
    setSelectedOrder(order);
    setShowInvoicePopup(true);
  };

  const handlePrintInvoice = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent order click event
    // Open invoice popup first, then user can print from there
    handleViewInvoice(order, event);
  };

  const handleDeleteOrder = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent order click event
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
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

  // Calculate statistics
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((sum, order) => {
    const amount = parseFloat(String(order.total_amount || 0));
    const validAmount = isNaN(amount) ? 0 : amount;
    return sum + validAmount;
  }, 0);

  // Calculate total profit from all orders
  const totalProfit = orders.reduce((sum, order) => {
    // Calculate profit as (unit_price - buy_price) * quantity
    const unitPrice = parseFloat(String(order.unit_price || 0));
    const buyPrice = parseFloat(String(order.buy_price || 0));
    const quantity = order.quantity || 0;
    
    if (!isNaN(unitPrice) && !isNaN(buyPrice) && quantity > 0) {
      const orderProfit = (unitPrice - buyPrice) * quantity;
      return sum + (isNaN(orderProfit) ? 0 : orderProfit);
    }
    return sum;
  }, 0);

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
    const matchesSearch =
      (order.product_name &&
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_name &&
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.includes(searchTerm));

    const matchesCustomer =
      filterCustomer === "all" ||
      (filterCustomer === "with_customer" && order.customer_name) ||
      (filterCustomer === "without_customer" && !order.customer_name);

    return matchesSearch && matchesCustomer;
  });

  const sortedOrders = filteredOrders.sort((a, b) => {
    switch (sortBy) {
      case "date":
        return (
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
        );
      case "product":
        return (a.product_name || "").localeCompare(b.product_name || "");
      case "customer":
        return (a.customer_name || "").localeCompare(b.customer_name || "");
      case "amount-high":
        return (
          parseFloat(String(b.total_amount || 0)) -
          parseFloat(String(a.total_amount || 0))
        );
      case "amount-low":
        return (
          parseFloat(String(a.total_amount || 0)) -
          parseFloat(String(b.total_amount || 0))
        );
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
                  {formatCurrency(totalRevenue || 0)}
                </p>
                <p className="text-xs text-green-500 opacity-80">
                  Total sales income
                </p>
              </div>
            </div>
          </div>

          {/* Total Profit */}
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-300 font-medium">Total Profit</p>
                <p className="text-base font-bold text-blue-400">
                  {formatCurrency(totalProfit || 0)}
                </p>
                <p className="text-xs text-blue-500 opacity-80">
                  Revenue minus cost
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

                {/* Search */}
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

                {/* Customer Filter */}
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[160px]"
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

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[180px]"
                >
                  <option value="date" className="bg-slate-800">
                    Date (Newest)
                  </option>
                  <option value="product" className="bg-slate-800">
                    Product Name
                  </option>
                  <option value="customer" className="bg-slate-800">
                    Customer Name
                  </option>
                  <option value="amount-high" className="bg-slate-800">
                    Amount: High to Low
                  </option>
                  <option value="amount-low" className="bg-slate-800">
                    Amount: Low to High
                  </option>
                  <option value="quantity-high" className="bg-slate-800">
                    Quantity: High to Low
                  </option>
                  <option value="quantity-low" className="bg-slate-800">
                    Quantity: Low to High
                  </option>
                </select>
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
                          Order #{order.id}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(order.sale_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-400">
                          {formatCurrency(
                            ((order.unit_price || 0) - (order.buy_price || 0)) * 
                            (order.quantity || 0)
                          )}
                        </p>
                        <p className="text-xs text-slate-400">Profit</p>
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
                          Buy & Sell Price
                        </p>
                        <p className="text-sm font-medium text-slate-100">
                          {formatCurrency(order.buy_price || 0)} → {formatCurrency(order.unit_price || 0)}
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

                    {/* Invoice line with print and edit icons */}
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"
                        onClick={(e) => handleViewInvoice(order, e)}
                        title="View Invoice"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-slate-400">Invoice</p>
                          <p className="text-sm text-slate-300">#{order.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                          onClick={(e) => handlePrintInvoice(order, e)}
                          title="Print Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        <button 
                          className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                          onClick={(e) => handleEditInvoice(order, e)}
                          title="Edit Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Order ID
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Buy Price
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Sell Price
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Profit
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                          Invoice
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
                                #{order.id}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDate(order.sale_date)}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
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
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-100">
                            {formatCurrency(order.buy_price || 0)}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-100">
                            {formatCurrency(order.unit_price || 0)}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-cyan-400">
                            {formatCurrency(
                              ((order.unit_price || 0) - (order.buy_price || 0)) * 
                              (order.quantity || 0)
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"
                                onClick={(e) => handleViewInvoice(order, e)}
                                title="View Invoice"
                              >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <button 
                                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                                  onClick={(e) => handleEditInvoice(order, e)}
                                  title="Edit Invoice"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Handle SMS functionality
                                    console.log("SMS clicked for order:", order.id);
                                  }}
                                  title="Send SMS"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </button>
                                <button 
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                  onClick={(e) => handleDeleteOrder(order, e)}
                                  title="Delete Order"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
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

        {/* Invoice Popup Modal */}
        {showInvoicePopup && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-20 print:pt-0 print:p-0">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-4xl w-full mb-8 print:bg-white print:border-none print:shadow-none print:max-w-none print:my-0 print:mb-0">
              {/* Modal Header */}
              <div className="flex justify-end items-center p-6 border-b border-slate-700/50 print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    onClick={printInvoice}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={closeInvoicePopup}
                    className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Invoice Content */}
              <div className="p-6 print:px-0 print:bg-white print:w-full">
                {/* Invoice Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center print:bg-gray-800">
                    <span className="text-white font-bold text-sm print:text-white">Store Logo</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 print:text-gray-900">Invoice #{selectedOrder.id}</h2>
                  <p className="text-sm text-slate-300 print:text-gray-600">{new Date(selectedOrder.sale_date).toLocaleDateString()}</p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 print:grid-cols-2 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-3 print:bg-transparent">
                    <div className="text-slate-300 print:text-gray-600 space-y-0.5 text-xs">
                      <p className="font-medium text-slate-100 print:text-gray-900">Your Store Name</p>
                      <p>123 Business Street</p>
                      <p>City, State 12345</p>
                      <p>Phone: (555) 123-4567</p>
                      <p>Email: store@yourstore.com</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3 print:bg-transparent">
                    {selectedOrder.customer_name ? (
                      <div className="text-slate-300 print:text-gray-600 space-y-0.5 text-xs">
                        <p className="font-medium text-slate-100 print:text-gray-900">{selectedOrder.customer_name}</p>
                        {selectedOrder.customer_phone && <p>{selectedOrder.customer_phone}</p>}
                        {selectedOrder.customer_email && <p>{selectedOrder.customer_email}</p>}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic print:text-gray-500 text-xs">Walk-in Customer</p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6 bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden print:bg-transparent print:border-gray-300">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700/50 print:bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">Item</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/30 print:border-gray-200">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-100 print:text-gray-900">{selectedOrder.product_name}</p>
                            {selectedOrder.variant && (
                              <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                                {selectedOrder.variant.color && `Color: ${selectedOrder.variant.color}`}
                                {selectedOrder.variant.size && ` | Size: ${selectedOrder.variant.size}`}
                                {selectedOrder.variant.custom_variant && ` | ${selectedOrder.variant.custom_variant}`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-200 print:text-gray-800">{selectedOrder.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-200 print:text-gray-800">{formatCurrency(selectedOrder.unit_price || 0)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-cyan-400 print:text-gray-900">{formatCurrency(selectedOrder.total_amount || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 print:bg-transparent print:border-gray-300">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 text-slate-300 print:text-gray-600 text-sm">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.total_amount || 0)}</span>
                      </div>
                      <div className="border-t border-slate-600/50 print:border-gray-300 pt-2">
                        <div className="flex justify-between text-base font-bold text-slate-100 print:text-gray-900">
                          <span>Total:</span>
                          <span className="text-cyan-400 print:text-gray-900">{formatCurrency(selectedOrder.total_amount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && orderToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700/50">
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Confirm Delete
                </h3>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-slate-300 mb-4">
                  Are you sure you want to delete this order? This action will:
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Restore <strong>{orderToDelete.quantity}</strong> units of <strong>{orderToDelete.product_name}</strong> back to stock
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Permanently remove this order from your records
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-slate-400">
                  <strong>Note:</strong> This action cannot be undone.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
