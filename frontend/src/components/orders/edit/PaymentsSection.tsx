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
    <div className="space-y-3 pt-3 border-t border-slate-700/30 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 font-medium text-sm">Payment Information</span>
        <button onClick={addPayment} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Payment
        </button>
      </div>

      {orderForm.payments.length > 0 && (
        <div className="space-y-2">
          {orderForm.payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-2">
              <select
                value={payment.method}
                onChange={(e) => updatePayment(payment.id, "method", e.target.value as PaymentEntry["method"])}
                className="bg-slate-800/50 border border-slate-700/50 text-white text-sm rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              >
                <option value="Cash" className="bg-slate-800">Cash</option>
                <option value="Cheque" className="bg-slate-800">Cheque</option>
                <option value="Bkash" className="bg-slate-800">Bkash</option>
                <option value="Nagad" className="bg-slate-800">Nagad</option>
                <option value="Bank" className="bg-slate-800">Bank</option>
              </select>
              <input
                type="number"
                value={payment.amount === 0 ? "" : payment.amount}
                onChange={(e) => updatePayment(payment.id, "amount", parseFloat(e.target.value) || 0)}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {orderForm.payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePayment(payment.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20"
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
        <div className="space-y-1 pt-2 border-t border-slate-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Received:</span>
            <span className="text-green-400">{formatCurrency(orderForm.total_payment_received)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Remaining Balance:</span>
            <span className={orderForm.remaining_balance <= 0 ? "text-green-400" : "text-amber-400"}>
              {formatCurrency(orderForm.remaining_balance)}
            </span>
          </div>
        </div>
      )}

      {orderForm.payments.length === 0 && (
        <div className="text-center py-3 text-slate-400 text-sm">No payments added yet. Click "Add Payment" to record a payment.</div>
      )}
    </div>
  );
}
