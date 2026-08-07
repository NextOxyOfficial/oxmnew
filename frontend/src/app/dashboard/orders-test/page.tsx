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
      setError("অর্ডার লোড করা যায়নি");
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

  // Same behaviour as the main orders list: open the order's invoice.
  const handleOrderClick = (order: Order) => {
    window.open(`/invoice/${order.id}`, "_blank");
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
              <title>অর্ডারের রিপোর্ট</title>
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
                <h1>অর্ডারের রিপোর্ট</h1>
                <p>তৈরির তারিখ: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="filters">
                <strong>যে ফিল্টার দেওয়া হয়েছে:</strong><br>
                তারিখ ফিল্টার: ${
                  dateFilter === "all"
                    ? "সব সময়"
                    : dateFilter.replace("_", " ").toUpperCase()
                }<br>
                ${productFilter ? `প্রোডাক্ট ফিল্টার: ${productFilter}<br>` : ""}
                ${
                  customerNameFilter
                    ? `কাস্টমার ফিল্টার: ${customerNameFilter}<br>`
                    : ""
                }
                মোট সারি: ${sortedOrders.length}
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
      <div className="page">
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
      <header className="page-head">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">অর্ডার — টেস্ট পাতা</h1>
            <span className="badge badge-warn">টেস্টিং</span>
          </div>
          <p className="page-sub">
            নতুন ফিচার পরখ করার জায়গা — কাস্টমারের অর্ডার আর বিক্রির হিসাব
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddOrder}
            disabled={isNavigating}
            className="btn btn-primary"
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
                লোড হচ্ছে…
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
                নতুন অর্ডার
              </>
            )}
          </button>

          <button onClick={handlePrint} className="btn btn-ghost">
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
            রিপোর্ট প্রিন্ট
          </button>
        </div>
      </header>

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট অর্ডার</div>
            <div className="stat-value num">{totalOrders}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>

          <div className="stat">
            <div className="stat-label">মোট বিক্রি</div>
            <div className="stat-value money-pos">
              {formatCurrency(totalRevenue || 0)}
            </div>
            <div className="stat-meta">বিক্রি থেকে আসা টাকা</div>
          </div>

          <div className="stat">
            <div className="stat-label">গড় অর্ডার</div>
            <div className="stat-value num">
              {formatCurrency(averageOrderValue || 0)}
            </div>
            <div className="stat-meta">প্রতি অর্ডারে</div>
          </div>

          <div className="stat">
            <div className="stat-label">আজকের অর্ডার</div>
            <div className="stat-value num">{ordersToday.length}</div>
            <div className="stat-meta">
              আজকে বিক্রি {formatCurrency(todaysRevenue || 0)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="plane-section">
          <div className="section-title">খোঁজা ও ফিল্টার</div>

          <div className="relative w-full sm:max-w-md mb-3">
            <input
              type="text"
              placeholder="অর্ডার বা কাস্টমার খুঁজুন…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date Filter */}
            <div>
              <label className="label">তারিখ ফিল্টার</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="select"
              >
                <option value="all">সব সময়</option>
                <option value="today">আজকে</option>
                <option value="yesterday">গতকাল</option>
                <option value="this_week">এই সপ্তাহ</option>
                <option value="last_week">গত সপ্তাহ</option>
                <option value="this_month">এই মাস</option>
                <option value="last_month">গত মাস</option>
                <option value="this_year">এই বছর</option>
                <option value="custom">নিজে তারিখ দিন</option>
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <label className="label">প্রোডাক্টের নাম</label>
              <input
                type="text"
                placeholder="প্রোডাক্ট দিয়ে ফিল্টার করুন…"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="input"
              />
            </div>

            {/* Customer Name Filter */}
            <div>
              <label className="label">কাস্টমারের নাম</label>
              <input
                type="text"
                placeholder="কাস্টমার দিয়ে ফিল্টার করুন…"
                value={customerNameFilter}
                onChange={(e) => setCustomerNameFilter(e.target.value)}
                className="input"
              />
            </div>

            {/* Customer Type Filter */}
            <div>
              <label className="label">কাস্টমারের টাইপ</label>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="select"
              >
                <option value="all">সব অর্ডার</option>
                <option value="with_customer">কাস্টমার আছে</option>
                <option value="without_customer">কাস্টমার নেই</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="label">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">শেষের তারিখ</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {(dateFilter !== "all" ||
            productFilter ||
            customerNameFilter ||
            filterCustomer !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-slate-500 font-medium">
                চালু ফিল্টার:
              </span>
              {dateFilter !== "all" && (
                <span className="badge badge-info">
                  তারিখ: {dateFilter.replace("_", " ")}
                </span>
              )}
              {productFilter && (
                <span className="badge badge-info">প্রোডাক্ট: {productFilter}</span>
              )}
              {customerNameFilter && (
                <span className="badge badge-info">
                  কাস্টমার: {customerNameFilter}
                </span>
              )}
              {filterCustomer !== "all" && (
                <span className="badge badge-info">
                  টাইপ: {filterCustomer.replace("_", " ")}
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
                className="btn btn-ghost btn-sm"
              >
                সব মুছে দিন
              </button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        {sortedOrders.length === 0 ? (
          <div className="empty">
            <p className="text-slate-900 font-medium mb-1">
              কোনো অর্ডার পাওয়া যায়নি
            </p>
            <p className="mb-4">
              {orders.length === 0
                ? "প্রথম অর্ডারটা বানিয়ে শুরু করুন।"
                : "খোঁজা বা ফিল্টার একটু বদলে দেখুন।"}
            </p>
            <button onClick={handleAddOrder} className="btn btn-primary">
              প্রথম অর্ডার বানান
            </button>
          </div>
        ) : (
          <div className="tbl-wrap" id="orders-table-print">
            <table className="tbl">
              <thead>
                <tr>
                  <th>প্রোডাক্ট</th>
                  <th>কাস্টমার</th>
                  <th className="cell-num">পরিমাণ</th>
                  <th className="cell-num">দাম</th>
                  <th className="cell-num">মোট</th>
                  <th>তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td>
                      <div className="cell-strong">
                        {order?.product_name || "নাম নেই"}
                      </div>
                      {order.variant && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {order.variant.color} - {order.variant.size}
                          {order.variant.custom_variant &&
                            ` - ${order.variant.custom_variant}`}
                        </div>
                      )}
                      {order.notes && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[16rem]" title={order.notes}>
                          নোট: {order.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      {order.customer_name ? (
                        <div>
                          <div className="text-slate-900">
                            {order.customer_name}
                          </div>
                          {order.customer_phone && (
                            <div className="text-xs text-slate-500">
                              {order.customer_phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          কাস্টমারের তথ্য নেই
                        </span>
                      )}
                    </td>
                    <td className="cell-num">{order.quantity}</td>
                    <td className="cell-num">
                      {formatCurrency(order.unit_price || 0)}
                    </td>
                    <td className="cell-num cell-strong">
                      {formatCurrency(order.total_amount || 0)}
                    </td>
                    <td className="text-slate-500">
                      {formatDate(order.sale_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Summary */}
        {(dateFilter !== "all" ||
          productFilter ||
          customerNameFilter ||
          filterCustomer !== "all" ||
          searchTerm) && (
          <div className="plane-section">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="section-title">ফিল্টারের ফল</div>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>
                    মোট {orders.length}টির মধ্যে {sortedOrders.length}টি দেখাচ্ছে
                  </p>
                  {sortedOrders.length > 0 && (
                    <>
                      <p>
                        মোট বিক্রি:{" "}
                        <span className="money-pos font-medium">
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
                        গড় অর্ডার:{" "}
                        <span className="num font-medium text-slate-900">
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
                <button onClick={handlePrint} className="btn btn-ghost">
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
                  ফিল্টার করা ফল প্রিন্ট করুন
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
