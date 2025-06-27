'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/lib/api';
import { SuppliersTab, PurchaseHistoryTab, PaymentsTab, ProductsTab, CreatePurchaseModal, CreatePaymentModal } from '@/components/suppliers';
import { ClientOnly } from '@/components';

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
  created_at: string;
  updated_at: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
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

  // State for editing supplier
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Modal states
  const [showCreatePurchaseModal, setShowCreatePurchaseModal] = useState(false);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [selectedSupplierForAction, setSelectedSupplierForAction] = useState<Supplier | null>(null);

  // Form states for modals
  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    products: '',
    notes: '',
    proofFile: null as File | null,
    proof_document: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'check',
    status: 'pending' as 'pending' | 'completed' | 'failed',
    reference: '',
    notes: '',
    proofFile: null as File | null,
    proofUrl: ''
  });

  // Real purchases state - will be populated from API
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Mock data for payments and products (to be implemented later)
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 1,
      date: '2024-12-20',
      supplier: 'Tech Solutions Ltd',
      amount: 15000,
      method: 'bank_transfer',
      status: 'completed',
      reference: 'TXN20241220001',
      proofUrl: 'https://via.placeholder.com/400x300/0891b2/ffffff?text=Bank+Transfer+Receipt'
    },
    {
      id: 2,
      date: '2024-12-18',
      supplier: 'Office Supplies Co',
      amount: 2500,
      method: 'card',
      status: 'pending',
      reference: 'TXN20241218001',
      proofUrl: 'https://via.placeholder.com/400x300/eab308/ffffff?text=Payment+Proof.pdf'
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

  // Real suppliers state - will be populated from API
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Fetch suppliers and purchases from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log('No user found, skipping data fetch');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching suppliers and purchases for user:', user.username);
        
        // Fetch suppliers first
        try {
          const suppliersResponse = await ApiService.getSuppliers();
          console.log('Suppliers fetched successfully:', suppliersResponse);
          setSuppliers(suppliersResponse);
        } catch (suppliersError) {
          console.error('Error fetching suppliers:', suppliersError);
          showNotification('error', 'Failed to load suppliers');
        }

        // Fetch purchases
        try {
          const purchasesResponse = await ApiService.getPurchases();
          console.log('Purchases fetched successfully:', purchasesResponse);
          setPurchases(purchasesResponse);
        } catch (purchasesError) {
          console.error('Error fetching purchases:', purchasesError);
          showNotification('error', 'Failed to load purchases');
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        showNotification('error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  const handlePurchaseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPurchaseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePurchaseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Simulate file upload and get URL (in real app, upload to server/cloud storage)
      const fileUrl = URL.createObjectURL(file);
      setPurchaseForm(prev => ({
        ...prev,
        proofFile: file,
        proof_document: fileUrl
      }));
    }
  };

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Simulate file upload and get URL (in real app, upload to server/cloud storage)
      const fileUrl = URL.createObjectURL(file);
      setPaymentForm(prev => ({
        ...prev,
        proofFile: file,
        proofUrl: fileUrl
      }));
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSupplier) {
        // Update existing supplier
        const updatedSupplier = await ApiService.updateSupplier(editingSupplier.id, {
          name: supplierForm.name,
          address: supplierForm.address || undefined,
          phone: supplierForm.phone || undefined,
          website: supplierForm.website || undefined,
          email: supplierForm.email || undefined,
        });

        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id ? updatedSupplier : supplier
        ));
        setEditingSupplier(null);
        showNotification('success', 'Supplier updated successfully!');
      } else {
        // Create new supplier
        const newSupplier = await ApiService.createSupplier({
          name: supplierForm.name,
          address: supplierForm.address || undefined,
          phone: supplierForm.phone || undefined,
          website: supplierForm.website || undefined,
          email: supplierForm.email || undefined,
        });

        setSuppliers(prev => [...prev, newSupplier]);
        showNotification('success', 'Supplier created successfully!');
      }

      setSupplierForm({ name: '', address: '', phone: '', website: '', email: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
      const action = editingSupplier ? 'update' : 'create';
      showNotification('error', `Failed to ${action} supplier. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSupplierForm = () => {
    setSupplierForm({ name: '', address: '', phone: '', website: '', email: '' });
    setEditingSupplier(null);
    setShowCreateForm(false);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedSupplierForAction) {
        throw new Error('No supplier selected');
      }

      const newPurchase = await ApiService.createPurchase({
        supplier: selectedSupplierForAction.id,
        date: purchaseForm.date,
        amount: parseFloat(purchaseForm.amount),
        status: purchaseForm.status,
        products: purchaseForm.products,
        notes: purchaseForm.notes || undefined,
        proof_document: purchaseForm.proofFile || undefined,
      });

      // Add the new purchase to the state
      setPurchases(prev => [newPurchase, ...prev]);
      
      // Reset form
      setPurchaseForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'pending',
        products: '',
        notes: '',
        proofFile: null,
        proof_document: ''
      });
      
      setShowCreatePurchaseModal(false);
      setSelectedSupplierForAction(null);
      showNotification('success', 'Purchase order created successfully!');

      // Refresh purchases list to make sure we have the latest data
      try {
        const updatedPurchases = await ApiService.getPurchases();
        setPurchases(updatedPurchases);
      } catch (refreshError) {
        console.error('Failed to refresh purchases:', refreshError);
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      showNotification('error', 'Failed to create purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPayment: Payment = {
        id: payments.length + 1,
        date: paymentForm.date,
        supplier: selectedSupplierForAction?.name || '',
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        status: paymentForm.status,
        reference: paymentForm.reference || `PAY-${Date.now()}`,
        proofUrl: paymentForm.proofUrl
      };

      setPayments([...payments, newPayment]);
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'cash',
        status: 'pending',
        reference: '',
        notes: '',
        proofFile: null,
        proofUrl: ''
      });
      setShowCreatePaymentModal(false);
      setSelectedSupplierForAction(null);
      showNotification('success', 'Payment record created successfully!');
    } catch (error) {
      showNotification('error', 'Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases by selected supplier
  const getFilteredPurchases = () => {
    if (selectedSupplier === 'all') {
      return purchases;
    }
    return purchases.filter(purchase => purchase.supplier.name === selectedSupplier);
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
    const uniqueSuppliers = [...new Set(purchases.map(purchase => purchase.supplier.name))];
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
    // Use a consistent date format to avoid hydration mismatches
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Use UTC to ensure consistency between server and client
      });
    } catch (error) {
      return dateString; // Fallback to original string if parsing fails
    }
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

  const handleCreatePurchaseFromSupplier = (supplier: Supplier) => {
    setSelectedSupplierForAction(supplier);
    setPurchaseForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'pending',
      products: '',
      notes: '',
      proofFile: null,
      proof_document: ''
    });
    setShowCreatePurchaseModal(true);
  };

  const handleCreatePaymentFromSupplier = (supplier: Supplier) => {
    setSelectedSupplierForAction(supplier);
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: 'cash',
      status: 'pending',
      reference: '',
      notes: '',
      proofFile: null,
      proofUrl: ''
    });
    setShowCreatePaymentModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    // Pre-populate the form with supplier data for editing
    setSupplierForm({
      name: supplier.name,
      address: supplier.address || '',
      phone: supplier.phone || '',
      website: supplier.website || '',
      email: supplier.email || ''
    });
    setShowCreateForm(true);
    // Store the supplier ID for updating
    setEditingSupplier(supplier);
    showNotification('success', `Edit mode for ${supplier.name} - Update the form and save changes`);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    // Confirmation dialog before deletion
    if (window.confirm(`Are you sure you want to delete ${supplier.name}? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await ApiService.deleteSupplier(supplier.id);
        
        // Remove from local state
        setSuppliers(prevSuppliers => 
          prevSuppliers.filter(s => s.id !== supplier.id)
        );
        
        showNotification('success', `${supplier.name} has been deleted successfully`);
      } catch (error) {
        console.error('Error deleting supplier:', error);
        showNotification('error', 'Failed to delete supplier. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdatePurchase = async (purchaseId: number, updatedData: { status: 'pending' | 'completed' | 'cancelled' }) => {
    try {
      const updatedPurchase = await ApiService.updatePurchase(purchaseId, updatedData);
      
      // Update the local state
      setPurchases(prev => prev.map(purchase => 
        purchase.id === purchaseId ? { ...purchase, ...updatedPurchase } : purchase
      ));
      
      showNotification('success', 'Purchase status updated successfully');
    } catch (error) {
      console.error('Error updating purchase:', error);
      showNotification('error', 'Failed to update purchase status. Please try again.');
      throw error; // Re-throw to let the component handle the error
    }
  };

  const tabs = [
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'purchases', label: 'Purchase History' },
    { id: 'payments', label: 'Payments' },
    { id: 'products', label: 'Products' }
  ];

  return (
    <ClientOnly>
      <div className="p-1 sm:p-6 space-y-6">
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

            <div className="p-2 sm:p-6">
              {/* Suppliers Tab */}
              {activeTab === 'suppliers' && (
                <SuppliersTab
                  suppliers={suppliers}
                  showCreateForm={showCreateForm}
                  setShowCreateForm={setShowCreateForm}
                  supplierForm={supplierForm}
                  handleInputChange={handleInputChange}
                  handleCreateSupplier={handleCreateSupplier}
                  handleCancelSupplierForm={handleCancelSupplierForm}
                  isEditing={!!editingSupplier}
                  loading={loading}
                  formatCurrency={formatCurrency}
                  onCreatePurchase={handleCreatePurchaseFromSupplier}
                  onCreatePayment={handleCreatePaymentFromSupplier}
                  onEditSupplier={handleEditSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                />
              )}

              {/* Purchase History Tab */}
              {activeTab === 'purchases' && (
                <div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                      <span className="ml-3 text-slate-400">Loading purchases...</span>
                    </div>
                  ) : (
                    <PurchaseHistoryTab
                      purchases={purchases}
                      selectedSupplier={selectedSupplier}
                      setSelectedSupplier={setSelectedSupplier}
                      getFilteredPurchases={getFilteredPurchases}
                      getUniqueSuppliers={getUniqueSuppliers}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                      onUpdatePurchase={handleUpdatePurchase}
                    />
                  )}
                  
                  {!loading && purchases.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No purchases found. Create your first purchase order!</p>
                    </div>
                  )}
                </div>
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

              {/* Products Tab */}
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

          {/* Create Purchase Modal */}
          <CreatePurchaseModal
            isOpen={showCreatePurchaseModal}
            onClose={() => {
              setShowCreatePurchaseModal(false);
              setSelectedSupplierForAction(null);
            }}
            supplier={selectedSupplierForAction}
            purchaseForm={purchaseForm}
            handleInputChange={handlePurchaseInputChange}
            handleFileChange={handlePurchaseFileChange}
            handleSubmit={handleCreatePurchase}
            loading={loading}
          />

          {/* Create Payment Modal */}
          <CreatePaymentModal
            isOpen={showCreatePaymentModal}
            onClose={() => {
              setShowCreatePaymentModal(false);
              setSelectedSupplierForAction(null);
            }}
            supplier={selectedSupplierForAction}
            paymentForm={paymentForm}
            handleInputChange={handlePaymentInputChange}
            handleFileChange={handlePaymentFileChange}
            handleSubmit={handleCreatePayment}
            loading={loading}
          />
        </div>
      </div>
    </ClientOnly>
  );
}
