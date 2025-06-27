'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SuppliersTab, PurchaseHistoryTab, PaymentsTab, ProductsTab } from '@/components/suppliers';

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
              <SuppliersTab
                suppliers={suppliers}
                showCreateForm={showCreateForm}
                setShowCreateForm={setShowCreateForm}
                supplierForm={supplierForm}
                handleInputChange={handleInputChange}
                handleCreateSupplier={handleCreateSupplier}
                loading={loading}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Purchase History Tab */}
            {activeTab === 'purchases' && (
              <PurchaseHistoryTab
                purchases={purchases}
                selectedSupplier={selectedSupplier}
                setSelectedSupplier={setSelectedSupplier}
                getFilteredPurchases={getFilteredPurchases}
                getUniqueSuppliers={getUniqueSuppliers}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
              />
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <PaymentsTab
                payments={payments}
                selectedPaymentSupplier={selectedPaymentSupplier}
                setSelectedPaymentSupplier={setSelectedPaymentSupplier}
                getFilteredPayments={getFilteredPayments}
                getUniqueSuppliersFromPayments={getUniqueSuppliersFromPayments}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getPaymentMethodIcon={getPaymentMethodIcon}
              />
            )}

            {/* Products Owned Tab */}
            {activeTab === 'products' && (
              <ProductsTab
                products={products}
                selectedProductSupplier={selectedProductSupplier}
                setSelectedProductSupplier={setSelectedProductSupplier}
                getFilteredProducts={getFilteredProducts}
                getUniqueSuppliersFromProducts={getUniqueSuppliersFromProducts}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
