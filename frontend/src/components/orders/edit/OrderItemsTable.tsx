"use client";

import { OrderForm, OrderItem } from "../types";
import { Product } from "@/types/product";

type Props = {
  orderForm: OrderForm;
  setOrderForm: (updater: (prev: OrderForm) => OrderForm) => void;
  products: Product[];
  canIncreaseQuantity: (item: OrderItem) => boolean;
  formatCurrency: (v: number) => string;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemUnitPrice: (id: string, price: number) => void;
};

export default function OrderItemsTable({
  orderForm,
  setOrderForm,
  products,
  canIncreaseQuantity,
  formatCurrency,
  removeItem,
  updateItemQuantity,
  updateItemUnitPrice,
}: Props) {
  if (orderForm.items.length === 0) {
    return (
      <div className="empty">
        <p className="text-slate-900 font-medium mb-1">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি</p>
        <p>নিচের ঘর থেকে প্রোডাক্ট খুঁজে অর্ডারে যোগ করুন</p>
      </div>
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>প্রোডাক্ট</th>
            <th className="cell-num">পরিমাণ</th>
            <th className="cell-num">কেনা দাম</th>
            <th className="cell-num">বিক্রির দাম</th>
            <th className="cell-num">মোট</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orderForm.items.map((item) => {
            const product = products.find((p) => p.id === item.product);
            return (
              <tr key={item.id}>
                <td>
                  <div className="cell-strong">{item.product_name}</div>
                  {item.variant_details && (
                    <div className="text-xs text-slate-500 mt-0.5">{item.variant_details}</div>
                  )}
                  {product?.has_variants && product.variants?.length ? (
                    <div className="mt-2">
                      <select
                        value={item.variant || ""}
                        onChange={(e) => {
                          const variantId = e.target.value ? parseInt(e.target.value) : undefined;
                          const selectedVariant = product.variants?.find((v) => v.id === variantId);
                          const newUnitPrice = selectedVariant ? selectedVariant.sell_price || 0 : product.sell_price || 0;
                          const newBuyPrice = selectedVariant ? selectedVariant.buy_price || 0 : product.buy_price || 0;

                          setOrderForm((prev) => ({
                            ...prev,
                            items: prev.items.map((orderItem) =>
                              orderItem.id === item.id
                                ? {
                                    ...orderItem,
                                    variant: variantId,
                                    unit_price: newUnitPrice,
                                    buy_price: newBuyPrice,
                                    total: orderItem.quantity * newUnitPrice,
                                    variant_details: selectedVariant
                                      ? `${selectedVariant.color} - ${selectedVariant.size}${selectedVariant.custom_variant ? ` - ${selectedVariant.custom_variant}` : ""}`
                                      : undefined,
                                  }
                                : orderItem
                            ),
                          }));
                        }}
                        className="select"
                        aria-label="ভ্যারিয়েন্ট সিলেক্ট করুন"
                      >
                        <option value="">ভ্যারিয়েন্ট সিলেক্ট করুন</option>
                        {product?.variants?.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.color} - {variant.size}
                            {variant.custom_variant && ` - ${variant.custom_variant}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </td>

                <td className="cell-num">
                  <div className="row-actions">
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                      aria-label="পরিমাণ কমান"
                    >
                      −
                    </button>
                    <span className="w-8 text-center num text-slate-900 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      disabled={!canIncreaseQuantity(item)}
                      className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={canIncreaseQuantity(item) ? "পরিমাণ বাড়ান" : "স্টকে আর নেই"}
                      aria-label="পরিমাণ বাড়ান"
                    >
                      +
                    </button>
                  </div>
                </td>

                <td className="cell-num">{formatCurrency(item.buy_price || 0)}</td>

                <td className="cell-num">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItemUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                    className="input w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                    step="0.01"
                    aria-label="বিক্রির দাম"
                  />
                </td>

                <td className="cell-num cell-strong">{formatCurrency(item.total)}</td>

                <td className="text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                    title="প্রোডাক্টটা বাদ দিন"
                    aria-label="প্রোডাক্টটা বাদ দিন"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
