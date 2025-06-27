'use client';

import React from 'react';

interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  created_at: string;
  updated_at: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  total_orders: number;
  total_amount: number;
}

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  paymentForm: {
    date: string;
    amount: string;
    method: 'cash' | 'card' | 'bank_transfer' | 'check';
    status: 'pending' | 'completed' | 'failed';
    reference: string;
    notes: string;
    proofFile?: File | null;
    proofUrl?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export default function CreatePaymentModal({
  isOpen,
  onClose,
  supplier,
  paymentForm,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  loading
}: CreatePaymentModalProps) {
  if (!isOpen || !supplier) return null;

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'check':
        return '📝';
      default:
        return '💳';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto scrollbar-hide">
      <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-6 w-full max-w-md my-auto">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-slate-100">Create Payment</h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Supplier Info */}
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 mb-4">
          <h5 className="text-sm font-medium text-slate-200 mb-1">Supplier</h5>
          <p className="text-slate-300 text-sm">{supplier.name}</p>
          <p className="text-slate-400 text-xs">{supplier.address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              name="date"
              value={paymentForm.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={paymentForm.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter payment amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Method *
            </label>
            <select
              name="method"
              value={paymentForm.method}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            >
              <option value="cash">
                {getPaymentMethodIcon('cash')} Cash
              </option>
              <option value="card">
                {getPaymentMethodIcon('card')} Card
              </option>
              <option value="bank_transfer">
                {getPaymentMethodIcon('bank_transfer')} Bank Transfer
              </option>
              <option value="check">
                {getPaymentMethodIcon('check')} Check
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Status *
            </label>
            <select
              name="status"
              value={paymentForm.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              name="reference"
              value={paymentForm.reference}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter reference number (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={paymentForm.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
              placeholder="Additional notes (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Proof / Receipt
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer"
              />
              {paymentForm.proofFile && (
                <div className="flex items-center gap-2 p-2 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-300 text-sm">{paymentForm.proofFile.name}</span>
                  <span className="text-slate-400 text-xs">
                    ({(paymentForm.proofFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Upload receipt, invoice, or payment proof (Images and PDF files accepted)
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Create Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
