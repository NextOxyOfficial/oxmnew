"use client";

import { OrderForm, PaymentEntry } from "../types";

type Props = {
  orderForm: OrderForm;
  setOrderForm: (updater: (prev: OrderForm) => OrderForm) => void;
  formatCurrency: (v: number) => string;
};

export default function PaymentsSection({ orderForm, setOrderForm, formatCurrency }: Props) {
  const addPayment = () => {
    const newPayment: PaymentEntry = { id: Date.now().toString(), method: "Cash", amount: 0 };
    setOrderForm((prev) => ({ ...prev, payments: [...prev.payments, newPayment] }));
  };

  const removePayment = (id: string) => {
    setOrderForm((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }));
  };

  const updatePayment = (id: string, field: keyof PaymentEntry, value: string | number) => {
    setOrderForm((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  return (
    <div className="plane-section">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="section-title mb-0">টাকা জমার হিসাব</div>
        <button onClick={addPayment} className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          পেমেন্ট যোগ করুন
        </button>
      </div>

      {orderForm.payments.length > 0 && (
        <div className="space-y-2">
          {orderForm.payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-2">
              <select
                value={payment.method}
                onChange={(e) => updatePayment(payment.id, "method", e.target.value as PaymentEntry["method"])}
                className="select w-auto"
                aria-label="পেমেন্ট টাইপ"
              >
                <option value="Cash">ক্যাশ</option>
                <option value="Cheque">চেক</option>
                <option value="Bkash">বিকাশ</option>
                <option value="Nagad">নগদ</option>
                <option value="Bank">ব্যাংক</option>
              </select>
              <input
                type="number"
                value={payment.amount === 0 ? "" : payment.amount}
                onChange={(e) => updatePayment(payment.id, "amount", parseFloat(e.target.value) || 0)}
                className="input flex-1 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                min="0"
                step="0.01"
                aria-label="জমার পরিমাণ"
              />
              {orderForm.payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePayment(payment.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                  title="পেমেন্টটি বাদ দিন"
                  aria-label="পেমেন্টটি বাদ দিন"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {orderForm.payments.length > 0 && (
        <div className="space-y-1 pt-3 mt-3 border-t border-slate-200 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">মোট জমা</span>
            <span className="money-pos">{formatCurrency(orderForm.total_payment_received)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">বাকি আছে</span>
            <span className={orderForm.remaining_balance <= 0 ? "money-pos" : "money-neg"}>
              {formatCurrency(orderForm.remaining_balance)}
            </span>
          </div>
        </div>
      )}

      {orderForm.payments.length === 0 && (
        <p className="text-center py-3 text-slate-500 text-sm">
          এখনো কোনো পেমেন্ট যোগ করা হয়নি। টাকা জমা লিখতে &quot;পেমেন্ট যোগ করুন&quot; চাপুন।
        </p>
      )}
    </div>
  );
}
