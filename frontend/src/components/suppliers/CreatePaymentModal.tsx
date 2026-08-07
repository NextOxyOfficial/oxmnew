'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

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
    <div className="modal-backdrop">
      <div className="modal">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="modal-head">
            <h2 className="modal-title">নতুন পেমেন্ট করুন</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="modal-body min-h-0 flex-1">
            <div className="mb-4">
              <div className="section-title">সাপ্লায়ার</div>
              <p className="text-sm text-slate-900">{supplier.name}</p>
              <p className="text-xs text-slate-500">{supplier.address}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">পেমেন্টের তারিখ *</label>
                <input
                  type="date"
                  name="date"
                  value={paymentForm.date}
                  onChange={handleInputChange}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label">টাকার পরিমাণ *</label>
                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="কত টাকা দিচ্ছেন লিখুন"
                />
              </div>

              <div>
                <label className="label">পেমেন্ট টাইপ *</label>
                <select
                  name="method"
                  value={paymentForm.method}
                  onChange={handleInputChange}
                  required
                  className="select"
                >
                  <option value="cash">
                    {getPaymentMethodIcon('cash')} ক্যাশ
                  </option>
                  <option value="card">
                    {getPaymentMethodIcon('card')} কার্ড
                  </option>
                  <option value="bank_transfer">
                    {getPaymentMethodIcon('bank_transfer')} ব্যাংক ট্রান্সফার
                  </option>
                  <option value="check">
                    {getPaymentMethodIcon('check')} চেক
                  </option>
                </select>
              </div>

              <div>
                <label className="label">পেমেন্টের অবস্থা *</label>
                <select
                  name="status"
                  value={paymentForm.status}
                  onChange={handleInputChange}
                  required
                  className="select"
                >
                  <option value="pending">বাকি আছে</option>
                  <option value="completed">শেষ</option>
                  <option value="failed">হয়নি</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">রেফারেন্স নম্বর</label>
                <input
                  type="text"
                  name="reference"
                  value={paymentForm.reference}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="রেফারেন্স নম্বর লিখুন (না দিলেও চলবে)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">নোট</label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="textarea resize-none"
                  placeholder="বাড়তি কিছু লিখতে চাইলে (না দিলেও চলবে)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">পেমেন্টের প্রমাণ / রসিদ</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="input"
                />
                {paymentForm.proofFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="truncate">{paymentForm.proofFile.name}</span>
                    <span className="text-xs text-slate-500">
                      ({(paymentForm.proofFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  রসিদ, ইনভয়েস বা পেমেন্টের প্রমাণ আপলোড করুন (ছবি আর PDF চলবে)
                </p>
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'সেভ হচ্ছে…' : 'পেমেন্ট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
