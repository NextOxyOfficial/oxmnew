import React, { useState } from 'react';
import { X, Package, DollarSign, TrendingUp, Plus, History, Edit, Palette, Ruler, Weight, AlertCircle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  cost: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image?: string;
  description?: string;
  supplier?: string;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

interface ProductVariant {
  id: number;
  color?: string;
  size?: string;
  weight?: number;
  weight_unit?: 'g' | 'kg' | 'lb' | 'oz';
  custom_variant?: string;
  stock: number;
  price_adjustment?: number;
  sku_suffix?: string;
}

interface StockEntry {
  id: number;
  quantity: number;
  type: 'add' | 'remove';
  reason: string;
  cost_per_unit?: number;
  total_cost?: number;
  notes?: string;
  variant_id?: number;
  variant_details?: string;
  created_at: string;
  created_by: string;
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (productId: number, stockData: {
    quantity: number;
    buy_price: number;
    sell_price: number;
    reason: string;
    notes?: string;
    variant_id?: number;
  }) => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddStock,
}) => {
  const [activeTab, setActiveTab] = useState<'addStock' | 'history'>('addStock');
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockForm, setStockForm] = useState({
    quantity: '',
    buy_price: '',
    sell_price: '',
    reason: 'restock',
    notes: '',
    variant_id: '',
  });

  // Mock stock history data - replace with actual API call
  const stockHistory: StockEntry[] = [
    {
      id: 1,
      quantity: 50,
      type: 'add',
      reason: 'Initial stock',
      cost_per_unit: 12.50,
      total_cost: 625.00,
      notes: 'First batch received from supplier',
      variant_details: 'Red, Size M',
      created_at: '2024-01-15T10:30:00Z',
      created_by: 'Admin User'
    },
    {
      id: 2,
      quantity: 25,
      type: 'add',
      reason: 'restock',
      cost_per_unit: 11.80,
      total_cost: 295.00,
      notes: 'Bulk discount applied',
      variant_details: 'Blue, Size L',
      created_at: '2024-01-20T14:15:00Z',
      created_by: 'John Doe'
    }
  ];

  if (!isOpen || !product) return null;

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStock(true);
    
    try {
      await onAddStock(product.id, {
        quantity: parseInt(stockForm.quantity),
        buy_price: parseFloat(stockForm.buy_price),
        sell_price: parseFloat(stockForm.sell_price),
        reason: stockForm.reason,
        notes: stockForm.notes || undefined,
        variant_id: stockForm.variant_id ? parseInt(stockForm.variant_id) : undefined,
      });
      
      setStockForm({
        quantity: '',
        buy_price: '',
        sell_price: '',
        reason: 'restock',
        notes: '',
        variant_id: '',
      });
      setActiveTab('addStock');
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400';
      case 'out_of_stock':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTotalStock = () => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((total, variant) => total + variant.stock, 0);
    }
    return product.stock;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-7xl bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl mx-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Product Details</h2>
                <p className="text-sm text-slate-400">Manage inventory and product information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Left Section - Product Info */}
            <div className="w-full lg:w-2/5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-900/50">
              {/* Product Image */}
              <div className="mb-6">
                <div className="w-full h-48 sm:h-56 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Basic Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-slate-400">SKU: {product.sku}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Category</p>
                    <p className="text-white font-medium">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Price</p>
                    <p className="text-white font-bold">${Number(product.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Cost</p>
                    <p className="text-white font-bold">${Number(product.cost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Total Stock</p>
                    <p className="text-cyan-400 font-bold">{getTotalStock()} units</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Supplier</p>
                    <p className="text-white font-medium">{product.supplier || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Created</p>
                    <span className="text-slate-400">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Updated</p>
                    <span className="text-slate-400">{new Date(product.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-sm">Variants</h4>
                    <div className="space-y-2">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              {variant.color && (
                                <div className="flex items-center space-x-2">
                                  <Palette className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-blue-400">{variant.color}</span>
                                </div>
                              )}
                              {variant.size && (
                                <div className="flex items-center space-x-2">
                                  <Ruler className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-green-400">{variant.size}</span>
                                </div>
                              )}
                              {variant.weight && (
                                <div className="flex items-center space-x-2">
                                  <Weight className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-purple-400">{variant.weight}{variant.weight_unit}</span>
                                </div>
                              )}
                              {variant.custom_variant && (
                                <span className="text-sm text-orange-400">{variant.custom_variant}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-cyan-400 text-sm">
                                {variant.stock} units
                              </div>
                              {variant.sku_suffix && (
                                <div className="text-xs text-slate-500">
                                  {product.sku}-{variant.sku_suffix}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {product.description && (
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-sm">Description</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Tabs */}
            <div className="w-full lg:w-3/5 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-700/50 bg-slate-800/30">
                <button
                  onClick={() => setActiveTab('addStock')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'addStock'
                      ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Stock</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'history'
                      ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-4 sm:p-6">
                {activeTab === 'addStock' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-cyan-400" />
                        Add Stock
                      </h3>
                    </div>

                    <form onSubmit={handleStockSubmit} className="space-y-4">
                      {/* QTY to Add */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          QTY To Add *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={stockForm.quantity}
                          onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                          placeholder="Enter quantity to add"
                        />
                      </div>

                      {/* Buy and Sell Price Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Buy Price */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Buy Price per Unit *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={stockForm.buy_price}
                              onChange={(e) => setStockForm({ ...stockForm, buy_price: e.target.value })}
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Sell Price with Profit */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Sell Price per Unit *
                          </label>
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={stockForm.sell_price}
                                onChange={(e) => setStockForm({ ...stockForm, sell_price: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                                placeholder="0.00"
                              />
                            </div>
                            {/* Profit Display */}
                            {stockForm.buy_price && stockForm.sell_price && (
                              <div className="text-right min-w-[80px]">
                                {(() => {
                                  const profit = parseFloat(stockForm.sell_price) - parseFloat(stockForm.buy_price);
                                  return (
                                    <p className={`text-sm font-bold ${profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                                      {profit > 0 ? '+' : profit < 0 ? '-' : ''}${Math.abs(profit).toFixed(2)}
                                    </p>
                                  );
                                })()}
                                <p className="text-xs text-slate-500">profit</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Variant Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Product Variant
                        </label>
                        <select
                          value={stockForm.variant_id}
                          onChange={(e) => setStockForm({ ...stockForm, variant_id: e.target.value })}
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-pointer"
                        >
                          <option value="" className="bg-slate-800">
                            {product.variants && product.variants.length > 0 ? "All variants (general stock)" : "No variants (main product)"}
                          </option>
                          {product.variants && product.variants.map((variant) => (
                            <option key={variant.id} value={variant.id} className="bg-slate-800">
                              {[
                                variant.color,
                                variant.size,
                                variant.weight && `${variant.weight}${variant.weight_unit}`,
                                variant.custom_variant
                              ].filter(Boolean).join(' - ')} (Current: {variant.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Reason for Stock Addition *
                        </label>
                        <select
                          value={stockForm.reason}
                          onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-pointer"
                        >
                          <option value="restock" className="bg-slate-800">Restock</option>
                          <option value="new_shipment" className="bg-slate-800">New Shipment</option>
                          <option value="return" className="bg-slate-800">Customer Return</option>
                          <option value="correction" className="bg-slate-800">Stock Correction</option>
                          <option value="other" className="bg-slate-800">Other</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Additional Notes
                        </label>
                        <textarea
                          rows={3}
                          value={stockForm.notes}
                          onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-vertical"
                          placeholder="Add any additional notes about this stock addition..."
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setStockForm({
                              quantity: '',
                              buy_price: '',
                              sell_price: '',
                              reason: 'restock',
                              notes: '',
                              variant_id: '',
                            });
                          }}
                          className="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingStock}
                          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isSubmittingStock ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Adding...</span>
                            </div>
                          ) : (
                            'Add Stock'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <History className="w-5 h-5 mr-2 text-cyan-400" />
                        Stock History
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {stockHistory.map((entry) => (
                        <div key={entry.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  entry.type === 'add' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {entry.type === 'add' ? '+' : '-'}{entry.quantity}
                                </span>
                                <span className="text-sm text-slate-300 font-medium">{entry.reason}</span>
                                {entry.variant_details && (
                                  <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                                    {entry.variant_details}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-2">
                                {entry.cost_per_unit && (
                                  <div>
                                    <span className="text-slate-400">Cost per unit:</span>
                                    <span className="text-white font-medium ml-1">${Number(entry.cost_per_unit).toFixed(2)}</span>
                                  </div>
                                )}
                                {entry.total_cost && (
                                  <div>
                                    <span className="text-slate-400">Total cost:</span>
                                    <span className="text-white font-medium ml-1">${Number(entry.total_cost).toFixed(2)}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-400">Date:</span>
                                  <span className="text-white font-medium ml-1">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400">By:</span>
                                  <span className="text-white font-medium ml-1">{entry.created_by}</span>
                                </div>
                              </div>
                              
                              {entry.notes && (
                                <p className="text-sm text-slate-400 italic">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
