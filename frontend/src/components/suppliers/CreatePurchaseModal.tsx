'use client';

import React from 'react';

interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  created_date: string;
  total_orders: number;
  total_amount: number;
}

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  purchaseForm: {
    date: string;
    amount: string;
    status: 'pending' | 'completed' | 'cancelled';
    products: string;
    notes: string;
    proofFile?: File | null;
    proofUrl?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export default function CreatePurchaseModal({
  isOpen,
  onClose,
  supplier,
  purchaseForm,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  loading
}: CreatePurchaseModalProps) {
  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto scrollbar-hide">
      <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-6 w-full max-w-md my-auto">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-slate-100">Create Purchase Order</h4>
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
              Purchase Date *
            </label>
            <input
              type="date"
              name="date"
              value={purchaseForm.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Total Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={purchaseForm.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={purchaseForm.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Products/Items *
            </label>
            <textarea
              name="products"
              value={purchaseForm.products}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
              placeholder="Enter products/items (e.g., Laptops, Keyboards, Mice)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={purchaseForm.notes}
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
              {purchaseForm.proofFile && (
                <div className="flex items-center gap-2 p-2 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-300 text-sm">{purchaseForm.proofFile.name}</span>
                  <span className="text-slate-400 text-xs">
                    ({(purchaseForm.proofFile.size / 1024 / 1024).toFixed(2)} MB)
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
              {loading ? 'Creating...' : 'Create Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
