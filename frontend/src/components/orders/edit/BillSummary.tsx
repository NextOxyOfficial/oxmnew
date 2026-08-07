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
    <div className="plane-section">
      <div className="section-title">বিলের হিসাব</div>

      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-slate-500">সাবটোটাল</span>
          <span className="num text-slate-900">{formatCurrency(orderForm.subtotal)}</span>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-slate-500">ডিসকাউন্ট</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOrderForm(prev => ({ ...prev, discount_type: "percentage", discount_flat_amount: 0 }))}
                className={`btn btn-sm ${orderForm.discount_type === "percentage" ? "btn-primary" : "btn-ghost"}`}
                aria-label="শতকরা ডিসকাউন্ট"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setOrderForm(prev => ({ ...prev, discount_type: "flat", discount_percentage: 0 }))}
                className={`btn btn-sm ${orderForm.discount_type === "flat" ? "btn-primary" : "btn-ghost"}`}
                aria-label="সরাসরি টাকায় ডিসকাউন্ট"
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
                  className="input w-16 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder=""
                  min="0"
                  max="100"
                  step="0.01"
                  aria-label="ডিসকাউন্টের শতকরা হার"
                />
                <span className="text-slate-500">%</span>
              </>
            ) : (
              <>
                <input
                  type="number"
                  value={orderForm.discount_flat_amount === 0 ? "" : orderForm.discount_flat_amount}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, discount_flat_amount: parseFloat(e.target.value) || 0 }))}
                  className="input w-20 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  aria-label="ডিসকাউন্টের টাকা"
                />
                <span className="text-slate-500">{currencySymbol}</span>
              </>
            )}

            <span className="money-neg">-{formatCurrency(orderForm.discount_amount)}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-slate-500">ভ্যাট</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={orderForm.vat_percentage === 0 ? "" : orderForm.vat_percentage}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, vat_percentage: parseFloat(e.target.value) || 0 }))}
              className="input w-16 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
              aria-label="ভ্যাটের শতকরা হার"
            />
            <span className="text-slate-500">%</span>
            <span className="num text-slate-900">{formatCurrency(orderForm.vat_amount)}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-slate-500">বাকি</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={orderForm.due_amount === 0 ? "" : orderForm.due_amount}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, due_amount: parseFloat(e.target.value) || 0 }))}
              className="input w-20 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              min="0"
              step="0.01"
              aria-label="বাকির পরিমাণ"
            />
            <span className="num text-slate-900">{formatCurrency(orderForm.due_amount)}</span>
          </div>
        </div>

        {orderForm.previous_due > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-slate-500">আগের বাকি</span>
              <span className="money-neg">{formatCurrency(orderForm.previous_due)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="applyPreviousDue"
                checked={orderForm.apply_previous_due_to_total}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, apply_previous_due_to_total: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-200 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="applyPreviousDue" className="text-xs text-slate-500">
                আগের বাকিটা এই অর্ডারের মোটের সাথে যোগ করুন
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <span className="font-semibold text-slate-900">মোট</span>
          <span className="num text-cyan-600 font-semibold text-lg">{formatCurrency(orderForm.total)}</span>
        </div>
      </div>
    </div>
  );
}
