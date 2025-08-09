"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { Order } from "@/types/order";
import React from "react";

interface OrdersListProps {
  orders: Order[];
  totalItems: number;
  isSearching: boolean;
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
  isSendingSms,
  onOrderClick,
  onCustomerClick,
  onViewInvoice,
  onPrintInvoice,
  onEditInvoice,
  onDeleteOrder,
  onSendSms,
  onAddOrder,
}) => {
  const formatCurrency = useCurrencyFormatter();
  console.log("OrdersList re-rendered");

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

  if (isSearching) {
    return (
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
          <span className="text-slate-200 text-sm">Searching orders...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
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
          {totalItems === 0
            ? "Get started by creating your first order."
            : "Try adjusting your search or filter criteria."}
        </p>
        <button
          onClick={onAddOrder}
          className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Create First Order
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4 p-2 sm:p-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => onOrderClick(order)}
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
                  {formatCurrency(order.gross_profit || 0)}
                </p>
                <p className="text-xs text-slate-400">Profit</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                {order.customer_name ? (
                  <div>
                    <button
                      onClick={(e) => onCustomerClick(order, e)}
                      className="text-sm text-slate-100 hover:text-cyan-400 transition-colors cursor-pointer text-left"
                    >
                      {order.customer_name}
                    </button>
                    {order.customer_phone && (
                      <p className="text-xs text-slate-400">
                        {order.customer_phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No customer info</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400">Buy & Sell Price</p>
                <p className="text-sm font-medium text-slate-100">
                  {formatCurrency(order.buy_price || 0)} →{" "}
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

            {/* Invoice line with print and edit icons */}
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={(e) => onViewInvoice(order, e)}
                title="View Invoice"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
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
                <div>
                  <p className="text-xs text-slate-400">Invoice</p>
                  <p className="text-sm text-slate-300">#{order.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  onClick={(e) => onPrintInvoice(order, e)}
                  title="Print Invoice"
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
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  onClick={(e) => onEditInvoice(order, e)}
                  title="Edit Invoice"
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
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  onClick={(e) => onSendSms(order, e)}
                  disabled={isSendingSms === order.id}
                  title="Send SMS"
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
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
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => onOrderClick(order)}
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
                          <button
                            onClick={(e) => onCustomerClick(order, e)}
                            className="text-sm text-slate-100 hover:text-cyan-400 transition-colors cursor-pointer text-left"
                          >
                            {order.customer_name}
                          </button>
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
                    {formatCurrency(order.total_buy_price || 0)}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-100">
                    {formatCurrency(order.total_sell_price || 0)}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-cyan-400">
                    {formatCurrency(order.gross_profit || 0)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        onClick={(e) => onViewInvoice(order, e)}
                        title="View Invoice"
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
                      </button>
                      <button
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        onClick={(e) => onEditInvoice(order, e)}
                        title="Edit Invoice"
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
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                        onClick={(e) => onSendSms(order, e)}
                        disabled={isSendingSms === order.id}
                        title="Send SMS"
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
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        onClick={(e) => onDeleteOrder(order, e)}
                        title="Delete Order"
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
      </div>
    </>
  );
};

export default React.memo(OrdersList, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.orders === nextProps.orders &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.isSearching === nextProps.isSearching &&
    prevProps.isSendingSms === nextProps.isSendingSms
    // Don't compare functions as they should be memoized with useCallback
  );
});
