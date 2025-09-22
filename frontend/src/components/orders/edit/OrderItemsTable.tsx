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
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-slate-300 mb-3">
        Items in Order ({orderForm.items.length})
      </h4>

      {orderForm.items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 14H6L5 9z" />
          </svg>
          <p>No items added yet</p>
          <p className="text-sm text-slate-500 mt-1">Use the form below to add items to your order</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-4 pb-2 border-b border-slate-700/30 mb-2">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Product</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Quantity</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Buy Price</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Sell Price</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Total</div>
          </div>

          <div className="space-y-2">
            {orderForm.items.map((item) => {
              const product = products.find((p) => p.id === item.product);
              return (
                <div key={item.id} className="grid grid-cols-5 gap-4 items-center py-3 px-2 hover:bg-slate-800/20 rounded-lg transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-slate-100 text-sm">{item.product_name}</div>
                    {item.variant_details && (
                      <div className="text-xs text-slate-400 mt-1">{item.variant_details}</div>
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
                          className="w-full bg-slate-700/50 border border-slate-600/50 text-white text-xs rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        >
                          <option value="" className="bg-slate-800">Select variant</option>
                          {product?.variants?.map((variant) => (
                            <option key={variant.id} value={variant.id} className="bg-slate-800">
                              {variant.color} - {variant.size}
                              {variant.custom_variant && ` - ${variant.custom_variant}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-xs">−</button>
                    <span className="w-8 text-center text-slate-100 font-medium text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      disabled={!canIncreaseQuantity(item)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors text-xs ${
                        canIncreaseQuantity(item)
                          ? "bg-slate-700/50 text-slate-300 hover:bg-slate-600 cursor-pointer"
                          : "bg-slate-800/30 text-slate-500 cursor-not-allowed"
                      }`}
                      title={canIncreaseQuantity(item) ? "Increase quantity" : "Maximum stock reached"}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-slate-300">{formatCurrency(item.buy_price || 0)}</div>
                  </div>

                  <div className="text-center">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItemUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-800/50 border border-slate-700/50 text-white text-sm text-center rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <div className="font-semibold text-slate-100 text-sm">{formatCurrency(item.total)}</div>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
