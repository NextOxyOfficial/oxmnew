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

interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  created_date: string;
  total_orders: number;
  total_amount: number;
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('all'); // For filtering purchases
  const [selectedPaymentSupplier, setSelectedPaymentSupplier] = useState('all'); // For filtering payments
  const [selectedProductSupplier, setSelectedProductSupplier] = useState('all'); // For filtering products
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ isVisible: false, type: 'success', message: '' });

  // Form state for creating new supplier
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    email: ''
  });

  // Mock data - replace with actual API calls
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: 1,
      date: '2024-12-20',
      supplier: 'Tech Solutions Ltd',
      amount: 15000,
      status: 'completed',
      products: ['Laptops', 'Keyboards', 'Mice']
    },
    {
      id: 2,
      date: '2024-12-18',
      supplier: 'Office Supplies Co',
      amount: 2500,
      status: 'pending',
      products: ['Paper', 'Pens', 'Folders']
    },
    {
      id: 3,
      date: '2024-12-15',
      supplier: 'Furniture Express',
      amount: 8500,
      status: 'completed',
      products: ['Desks', 'Chairs']
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 1,
      date: '2024-12-20',
      supplier: 'Tech Solutions Ltd',
      amount: 15000,
      method: 'bank_transfer',
      status: 'completed',
      reference: 'TXN20241220001'
    },
    {
      id: 2,
      date: '2024-12-18',
      supplier: 'Office Supplies Co',
      amount: 2500,
      method: 'card',
      status: 'pending',
      reference: 'TXN20241218001'
    },
    {
      id: 3,
      date: '2024-12-15',
      supplier: 'Furniture Express',
      amount: 8500,
      method: 'check',
      status: 'completed',
      reference: 'CHK20241215001'
    }
  ]);

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Wireless Mouse',
      category: 'Electronics',
      supplier: 'Tech Solutions Ltd',
      quantity: 50,
      unit_price: 25.99,
      total_value: 1299.50,
      last_ordered: '2024-12-20'
    },
    {
      id: 2,
      name: 'Office Paper A4',
      category: 'Stationery',
      supplier: 'Office Supplies Co',
      quantity: 200,
      unit_price: 8.50,
      total_value: 1700.00,
      last_ordered: '2024-12-18'
    },
    {
      id: 3,
      name: 'Ergonomic Chair',
      category: 'Furniture',
      supplier: 'Furniture Express',
      quantity: 12,
      unit_price: 299.99,
      total_value: 3599.88,
      last_ordered: '2024-12-15'
    }
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 1,
      name: 'Tech Solutions Ltd',
      address: '123 Technology Dr, Silicon Valley, CA 94025',
      phone: '+1 (555) 123-4567',
      website: 'https://techsolutions.com',
      email: 'contact@techsolutions.com',
      created_date: '2024-01-15',
      total_orders: 25,
      total_amount: 125000
    },
    {
      id: 2,
      name: 'Office Supplies Co',
      address: '456 Business Ave, New York, NY 10001',
      phone: '+1 (555) 987-6543',
      website: 'https://officesupplies.com',
      email: 'orders@officesupplies.com',
      created_date: '2024-02-20',
      total_orders: 18,
      total_amount: 45000
    },
    {
      id: 3,
      name: 'Furniture Express',
      address: '789 Furniture Blvd, Chicago, IL 60601',
      phone: '+1 (555) 456-7890',
      website: 'https://furnitureexpress.com',
      email: 'sales@furnitureexpress.com',
      created_date: '2024-03-10',
      total_orders: 12,
      total_amount: 85000
    }
  ]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: 'success', message: '' });
    }, 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplierForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSupplier: Supplier = {
        id: suppliers.length + 1,
        name: supplierForm.name,
        address: supplierForm.address,
        phone: supplierForm.phone,
        website: supplierForm.website,
        email: supplierForm.email,
        created_date: new Date().toISOString().split('T')[0],
        total_orders: 0,
        total_amount: 0
      };

      setSuppliers([...suppliers, newSupplier]);
      setSupplierForm({ name: '', address: '', phone: '', website: '', email: '' });
      setShowCreateForm(false);
      showNotification('success', 'Supplier created successfully!');
    } catch (error) {
      showNotification('error', 'Failed to create supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases by selected supplier
  const getFilteredPurchases = () => {
    if (selectedSupplier === 'all') {
      return purchases;
    }
    return purchases.filter(purchase => purchase.supplier === selectedSupplier);
  };

  // Filter payments by selected supplier
  const getFilteredPayments = () => {
    if (selectedPaymentSupplier === 'all') {
      return payments;
    }
    return payments.filter(payment => payment.supplier === selectedPaymentSupplier);
  };

  // Filter products by selected supplier
  const getFilteredProducts = () => {
    if (selectedProductSupplier === 'all') {
      return products;
    }
    return products.filter(product => product.supplier === selectedProductSupplier);
  };

  // Get unique suppliers from purchases for dropdown
  const getUniqueSuppliers = () => {
    const uniqueSuppliers = [...new Set(purchases.map(purchase => purchase.supplier))];
    return uniqueSuppliers.sort();
  };

  // Get unique suppliers from payments for dropdown
  const getUniqueSuppliersFromPayments = () => {
    const uniqueSuppliers = [...new Set(payments.map(payment => payment.supplier))];
    return uniqueSuppliers.sort();
  };

  // Get unique suppliers from products for dropdown
  const getUniqueSuppliersFromProducts = () => {
    const uniqueSuppliers = [...new Set(products.map(product => product.supplier))];
    return uniqueSuppliers.sort();
  };

  // Utility functions
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

  const tabs = [
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'purchases', label: 'Purchase History' },
    { id: 'payments', label: 'Payments' },
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
            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="space-y-6">
                {/* Header with Create Button */}
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium text-slate-100">Suppliers</h4>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Supplier
                  </button>
                </div>

                {/* Create Supplier Form Modal */}
                {showCreateForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-6 w-full max-w-md">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-slate-100">Create New Supplier</h4>
                        <button
                          onClick={() => setShowCreateForm(false)}
                          className="text-slate-400 hover:text-slate-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <form onSubmit={handleCreateSupplier} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Supplier Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={supplierForm.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                            placeholder="Enter supplier name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Address *
                          </label>
                          <textarea
                            name="address"
                            value={supplierForm.address}
                            onChange={handleInputChange}
                            required
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                            placeholder="Enter supplier address"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={supplierForm.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={supplierForm.website}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={supplierForm.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                            placeholder="supplier@example.com"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
                          >
                            {loading ? 'Creating...' : 'Create Supplier'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Suppliers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 transition-colors duration-200">
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-slate-100 font-medium text-sm">{supplier.name}</h5>
                          <p className="text-slate-400 text-xs mt-1">{supplier.address}</p>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-slate-300">{supplier.phone}</span>
                          </div>
                          
                          {supplier.email && (
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-slate-300">{supplier.email}</span>
                            </div>
                          )}
                          
                          {supplier.website && (
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <a 
                                href={supplier.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 truncate"
                              >
                                {supplier.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-700/50 pt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Orders:</span>
                            <p className="text-slate-100 font-medium">{supplier.total_orders}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Amount:</span>
                            <p className="text-slate-100 font-medium">{formatCurrency(supplier.total_amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === 'purchases' && (
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
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
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
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm"
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
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Products Owned</h4>
                  {/* Filter by Supplier */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-slate-300">Filter by Supplier:</label>
                      <select
                        value={selectedProductSupplier}
                        onChange={(e) => setSelectedProductSupplier(e.target.value)}
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm"
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
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
