"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Order, OrderItem } from "@/types/order";
import { useEffect, useState } from "react";

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
}

interface EditOrderData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_company: string;
  notes: string;
  discount_type: "percentage" | "flat";
  discount_percentage: number;
  discount_flat_amount: number;
  vat_percentage: number;
  status: string;
  items: OrderItem[];
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const formatCurrency = useCurrencyFormatter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<EditOrderData>({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_company: "",
    notes: "",
    discount_type: "percentage",
    discount_percentage: 0,
    discount_flat_amount: 0,
    vat_percentage: 0,
    status: "pending",
    items: [],
  });

  // Initialize form data when order changes
  useEffect(() => {
    if (order) {
      setOrderData({
        customer_name: order.customer_name || "",
        customer_phone: order.customer_phone || "",
        customer_email: order.customer_email || "",
        customer_address: order.customer_address || "",
        customer_company: order.customer_company || "",
        notes: order.notes || "",
        discount_type: order.discount_type || "percentage",
        discount_percentage: order.discount_percentage || 0,
        discount_flat_amount: order.discount_flat_amount || 0,
        vat_percentage: order.vat_percentage || 0,
        status: order.status || "pending",
        items: order.items || [],
      });
    }
  }, [order]);

  const handleInputChange = (
    field: keyof EditOrderData,
    value: string | number
  ) => {
    setOrderData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemQuantityChange = async (
    itemId: number,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) return;

    try {
      // Update the item via API
      await ApiService.updateOrderItem(order.id, itemId, {
        quantity: newQuantity,
      });

      // Update local state
      setOrderData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                total_price: newQuantity * item.unit_price,
              }
            : item
        ),
      }));
    } catch (error) {
      console.error("Error updating item quantity:", error);
      setError("Failed to update item quantity. Please try again.");
    }
  };

  const handleItemPriceChange = async (itemId: number, newPrice: number) => {
    if (newPrice < 0) return;

    try {
      // Update the item via API
      await ApiService.updateOrderItem(order.id, itemId, {
        unit_price: newPrice,
      });

      // Update local state
      setOrderData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                unit_price: newPrice,
                total_price: item.quantity * newPrice,
              }
            : item
        ),
      }));
    } catch (error) {
      console.error("Error updating item price:", error);
      setError("Failed to update item price. Please try again.");
    }
  };

  const calculateTotals = () => {
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const discountAmount = orderData.discount_type === "percentage" 
      ? (subtotal * orderData.discount_percentage) / 100
      : orderData.discount_flat_amount;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = (afterDiscount * orderData.vat_percentage) / 100;
    const total = afterDiscount + vatAmount;

    return {
      subtotal,
      discountAmount,
      vatAmount,
      total,
    };
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const totals = calculateTotals();

      const updateData = {
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        customer_address: orderData.customer_address,
        customer_company: orderData.customer_company,
        notes: orderData.notes,
        discount_type: orderData.discount_type,
        discount_percentage: orderData.discount_percentage,
        discount_flat_amount: orderData.discount_flat_amount,
        vat_percentage: orderData.vat_percentage,
        status: orderData.status as any,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        vat_amount: totals.vatAmount,
        total_amount: totals.total,
      };

      const updatedOrder = await ApiService.updateOrder(order.id, updateData);

      // Handle item updates separately if needed
      // For now, we're only updating the main order data

      onOrderUpdated(updatedOrder);
      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const { subtotal, discountAmount, vatAmount, total } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-10">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-4xl w-full mb-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Edit Order #{order.order_number || order.id}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Modify order details and customer information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        {/* Modal Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">
                Customer Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={orderData.customer_name}
                  onChange={(e) =>
                    handleInputChange("customer_name", e.target.value)
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={orderData.customer_phone}
                  onChange={(e) =>
                    handleInputChange("customer_phone", e.target.value)
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={orderData.customer_email}
                  onChange={(e) =>
                    handleInputChange("customer_email", e.target.value)
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Address
                </label>
                <textarea
                  value={orderData.customer_address}
                  onChange={(e) =>
                    handleInputChange("customer_address", e.target.value)
                  }
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter customer address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={orderData.customer_company}
                  onChange={(e) =>
                    handleInputChange("customer_company", e.target.value)
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter company name"
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">
                Order Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={orderData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={orderData.discount_percentage}
                    onChange={(e) =>
                      handleInputChange(
                        "discount_percentage",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    VAT (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={orderData.vat_percentage}
                    onChange={(e) =>
                      handleInputChange(
                        "vat_percentage",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={orderData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Add order notes..."
                />
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">
                  Financial Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-slate-200">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Discount ({orderData.discount_percentage}%):
                      </span>
                      <span className="text-red-400">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}
                  {vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        VAT ({orderData.vat_percentage}%):
                      </span>
                      <span className="text-slate-200">
                        {formatCurrency(vatAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-700/50 pt-2 flex justify-between font-medium">
                    <span className="text-slate-200">Total:</span>
                    <span className="text-cyan-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2 mb-4">
              Order Items
            </h3>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-100">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-700/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {item.product_name}
                          </p>
                          {item.variant_details && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.variant_details}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              handleItemQuantityChange(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-xs"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-slate-100 font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleItemQuantityChange(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemPriceChange(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 bg-slate-800/50 border border-slate-700/50 text-white text-sm rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-cyan-400">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
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
            )}
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
