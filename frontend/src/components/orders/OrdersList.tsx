"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { Order } from "@/types/order";
import React from "react";

interface OrdersListProps {
  orders: Order[];
  totalItems: number;
  isSearching: boolean;
  searchInput?: string; // Add searchInput to highlight matches
  isSendingSms?: number | null; // ID of the order currently sending SMS
  onOrderClick: (order: Order) => void;
  onCustomerClick: (order: Order, event: React.MouseEvent) => void; // Added customer navigation
  onViewInvoice: (order: Order, event: React.MouseEvent) => void;
  onPrintInvoice: (order: Order, event: React.MouseEvent) => void;
  onEditInvoice: (order: Order, event: React.MouseEvent) => void;
  onDeleteOrder: (order: Order, event: React.MouseEvent) => void;
  onSendSms: (order: Order, event: React.MouseEvent) => void;
  onAddOrder: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  totalItems,
  isSearching,
  searchInput,
  isSendingSms,
  onOrderClick,
  onCustomerClick,
  onEditInvoice,
  onDeleteOrder,
  onSendSms,
  onAddOrder,
}) => {
  const formatCurrency = useCurrencyFormatter();

  // Check if search is for order number
  const isOrderNumberSearch = searchInput?.trim().startsWith("#");
  const searchOrderNumber = isOrderNumberSearch
    ? searchInput?.substring(1).trim()
    : "";

  // Function to highlight order number if it matches search
  const highlightOrderNumber = (orderNumber: string | number) => {
    const orderNumStr = orderNumber.toString();
    if (
      isOrderNumberSearch &&
      searchOrderNumber &&
      orderNumStr.includes(searchOrderNumber)
    ) {
      const index = orderNumStr.indexOf(searchOrderNumber);
      const before = orderNumStr.substring(0, index);
      const match = orderNumStr.substring(
        index,
        index + searchOrderNumber.length
      );
      const after = orderNumStr.substring(index + searchOrderNumber.length);

      return (
        <>
          {before}
          <span className="bg-cyan-100 text-cyan-700 font-semibold">
            {match}
          </span>
          {after}
        </>
      );
    }
    return orderNumStr;
  };

  // Navigate to invoice page in new tab
  const handleViewInvoice = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open invoice in new tab
    const invoiceUrl = `/invoice/${order.id}`;
    window.open(invoiceUrl, "_blank");
  };

  // Print invoice by navigating to invoice page
  const handlePrintInvoice = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open invoice page in new tab for printing
    window.open(`/invoice/${order.id}`, "_blank");
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

  // Render status label
  const renderStatusLabel = (status?: string) => {
    if (status === "draft") {
      return <span className="badge badge-warn ml-1.5">ড্রাফট</span>;
    }
    return <span className="badge badge-success ml-1.5">কমপ্লিট</span>;
  };

  if (isSearching) {
    return (
      <div className="empty">
        <span className="inline-flex items-center gap-2">
          <svg
            className="w-4 h-4 text-cyan-600 animate-spin"
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
          অর্ডার খোঁজা হচ্ছে…
        </span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty">
        <p className="text-slate-900 font-medium mb-1">কোনো অর্ডার পাওয়া যায়নি</p>
        <p className="mb-4">
          {totalItems === 0
            ? "প্রথম অর্ডারটা বানিয়ে শুরু করুন।"
            : "খোঁজা বা ফিল্টার একটু বদলে দেখুন।"}
        </p>
        <button onClick={onAddOrder} className="btn btn-primary">
          প্রথম অর্ডার বানান
        </button>
      </div>
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>অর্ডার</th>
            <th>কাস্টমার</th>
            <th className="cell-num">কেনা দাম</th>
            <th className="cell-num">মোট দাম</th>
            <th className="cell-num">নিট লাভ</th>
            <th>ইনভয়েস</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="cursor-pointer"
              onClick={() => onOrderClick(order)}
            >
              <td>
                <div className="flex items-center">
                  <span className="cell-strong">#{order.id}</span>
                  {renderStatusLabel(order.status)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDate(order.sale_date)}
                </div>
              </td>
              <td>
                {order.customer_name ? (
                  <div className="min-w-0">
                    <button
                      onClick={(e) => onCustomerClick(order, e)}
                      className="text-slate-900 hover:text-cyan-600 transition-colors text-left truncate max-w-[12rem]"
                      title={order.customer_name}
                    >
                      {order.customer_name}
                    </button>
                    {order.customer_phone && (
                      <div className="text-xs text-slate-500">
                        {order.customer_phone}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500">কাস্টমারের তথ্য নেই</span>
                )}
              </td>
              <td className="cell-num">
                {formatCurrency(order.total_buy_price || 0)}
              </td>
              <td className="cell-num cell-strong">
                {formatCurrency(order.total_amount || 0)}
              </td>
              <td
                className={`cell-num ${
                  (order.net_profit || 0) >= 0 ? "money-pos" : "money-neg"
                }`}
              >
                {formatCurrency(order.net_profit || 0)}
              </td>
              <td>
                <button
                  className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 transition-colors"
                  onClick={(e) => handleViewInvoice(order, e)}
                  title="ইনভয়েস দেখুন"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="num">
                    #{highlightOrderNumber(order.order_number || order.id)}
                  </span>
                </button>
              </td>
              <td className="text-right">
                <div className="row-actions">
                  <button
                    className="p-1.5 text-slate-500 hover:text-cyan-600 transition-colors"
                    onClick={(e) => handlePrintInvoice(order, e)}
                    title="ইনভয়েস প্রিন্ট করুন"
                    aria-label="ইনভয়েস প্রিন্ট করুন"
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
                  </button>
                  <button
                    className="p-1.5 text-slate-500 hover:text-cyan-600 transition-colors"
                    onClick={(e) => onEditInvoice(order, e)}
                    title="অর্ডার এডিট করুন"
                    aria-label="অর্ডার এডিট করুন"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    className="p-1.5 text-slate-500 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => onSendSms(order, e)}
                    disabled={isSendingSms === order.id}
                    title="এসএমএস পাঠান"
                    aria-label="এসএমএস পাঠান"
                  >
                    {isSendingSms === order.id ? (
                      <svg
                        className="w-4 h-4 animate-spin"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                    onClick={(e) => onDeleteOrder(order, e)}
                    title="অর্ডার ডিলিট করুন"
                    aria-label="অর্ডার ডিলিট করুন"
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(OrdersList, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.orders === nextProps.orders &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.isSearching === nextProps.isSearching &&
    prevProps.searchInput === nextProps.searchInput &&
    prevProps.isSendingSms === nextProps.isSendingSms
    // Don't compare functions as they should be memoized with useCallback
  );
});
