'use client';

import { useState } from 'react';
import { ApiService } from '@/lib/api';

interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
}

interface PaymentMethodsTabProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: (paymentMethods: PaymentMethod[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  loading: boolean;
  onDeleteClick: (paymentMethod: PaymentMethod) => void;
}

export default function PaymentMethodsTab({ paymentMethods, setPaymentMethods, showNotification, loading, onDeleteClick }: PaymentMethodsTabProps) {
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) return;

    try {
      const response = await ApiService.createPaymentMethod({
        name: newPaymentMethod.trim(),
        is_active: true
      });

      const newPaymentMethodItem = response.paymentMethod;
      setPaymentMethods([...paymentMethods, newPaymentMethodItem]);
      setNewPaymentMethod('');
      showNotification('success', 'পেমেন্ট মাধ্যম যোগ হয়ে গেছে!');
    } catch (error) {
      console.error('Error adding paymentMethod:', error);
      showNotification('error', error instanceof Error ? error.message : 'পেমেন্ট মাধ্যম যোগ করা গেল না');
    }
  };

  const togglePaymentMethod = async (id: number) => {
    try {
      await ApiService.togglePaymentMethod(id);
      setPaymentMethods(paymentMethods.map(paymentMethod =>
        paymentMethod.id === id ? { ...paymentMethod, is_active: !paymentMethod.is_active } : paymentMethod
      ));
      const updatedPaymentMethod = paymentMethods.find(pm => pm.id === id);
      showNotification('success', `পেমেন্ট মাধ্যম ${!updatedPaymentMethod?.is_active ? 'Active' : 'Inactive'} করা হয়েছে!`);
    } catch (error) {
      console.error('Error updating paymentMethod:', error);
      showNotification('error', error instanceof Error ? error.message : 'পেমেন্ট মাধ্যম বদলানো গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const handleDeleteClick = (paymentMethod: PaymentMethod) => {
    onDeleteClick(paymentMethod);
  };

  return (
    <>
      <div className="plane-section">
        <div className="section-title">নতুন পেমেন্ট মাধ্যম</div>
        <div className="flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            className="input"
            placeholder="পেমেন্ট মাধ্যমের নাম"
            aria-label="পেমেন্ট মাধ্যমের নাম"
            onKeyPress={(e) => e.key === 'Enter' && handleAddPaymentMethod()}
          />
          <button
            onClick={handleAddPaymentMethod}
            disabled={loading || !newPaymentMethod.trim()}
            className="btn btn-primary sm:w-auto"
          >
            যোগ করুন
          </button>
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">পেমেন্ট মাধ্যমের তালিকা</div>
        {paymentMethods.length === 0 ? (
          <div className="empty">এখনো কোনো পেমেন্ট মাধ্যম নেই। উপরে থেকে প্রথমটা যোগ করুন।</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((paymentMethod) => (
              <div
                key={paymentMethod.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
              >
                <button
                  className={`badge ${paymentMethod.is_active ? 'badge-success' : 'badge-muted'}`}
                  onClick={() => togglePaymentMethod(paymentMethod.id)}
                  title="Active/Inactive করতে চাপ দিন"
                >
                  {paymentMethod.is_active ? 'Active' : 'Inactive'}
                </button>
                <span className="whitespace-nowrap text-sm font-medium text-slate-900">{paymentMethod.name}</span>
                <button
                  onClick={() => handleDeleteClick(paymentMethod)}
                  className="text-slate-400 transition-colors hover:text-rose-600"
                  title="পেমেন্ট মাধ্যম ডিলিট করুন"
                  aria-label="পেমেন্ট মাধ্যম ডিলিট করুন"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
