'use client';

import React from 'react';

interface Purchase {
  id: number;
  date: string;
  supplier: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  products: string[];
}

interface PurchaseHistoryTabProps {
  purchases: Purchase[];
  selectedSupplier: string;
  setSelectedSupplier: (supplier: string) => void;
  getFilteredPurchases: () => Purchase[];
  getUniqueSuppliers: () => string[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

export default function PurchaseHistoryTab({
  purchases,
  selectedSupplier,
  setSelectedSupplier,
  getFilteredPurchases,
  getUniqueSuppliers,
  formatCurrency,
  formatDate,
  getStatusColor
}: PurchaseHistoryTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-slate-100 mb-4">Purchase History</h4>
        {/* Filter by Supplier */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-300">Filter by Supplier:</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm"
            >
              <option value="all">All Suppliers</option>
              {getUniqueSuppliers().map((supplier) => (
                <option key={supplier} value={supplier} className="bg-slate-800">
                  {supplier}
                </option>
              ))}
            </select>

            {selectedSupplier !== 'all' && (
              <button
                onClick={() => setSelectedSupplier('all')}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-slate-400">
            Showing {getFilteredPurchases().length} of {purchases.length} purchases
            {selectedSupplier !== 'all' && (
              <span className="ml-2 text-cyan-400">
                | Total: {formatCurrency(getFilteredPurchases().reduce((sum, p) => sum + p.amount, 0))}
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
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Products</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Amount</th>
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredPurchases().map((purchase) => (
                <tr key={purchase.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-100 text-sm">{formatDate(purchase.date)}</td>
                  <td className="py-3 px-4 text-slate-100 text-sm">{purchase.supplier}</td>
                  <td className="py-3 px-4">
                    <div className="text-slate-300 text-sm">
                      {purchase.products.slice(0, 2).join(', ')}
                      {purchase.products.length > 2 && ` +${purchase.products.length - 2} more`}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-100 font-medium text-sm">{formatCurrency(purchase.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
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
