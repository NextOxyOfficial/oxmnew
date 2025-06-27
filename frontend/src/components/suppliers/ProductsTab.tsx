'use client';

import React from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  last_ordered: string;
}

interface ProductsTabProps {
  products: Product[];
  selectedProductSupplier: string;
  setSelectedProductSupplier: (supplier: string) => void;
  getFilteredProducts: () => Product[];
  getUniqueSuppliersFromProducts: () => string[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export default function ProductsTab({
  products,
  selectedProductSupplier,
  setSelectedProductSupplier,
  getFilteredProducts,
  getUniqueSuppliersFromProducts,
  formatCurrency,
  formatDate
}: ProductsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-slate-100 mb-4">Products Owned</h4>
        {/* Filter by Supplier */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-300">Filter by Supplier:</label>
            <select
              value={selectedProductSupplier}
              onChange={(e) => setSelectedProductSupplier(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            >
              <option value="all">All Suppliers</option>
              {getUniqueSuppliersFromProducts().map((supplier) => (
                <option key={supplier} value={supplier} className="bg-slate-800">
                  {supplier}
                </option>
              ))}
            </select>

            {selectedProductSupplier !== 'all' && (
              <button
                onClick={() => setSelectedProductSupplier('all')}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-slate-400">
            Showing {getFilteredProducts().length} of {products.length} products
            {selectedProductSupplier !== 'all' && (
              <span className="ml-2 text-cyan-400">
                | Total Value: {formatCurrency(getFilteredProducts().reduce((sum, p) => sum + p.total_value, 0))}
              </span>
            )}
          </div>
        </div>

        {/* Products List - Improved Compact Design */}
        <div className="space-y-3">
          {getFilteredProducts().map((product) => (
            <div key={product.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                {/* Left side - Product Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-slate-100 font-medium text-sm">{product.name}</h5>
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded-md text-xs">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Supplier</span>
                      <p className="text-slate-100 font-medium">{product.supplier}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Unit Price</span>
                      <p className="text-slate-100 font-medium">{formatCurrency(product.unit_price)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Value</span>
                      <p className="text-cyan-300 font-medium">{formatCurrency(product.total_value)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Last Ordered</span>
                      <p className="text-slate-100 font-medium">{formatDate(product.last_ordered)}</p>
                    </div>
                  </div>
                </div>

                {/* Right side - Quantity Badge */}
                <div className="ml-6">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 px-3 py-2 rounded-lg text-center">
                    <div className="text-lg font-bold">{product.quantity}</div>
                    <div className="text-xs text-cyan-400">in stock</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {getFilteredProducts().length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-2">
                <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">
                {selectedProductSupplier !== 'all' 
                  ? `No products found for ${selectedProductSupplier}` 
                  : 'No products found'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
