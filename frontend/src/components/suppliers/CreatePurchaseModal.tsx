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
    proof_document?: string;
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
    <div className="modal-backdrop">
      <div className="modal">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="modal-head">
            <h2 className="modal-title">নতুন কেনাকাটা যোগ করুন</h2>
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
                <label className="label">কেনার তারিখ *</label>
                <input
                  type="date"
                  name="date"
                  value={purchaseForm.date}
                  onChange={handleInputChange}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label">সব মিলিয়ে টাকা *</label>
                <input
                  type="number"
                  name="amount"
                  value={purchaseForm.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="টাকার পরিমাণ লিখুন"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">অবস্থা *</label>
                <select
                  name="status"
                  value={purchaseForm.status}
                  onChange={handleInputChange}
                  required
                  className="select"
                >
                  <option value="pending">বাকি আছে</option>
                  <option value="completed">শেষ</option>
                  <option value="cancelled">বাতিল করা</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">কী কী প্রোডাক্ট *</label>
                <textarea
                  name="products"
                  value={purchaseForm.products}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="textarea resize-none"
                  placeholder="প্রোডাক্টের নাম লিখুন (যেমন: ল্যাপটপ, কীবোর্ড, মাউস)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">নোট</label>
                <textarea
                  name="notes"
                  value={purchaseForm.notes}
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
                {purchaseForm.proofFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="truncate">{purchaseForm.proofFile.name}</span>
                    <span className="text-xs text-slate-500">
                      ({(purchaseForm.proofFile.size / 1024 / 1024).toFixed(2)} MB)
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
              {loading ? 'সেভ হচ্ছে…' : 'কেনাকাটা যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
