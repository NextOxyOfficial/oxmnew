"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import { Order } from "@/types/order";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [isNavigating, setIsNavigating] = useState(false);

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
    const matchesSearch =
      order.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm);

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
        return a.product.name.localeCompare(b.product.name);
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
                <p className="text-sm text-cyan-300 font-medium">Total Orders</p>
                <p className="text-base font-bold text-cyan-400">
                  {totalOrders}
                </p>
                <p className="text-xs text-cyan-500 opacity-80">All completed orders</p>
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
                <p className="text-sm text-green-300 font-medium">Total Revenue</p>
                <p className="text-base font-bold text-green-400">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-green-500 opacity-80">Total sales income</p>
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
                <p className="text-xs text-blue-500 opacity-80">Per order value</p>
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
                    ordersToday.reduce((sum, order) => sum + order.total_amount, 0)
                  )}{" "}
                  revenue
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
                          {order.product.name}
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
                          {formatCurrency(order.total_amount)}
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
                          {order.quantity} × {formatCurrency(order.unit_price)}
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
                <div className="overflow-x-auto">
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
                                {order.product.name}
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
                            {formatCurrency(order.unit_price)}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-cyan-400">
                            {formatCurrency(order.total_amount)}
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
      </div>
    </div>
  );
}
