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
      setError("পরিমাণ আপডেট করা যায়নি। আবার চেষ্টা করুন।");
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
      setError("দাম আপডেট করা যায়নি। আবার চেষ্টা করুন।");
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
      setError("অর্ডার আপডেট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const { subtotal, discountAmount, vatAmount, total } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-head">
          <div>
            <h2 className="modal-title">
              অর্ডার এডিট — #{order.order_number || order.id}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              অর্ডারের তথ্য আর কাস্টমারের তথ্য বদলান
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="বন্ধ করুন"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <div className="section-title">কাস্টমারের তথ্য</div>

              <div>
                <label className="label">কাস্টমারের নাম</label>
                <input
                  type="text"
                  value={orderData.customer_name}
                  onChange={(e) =>
                    handleInputChange("customer_name", e.target.value)
                  }
                  className="input"
                  placeholder="কাস্টমারের নাম লিখুন"
                />
              </div>

              <div>
                <label className="label">ফোন নম্বর</label>
                <input
                  type="tel"
                  value={orderData.customer_phone}
                  onChange={(e) =>
                    handleInputChange("customer_phone", e.target.value)
                  }
                  className="input"
                  placeholder="ফোন নম্বর লিখুন"
                />
              </div>

              <div>
                <label className="label">ইমেইল</label>
                <input
                  type="email"
                  value={orderData.customer_email}
                  onChange={(e) =>
                    handleInputChange("customer_email", e.target.value)
                  }
                  className="input"
                  placeholder="ইমেইল লিখুন"
                />
              </div>

              <div>
                <label className="label">ঠিকানা</label>
                <textarea
                  value={orderData.customer_address}
                  onChange={(e) =>
                    handleInputChange("customer_address", e.target.value)
                  }
                  rows={3}
                  className="textarea"
                  placeholder="কাস্টমারের ঠিকানা লিখুন"
                />
              </div>

              <div>
                <label className="label">প্রতিষ্ঠান</label>
                <input
                  type="text"
                  value={orderData.customer_company}
                  onChange={(e) =>
                    handleInputChange("customer_company", e.target.value)
                  }
                  className="input"
                  placeholder="প্রতিষ্ঠানের নাম লিখুন"
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3">
              <div className="section-title">অর্ডারের তথ্য</div>

              <div>
                <label className="label">অবস্থা</label>
                <select
                  value={orderData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="select"
                >
                  <option value="draft">ড্রাফট</option>
                  <option value="pending">পেন্ডিং</option>
                  <option value="confirmed">কনফার্ম</option>
                  <option value="processing">চলছে</option>
                  <option value="completed">কমপ্লিট</option>
                  <option value="cancelled">বাতিল</option>
                  <option value="refunded">টাকা ফেরত</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ডিসকাউন্ট (%)</label>
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
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">ভ্যাট (%)</label>
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
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">নোট</label>
                <textarea
                  value={orderData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="textarea"
                  placeholder="অর্ডারের নোট লিখুন…"
                />
              </div>

              {/* Financial Summary */}
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="section-title">টাকার হিসাব</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">সাবটোটাল</span>
                    <span className="num text-slate-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        ডিসকাউন্ট ({orderData.discount_percentage}%)
                      </span>
                      <span className="money-neg">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}
                  {vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        ভ্যাট ({orderData.vat_percentage}%)
                      </span>
                      <span className="num text-slate-900">
                        {formatCurrency(vatAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                    <span className="text-slate-900">মোট</span>
                    <span className="num text-cyan-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-6">
            <div className="section-title">অর্ডারের প্রোডাক্ট</div>

            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>প্রোডাক্ট</th>
                    <th className="cell-num">পরিমাণ</th>
                    <th className="cell-num">দাম</th>
                    <th className="cell-num">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-strong">{item.product_name}</div>
                        {item.variant_details && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.variant_details}
                          </div>
                        )}
                      </td>
                      <td className="cell-num">
                        <div className="row-actions">
                          <button
                            onClick={() =>
                              handleItemQuantityChange(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            aria-label="পরিমাণ কমান"
                          >
                            −
                          </button>
                          <span className="w-8 text-center num text-slate-900 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleItemQuantityChange(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            aria-label="পরিমাণ বাড়ান"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="cell-num">
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
                          className="input w-24 text-right"
                          aria-label="দাম"
                        />
                      </td>
                      <td className="cell-num cell-strong">
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
        <div className="modal-foot">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn btn-primary"
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
            {isLoading ? "সেভ হচ্ছে…" : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
