"use client";

import { OrderForm } from "../types";

type Props = {
  orderForm: OrderForm;
  setOrderForm: (updater: (prev: OrderForm) => OrderForm) => void;
  currencySymbol: string;
  formatCurrency: (v: number) => string;
};

export default function BillSummary({ orderForm, setOrderForm, currencySymbol, formatCurrency }: Props) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
      <div className="sm:p-4 p-2">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Bill Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Subtotal:</span>
            <span className="text-slate-100 text-sm">{formatCurrency(orderForm.subtotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Discount:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                <button
                  type="button"
                  onClick={() => setOrderForm(prev => ({ ...prev, discount_type: "percentage", discount_flat_amount: 0 }))}
                  className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                    orderForm.discount_type === "percentage"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50"
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setOrderForm(prev => ({ ...prev, discount_type: "flat", discount_percentage: 0 }))}
                  className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                    orderForm.discount_type === "flat"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50"
                  }`}
                >
                  {currencySymbol}
                </button>
              </div>

              {orderForm.discount_type === "percentage" ? (
                <>
                  <input
                    type="number"
                    value={orderForm.discount_percentage === 0 ? "" : orderForm.discount_percentage}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                    className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder=""
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="text-slate-400 text-sm">%</span>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    value={orderForm.discount_flat_amount === 0 ? "" : orderForm.discount_flat_amount}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, discount_flat_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-20 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-slate-400 text-sm">{currencySymbol}</span>
                </>
              )}

              <span className="text-slate-100 text-sm">-{formatCurrency(orderForm.discount_amount)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">VAT:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={orderForm.vat_percentage === 0 ? "" : orderForm.vat_percentage}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, vat_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="text-slate-400 text-sm">%</span>
              <span className="text-slate-100 text-sm">{formatCurrency(orderForm.vat_amount)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Due:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={orderForm.due_amount === 0 ? "" : orderForm.due_amount}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, due_amount: parseFloat(e.target.value) || 0 }))}
                className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <span className="text-slate-100 text-sm">{formatCurrency(orderForm.due_amount)}</span>
            </div>
          </div>

          {orderForm.previous_due > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Previous Due:</span>
                <span className="text-amber-400 text-sm">{formatCurrency(orderForm.previous_due)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyPreviousDue"
                  checked={orderForm.apply_previous_due_to_total}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, apply_previous_due_to_total: e.target.checked }))}
                  className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2 rounded"
                />
                <label htmlFor="applyPreviousDue" className="text-xs text-slate-400">
                  Add to total (include previous due in this order)
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
            <span className="text-slate-100 font-semibold">Total:</span>
            <span className="text-cyan-400 font-semibold text-lg">{formatCurrency(orderForm.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
