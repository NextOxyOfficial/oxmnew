'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Purchase {
  id: number;
  supplier: {
    id: number;
    name: string;
  };
  date: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  products: string;
  notes?: string;
  proof_document?: string;
  proof_url?: string;
  created_at: string;
  updated_at: string;
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
  onUpdatePurchase?: (purchaseId: number, updatedData: { status: 'pending' | 'completed' | 'cancelled' }) => Promise<void>;
  onDeletePurchase?: (purchaseId: number) => Promise<void>;
}

export default function PurchaseHistoryTab({
  purchases,
  selectedSupplier,
  setSelectedSupplier,
  getFilteredPurchases,
  getUniqueSuppliers,
  formatCurrency,
  formatDate,
  getStatusColor,
  onUpdatePurchase,
  onDeletePurchase
}: PurchaseHistoryTabProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuppliers = getUniqueSuppliers().filter(supplier =>
    supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSupplierSelect = (supplier: string) => {
    setSelectedSupplier(supplier);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleStatusUpdate = async (purchaseId: number, newStatus: 'pending' | 'completed' | 'cancelled') => {
    if (!onUpdatePurchase) return;
    
    setUpdating(true);
    try {
      await onUpdatePurchase(purchaseId, { status: newStatus });
      setEditingPurchaseId(null);
    } catch (error) {
      console.error('Failed to update purchase status:', error);
      // You might want to show an error notification here
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (purchaseId: number) => {
    if (!onDeletePurchase) return;
    
    try {
      await onDeletePurchase(purchaseId);
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      // Error handling is done in the parent component
    }
  };

  const downloadCSV = () => {
    const filteredData = getFilteredPurchases();
    const headers = ['Date', 'Supplier', 'Products', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(purchase => [
        formatDate(purchase.date),
        `"${purchase.supplier.name}"`,
        `"${purchase.products}"`,
        purchase.amount,
        purchase.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const filteredData = getFilteredPurchases();
    const currentDate = new Date().toLocaleDateString();
    const totalAmount = filteredData.reduce((sum, p) => sum + p.amount, 0);
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0891b2; padding-bottom: 15px; }
            .title { font-size: 24px; font-weight: bold; color: #0891b2; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #666; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #0891b2; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr:hover { background-color: #e0f2fe; }
            .amount { font-weight: bold; color: #059669; }
            .status { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .completed { background-color: #d1fae5; color: #065f46; }
            .pending { background-color: #fef3c7; color: #92400e; }
            .cancelled { background-color: #fee2e2; color: #991b1b; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Purchase History Report</div>
            <div class="subtitle">Generated on ${currentDate}</div>
          </div>
          <div class="summary">
            <strong>Summary:</strong> ${filteredData.length} purchases | Total Amount: ${formatCurrency(totalAmount)}
            ${selectedSupplier !== 'all' ? ` | Filtered by: ${selectedSupplier}` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(purchase => `
                <tr>
                  <td>${formatDate(purchase.date)}</td>
                  <td>${purchase.supplier.name}</td>
                  <td>${purchase.products}</td>
                  <td class="amount">${formatCurrency(purchase.amount)}</td>
                  <td><span class="status ${purchase.status}">${purchase.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            This report was generated automatically from the supplier management system.
          </div>
        </body>
      </html>
    `;

    // Open print dialog with the formatted content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-slate-100">Purchase History</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={downloadPDF}
              className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
        {/* Filter by Supplier */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              {/* ...existing dropdown code... */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer min-w-[200px] flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedSupplier === 'all' ? 'All Suppliers' : selectedSupplier}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-slate-700/50">
                    <input
                      type="text"
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleSupplierSelect('all')}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                        selectedSupplier === 'all' ? 'bg-slate-700/50 text-cyan-400' : 'text-slate-300'
                      }`}
                    >
                      All Suppliers
                    </button>
                    {filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier}
                        onClick={() => handleSupplierSelect(supplier)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                          selectedSupplier === supplier ? 'bg-slate-700/50 text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        {supplier}
                      </button>
                    ))}
                    {filteredSuppliers.length === 0 && searchTerm && (
                      <div className="px-3 py-2 text-sm text-slate-400">
                        No suppliers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedSupplier !== 'all' && (
              <button
                onClick={() => setSelectedSupplier('all')}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-slate-400">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span>Showing {getFilteredPurchases().length} of {purchases.length} purchases</span>
              {selectedSupplier !== 'all' && (
                <span className="text-cyan-400">
                  Total: {formatCurrency(getFilteredPurchases().reduce((sum, p) => sum + p.amount, 0))}
                </span>
              )}
            </div>
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
                <th className="text-left text-slate-300 font-medium py-3 px-4 text-sm">Proof</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredPurchases().map((purchase) => (
                <tr key={purchase.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 px-4 text-slate-100 text-sm">{formatDate(purchase.date)}</td>
                  <td className="py-3 px-4 text-slate-100 text-sm">{purchase.supplier.name}</td>
                  <td className="py-3 px-4">
                    <div className="text-slate-300 text-sm">
                      {purchase.products}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-100 font-medium text-sm">{formatCurrency(purchase.amount)}</td>
                  <td className="py-3 px-4">
                    {editingPurchaseId === purchase.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={purchase.status}
                          onChange={(e) => handleStatusUpdate(purchase.id, e.target.value as 'pending' | 'completed' | 'cancelled')}
                          disabled={updating}
                          className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => setEditingPurchaseId(null)}
                          disabled={updating}
                          className="p-1 text-slate-400 hover:text-slate-300 disabled:opacity-50"
                          title="Cancel"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onUpdatePurchase && (
                            <button
                              onClick={() => setEditingPurchaseId(purchase.id)}
                              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                              title="Edit status"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {onDeletePurchase && (
                            <button
                              onClick={() => handleDelete(purchase.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete purchase"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {purchase.proof_url ? (
                      <div className="flex items-center gap-2">
                        {purchase.proof_url.toLowerCase().includes('.pdf') ? (
                          <a
                            href={purchase.proof_url}
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
                            onClick={() => window.open(purchase.proof_url, '_blank')}
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
