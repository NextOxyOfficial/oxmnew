'use client';

import React from 'react';

interface Payment {
  id: number;
  date: string;
  supplier: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'check';
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  proofUrl?: string;
}

interface PaymentsTabProps {
  payments: Payment[];
  selectedPaymentSupplier: string;
  setSelectedPaymentSupplier: (supplier: string) => void;
  getFilteredPayments: () => Payment[];
  getUniqueSuppliersFromPayments: () => string[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  getPaymentMethodIcon: (method: string) => string;
}

export default function PaymentsTab({
  payments,
  selectedPaymentSupplier,
  setSelectedPaymentSupplier,
  getFilteredPayments,
  getUniqueSuppliersFromPayments,
  formatCurrency,
  formatDate,
  getStatusColor,
  getPaymentMethodIcon
}: PaymentsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-slate-100 mb-4">Payments</h4>
        {/* Filter by Supplier */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-300">Filter by Supplier:</label>
            <select
              value={selectedPaymentSupplier}
              onChange={(e) => setSelectedPaymentSupplier(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            >
              <option value="all">All Suppliers</option>
              {getUniqueSuppliersFromPayments().map((supplier) => (
                <option key={supplier} value={supplier} className="bg-slate-800">
                  {supplier}
                </option>
              ))}
            </select>

            {selectedPaymentSupplier !== 'all' && (
              <button
                onClick={() => setSelectedPaymentSupplier('all')}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-slate-400">
            Showing {getFilteredPayments().length} of {payments.length} payments
            {selectedPaymentSupplier !== 'all' && (
              <span className="ml-2 text-cyan-400">
                | Total: {formatCurrency(getFilteredPayments().reduce((sum, p) => sum + p.amount, 0))}
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Date</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Supplier</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Method</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Reference</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Amount</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Status</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Proof</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredPayments().map((payment) => (
                <tr key={payment.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-100 text-sm">{formatDate(payment.date)}</td>
                  <td className="py-3 px-4 text-slate-100 text-sm">{payment.supplier}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getPaymentMethodIcon(payment.method)}</span>
                      <span className="text-slate-300 capitalize text-sm">{payment.method.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-xs">{payment.reference}</td>
                  <td className="py-3 px-4 text-slate-100 font-medium text-sm">{formatCurrency(payment.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {payment.proofUrl ? (
                      <div className="flex items-center gap-2">
                        {payment.proofUrl.toLowerCase().includes('.pdf') ? (
                          <a
                            href={payment.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors text-xs cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF
                          </a>
                        ) : (
                          <button
                            onClick={() => window.open(payment.proofUrl, '_blank')}
                            className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors text-xs cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Image
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs">No proof</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
