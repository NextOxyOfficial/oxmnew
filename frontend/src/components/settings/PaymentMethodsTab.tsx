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
      showNotification('success', 'Payment method added successfully!');
    } catch (error) {
      console.error('Error adding payment method:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to add payment method');
    }
  };

  const togglePaymentMethod = async (id: number) => {
    try {
      await ApiService.togglePaymentMethod(id);
      setPaymentMethods(paymentMethods.map(paymentMethod => 
        paymentMethod.id === id ? { ...paymentMethod, is_active: !paymentMethod.is_active } : paymentMethod
      ));
      const updatedPaymentMethod = paymentMethods.find(pm => pm.id === id);
      showNotification('success', `Payment method ${!updatedPaymentMethod?.is_active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      showNotification('error', error instanceof Error ? error.message : 'Error updating payment method. Please try again.');
    }
  };

  const handleDeleteClick = (paymentMethod: PaymentMethod) => {
    onDeleteClick(paymentMethod);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          {/* Add Payment Method */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4">Add New Payment Method</h4>
            <div className="flex gap-3 max-w-md">
              <input
                type="text"
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                placeholder="Payment method name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddPaymentMethod()}
              />
              <button
                onClick={handleAddPaymentMethod}
                disabled={loading || !newPaymentMethod.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Payment Methods List */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4">Payment Methods</h4>
            <div className="max-w-2xl">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No payment methods found. Add your first payment method above.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {paymentMethods.map((paymentMethod) => (
                    <div
                      key={paymentMethod.id}
                      className="flex items-center gap-2 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    >
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${
                          paymentMethod.is_active
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-400/30 hover:bg-gray-500/30'
                        }`}
                        onClick={() => togglePaymentMethod(paymentMethod.id)}
                        title="Click to toggle active/inactive status"
                      >
                        {paymentMethod.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm font-medium text-white whitespace-nowrap">{paymentMethod.name}</span>
                      <button
                        onClick={() => handleDeleteClick(paymentMethod)}
                        className="p-1.5 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 border border-red-400/30 transition-all duration-200 cursor-pointer"
                        title="Delete payment method"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
