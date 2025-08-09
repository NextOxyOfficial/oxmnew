"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Order, OrderItem } from "@/types/order";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EditOrderData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_company: string;
  notes: string;
  discount_percentage: number;
  vat_percentage: number;
  status: string;
  items: OrderItem[];
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const formatCurrency = useCurrencyFormatter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<EditOrderData>({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_company: "",
    notes: "",
    discount_percentage: 0,
    vat_percentage: 0,
    status: "pending",
    items: [],
  });

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const orderId = params.id as string;
        if (!orderId) {
          setError("Order ID is required");
          setIsLoadingOrder(false);
          return;
        }
        const fetchedOrder = await ApiService.getOrder(parseInt(orderId));
        setOrder(fetchedOrder);

        // Initialize form data
        setOrderData({
          customer_name: fetchedOrder.customer_name || "",
          customer_phone: fetchedOrder.customer_phone || "",
          customer_email: fetchedOrder.customer_email || "",
          customer_address: fetchedOrder.customer_address || "",
          customer_company: fetchedOrder.customer_company || "",
          notes: fetchedOrder.notes || "",
          discount_percentage: fetchedOrder.discount_percentage || 0,
          vat_percentage: fetchedOrder.vat_percentage || 0,
          status: fetchedOrder.status || "pending",
          items: fetchedOrder.items || [],
        });
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to load order. Please try again.");
      } finally {
        setIsLoadingOrder(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

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
    if (newQuantity < 1 || !order) return;

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
                total_price: item.unit_price * newQuantity,
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
    if (newPrice < 0 || !order) return;

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
    const discountAmount = (subtotal * orderData.discount_percentage) / 100;
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
    if (!order) return;

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
        discount_percentage: orderData.discount_percentage,
        vat_percentage: orderData.vat_percentage,
        status: orderData.status as
          | "pending"
          | "processing"
          | "completed"
          | "cancelled"
          | "refunded",
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        vat_amount: totals.vatAmount,
        total_amount: totals.total,
      };

      await ApiService.updateOrder(order.id, updateData);

      // Redirect back to orders page with success message
      router.push("/dashboard/orders?updated=true");
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/orders");
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl  px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-slate-300">
              <svg
                className="w-6 h-6 animate-spin"
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
              Loading order...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl  px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100 mb-4">
              Order Not Found
            </h1>
            <p className="text-slate-400 mb-6">
              The order you&apos;re looking for doesn&apos;t exist.
            </p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { subtotal, discountAmount, vatAmount, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl  px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - matching add products style */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-200"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Edit Order #{order.order_number || order.id}
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Modify order details and customer information
              </p>
            </div>
          </div>
        </div>

        {/* Form Container - matching add products style */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="sm:p-4 p-2">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">
                    Customer Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={orderData.customer_name}
                      onChange={(e) =>
                        handleInputChange("customer_name", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={orderData.customer_phone}
                      onChange={(e) =>
                        handleInputChange("customer_phone", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={orderData.customer_email}
                      onChange={(e) =>
                        handleInputChange("customer_email", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Address
                    </label>
                    <textarea
                      value={orderData.customer_address}
                      onChange={(e) =>
                        handleInputChange("customer_address", e.target.value)
                      }
                      rows={3}
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-vertical"
                      placeholder="Enter customer address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      value={orderData.customer_company}
                      onChange={(e) =>
                        handleInputChange("customer_company", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
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
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Status
                    </label>
                    <select
                      value={orderData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
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
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
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
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={orderData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      rows={3}
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-vertical"
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
                        <span className="text-cyan-400 text-lg">
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
                  <div className="overflow-x-auto">
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
                          <tr
                            key={item.id}
                            className="border-t border-slate-700/30"
                          >
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
                                  className="w-7 h-7 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-sm"
                                >
                                  −
                                </button>
                                <span className="w-10 text-center text-slate-100 font-medium text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleItemQuantityChange(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-7 h-7 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-sm"
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
                                className="w-20 bg-slate-800/50 border border-slate-700/50 text-white text-sm rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
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

              {/* Action Buttons - matching add products style */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                    isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {isLoading ? (
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving Changes...
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
