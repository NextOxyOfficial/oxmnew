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

  // Mock suppliers data
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 1,
      name: 'TechSupply Inc.',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      phone: '+1 (555) 123-4567',
      website: 'https://techsupply.com',
      email: 'orders@techsupply.com',
      created_date: '2024-01-15',
      total_orders: 15,
      total_amount: 25000.00
    },
    {
      id: 2,
      name: 'Office Solutions Ltd.',
      address: '456 Business Ave, New York, NY 10001',
      phone: '+1 (555) 987-6543',
      website: 'https://officesolutions.com',
      email: 'sales@officesolutions.com',
      created_date: '2024-03-20',
      total_orders: 8,
      total_amount: 12000.00
    },
    {
      id: 3,
      name: 'Digital Components Co.',
      address: '789 Component Blvd, Austin, TX 78701',
      phone: '+1 (555) 456-7890',
      website: 'https://digitalcomponents.com',
      email: 'info@digitalcomponents.com',
      created_date: '2024-02-10',
      total_orders: 12,
      total_amount: 18500.00
    }
  ]);

  // Utility functions
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: 'success', message: '' });
    }, 5000);
  };

  // Handle form submission
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!supplierForm.name || !supplierForm.address || !supplierForm.phone || !supplierForm.email) {
        throw new Error('Please fill in all required fields');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supplierForm.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Create new supplier object
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

      // Add to suppliers list
      setSuppliers([...suppliers, newSupplier]);

      // Reset form
      setSupplierForm({
        name: '',
        address: '',
        phone: '',
        website: '',
        email: ''
      });

      setShowCreateForm(false);
      showNotification('Supplier created successfully!', 'success');
      
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Failed to create supplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplierForm(prev => ({
      ...prev,
      [name]: value
    }));
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
    { id: 'suppliers', label: 'Suppliers' },
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

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="space-y-6">
                {/* Header with Create Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-slate-100">Suppliers</h3>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
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
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Supplier Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={supplierForm.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="Enter supplier name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Address *
                          </label>
                          <textarea
                            name="address"
                            value={supplierForm.address}
                            onChange={handleInputChange}
                            required
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="Enter supplier address"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={supplierForm.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={supplierForm.website}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={supplierForm.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="Enter email address"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-300 rounded-md transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
                          >
                            {loading ? 'Creating...' : 'Create Supplier'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Suppliers List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-medium text-slate-100">{supplier.name}</h4>
                          <span className="text-xs text-slate-400">
                            Added: {formatDate(supplier.created_date)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-slate-300">{supplier.address}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${supplier.phone}`} className="text-cyan-400 hover:text-cyan-300">
                              {supplier.phone}
                            </a>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${supplier.email}`} className="text-cyan-400 hover:text-cyan-300">
                              {supplier.email}
                            </a>
                          </div>
                          
                          {supplier.website && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <a 
                                href={supplier.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300"
                              >
                                {supplier.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-700 pt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Total Orders:</span>
                            <p className="text-slate-100 font-medium">{supplier.total_orders}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Amount:</span>
                            <p className="text-slate-100 font-medium">{formatCurrency(supplier.total_amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
