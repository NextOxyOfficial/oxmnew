'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Purchase {
  id: number;
  date: string;
  supplier: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  products: string[];
}

interface Payment {
  id: number;
  date: string;
  supplier: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'check';
  status: 'pending' | 'completed' | 'failed';
  reference: string;
}

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

export default function SuppliersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ isVisible: false, type: 'success', message: '' });

  // Mock data - replace with actual API calls
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: 1,
      date: '2025-06-25',
      supplier: 'TechSupply Inc.',
      amount: 2500.00,
      status: 'completed',
      products: ['Laptop Dell XPS', 'Wireless Mouse', 'USB Cable']
    },
    {
      id: 2,
      date: '2025-06-20',
      supplier: 'Office Solutions Ltd.',
      amount: 850.50,
      status: 'completed',
      products: ['Office Chair', 'Desk Lamp']
    },
    {
      id: 3,
      date: '2025-06-15',
      supplier: 'Digital Components Co.',
      amount: 1200.00,
      status: 'pending',
      products: ['Graphics Card', 'RAM Module']
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 1,
      date: '2025-06-25',
      supplier: 'TechSupply Inc.',
      amount: 2500.00,
      method: 'bank_transfer',
      status: 'completed',
      reference: 'TXN001234'
    },
    {
      id: 2,
      date: '2025-06-20',
      supplier: 'Office Solutions Ltd.',
      amount: 850.50,
      method: 'card',
      status: 'completed',
      reference: 'TXN001235'
    },
    {
      id: 3,
      date: '2025-06-15',
      supplier: 'Digital Components Co.',
      amount: 1200.00,
      method: 'check',
      status: 'pending',
      reference: 'CHK001'
    }
  ]);

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Laptop Dell XPS 13',
      category: 'Electronics',
      supplier: 'TechSupply Inc.',
      quantity: 15,
      unit_price: 1200.00,
      total_value: 18000.00,
      last_ordered: '2025-06-25'
    },
    {
      id: 2,
      name: 'Office Chair Premium',
      category: 'Furniture',
      supplier: 'Office Solutions Ltd.',
      quantity: 25,
      unit_price: 350.00,
      total_value: 8750.00,
      last_ordered: '2025-06-20'
    },
    {
      id: 3,
      name: 'Wireless Mouse',
      category: 'Electronics',
      supplier: 'TechSupply Inc.',
      quantity: 50,
      unit_price: 45.00,
      total_value: 2250.00,
      last_ordered: '2025-06-25'
    },
    {
      id: 4,
      name: 'Graphics Card RTX 4070',
      category: 'Electronics',
      supplier: 'Digital Components Co.',
      quantity: 8,
      unit_price: 600.00,
      total_value: 4800.00,
      last_ordered: '2025-06-15'
    }
  ]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: 'success', message: '' });
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };

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
        return '💰';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate overview stats
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalProducts = products.reduce((sum, product) => sum + product.quantity, 0);
  const totalValue = products.reduce((sum, product) => sum + product.total_value, 0);
  const pendingPayments = payments.filter(payment => payment.status === 'pending').length;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'purchases', label: 'Purchase History' },
    { id: 'payments', label: 'Payment History' },
    { id: 'products', label: 'Products Owned' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl">
        {/* Notification */}
        {notification.isVisible && (
          <div className={`p-4 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-500/10 border-green-400/30 text-green-300' 
              : 'bg-red-500/10 border-red-400/30 text-red-300'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="border-b border-slate-700/50">
            <nav className="flex space-x-8 px-6 pt-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-slate-900 text-xl">📊</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-slate-400">Total Purchases</h3>
                        <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalPurchases)}</p>
                        <p className="text-xs text-green-400">+12% from last month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl">📦</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-slate-400">Products Owned</h3>
                        <p className="text-2xl font-bold text-slate-100">{totalProducts}</p>
                        <p className="text-xs text-green-400">Across {products.length} items</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl">💰</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-slate-400">Inventory Value</h3>
                        <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalValue)}</p>
                        <p className="text-xs text-blue-400">Current market value</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl">⏳</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-slate-400">Pending Payments</h3>
                        <p className="text-2xl font-bold text-slate-100">{pendingPayments}</p>
                        <p className="text-xs text-yellow-400">Requires attention</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-slate-100 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {purchases.slice(0, 3).map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          <div>
                            <p className="text-slate-100 font-medium">{purchase.supplier}</p>
                            <p className="text-slate-400 text-sm">{formatDate(purchase.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-100 font-medium">{formatCurrency(purchase.amount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(purchase.status)}`}>
                            {purchase.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === 'purchases' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-4">Purchase History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Date</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Supplier</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Products</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Amount</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((purchase) => (
                          <tr key={purchase.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="py-4 px-4 text-slate-100">{formatDate(purchase.date)}</td>
                            <td className="py-4 px-4 text-slate-100">{purchase.supplier}</td>
                            <td className="py-4 px-4">
                              <div className="text-slate-300 text-sm">
                                {purchase.products.slice(0, 2).join(', ')}
                                {purchase.products.length > 2 && ` +${purchase.products.length - 2} more`}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-100 font-medium">{formatCurrency(purchase.amount)}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(purchase.status)}`}>
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
            )}

            {/* Payment History Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-4">Payment History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Date</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Supplier</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Method</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Reference</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Amount</th>
                          <th className="text-left text-slate-300 font-medium py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="py-4 px-4 text-slate-100">{formatDate(payment.date)}</td>
                            <td className="py-4 px-4 text-slate-100">{payment.supplier}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getPaymentMethodIcon(payment.method)}</span>
                                <span className="text-slate-300 capitalize">{payment.method.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-300 font-mono text-sm">{payment.reference}</td>
                            <td className="py-4 px-4 text-slate-100 font-medium">{formatCurrency(payment.amount)}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Products Owned Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-4">Products Owned</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-slate-100 font-medium">{product.name}</h4>
                            <p className="text-slate-400 text-sm">{product.category}</p>
                          </div>
                          <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full text-xs">
                            Qty: {product.quantity}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Supplier:</span>
                            <span className="text-slate-100">{product.supplier}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Unit Price:</span>
                            <span className="text-slate-100">{formatCurrency(product.unit_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Value:</span>
                            <span className="text-slate-100 font-medium">{formatCurrency(product.total_value)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Last Ordered:</span>
                            <span className="text-slate-100">{formatDate(product.last_ordered)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
