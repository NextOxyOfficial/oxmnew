"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag, Star, Gift, Trophy, AlertTriangle, FileText, Receipt, X, Printer } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Order {
  id: number;
  date: string;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  items: number;
}

interface Gift {
  id: number;
  name: string;
  description: string;
  date_given: string;
  value: number;
  status: 'active' | 'used' | 'expired';
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  date_earned: string;
  points: number;
}

interface DuePayment {
  id: number;
  order_id: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid';
  days_overdue?: number;
  notes?: string;
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'gifts' | 'achievements' | 'dues'>('profile');
  const [editableCustomer, setEditableCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedGift, setSelectedGift] = useState('');
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedDuePayment, setSelectedDuePayment] = useState<DuePayment | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'due',
    amount: '',
    note: '',
    notifyCustomer: false
  });

  // Mock available gifts from settings (replace with actual API call)
  const availableGifts = [
    { id: 1, name: 'Welcome Bonus', description: '10% off first order', value: 10 },
    { id: 2, name: 'Birthday Gift', description: 'Free shipping voucher', value: 15 },
    { id: 3, name: 'Loyalty Reward', description: '$5 store credit', value: 5 },
    { id: 4, name: 'Holiday Special', description: '20% off any item', value: 20 },
    { id: 5, name: 'Referral Bonus', description: '$10 store credit', value: 10 },
  ];

  // Ensure component is mounted before rendering dates
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    if (!mounted) return ''; // Return empty string during SSR
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock customer data
        const mockCustomer: Customer = {
          id: parseInt(customerId),
          name: "John Doe",
          email: "john.doe@email.com",
          phone: "+1 (555) 123-4567",
          address: "123 Main St, City, State 12345",
          total_orders: 15,
          total_spent: 1250.75,
          last_order_date: "2025-06-25",
          status: "active",
          created_at: "2024-01-15"
        };

        const mockOrders: Order[] = [
          { id: 1, date: "2025-06-25", total: 89.99, status: "completed", items: 3 },
          { id: 2, date: "2025-06-20", total: 45.50, status: "completed", items: 2 },
          { id: 3, date: "2025-06-15", total: 120.00, status: "pending", items: 5 },
          { id: 4, date: "2025-06-10", total: 75.25, status: "completed", items: 1 },
        ];

        const mockGifts: Gift[] = [
          { id: 1, name: "Welcome Bonus", description: "10% off first order", date_given: "2024-01-15", value: 10, status: "used" },
          { id: 2, name: "Birthday Gift", description: "Free shipping voucher", date_given: "2025-03-20", value: 15, status: "active" },
          { id: 3, name: "Loyalty Reward", description: "$5 store credit", date_given: "2025-05-10", value: 5, status: "active" },
        ];

        const mockAchievements: Achievement[] = [
          { id: 1, title: "First Purchase", description: "Completed your first order", icon: "🛍️", date_earned: "2024-01-15", points: 100 },
          { id: 2, title: "Loyal Customer", description: "Made 10+ orders", icon: "⭐", date_earned: "2025-04-20", points: 500 },
          { id: 3, title: "Big Spender", description: "Spent over $1000", icon: "💎", date_earned: "2025-06-01", points: 1000 },
        ];

        const mockDuePayments: DuePayment[] = [
          { id: 1, order_id: 3, amount: 120.00, due_date: "2025-07-01", status: "pending", days_overdue: 0, notes: "Customer requested extended payment terms" },
          { id: 2, order_id: 5, amount: 85.50, due_date: "2025-06-20", status: "overdue", days_overdue: 8, notes: "Multiple payment reminders sent. Customer cited cash flow issues." },
        ];

        setCustomer(mockCustomer);
        setEditableCustomer(mockCustomer);
        setOrders(mockOrders);
        setGifts(mockGifts);
        setAchievements(mockAchievements);
        setDuePayments(mockDuePayments);
      } catch (err) {
        setError("Failed to load customer details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const handleSaveProfile = async () => {
    if (!editableCustomer) return;

    try {
      setIsSaving(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the customer state with edited values
      setCustomer(editableCustomer);
      
      // Show success message (you can add a toast notification here)
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGift = async () => {
    if (!selectedGift) return;

    try {
      setIsAddingGift(true);
      
      // Find the selected gift details
      const giftToAdd = availableGifts.find(g => g.id.toString() === selectedGift);
      if (!giftToAdd) return;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new gift entry
      const newGift = {
        id: Date.now(), // Temporary ID
        name: giftToAdd.name,
        description: giftToAdd.description,
        date_given: new Date().toISOString().split('T')[0],
        value: giftToAdd.value,
        status: 'active' as const
      };

      // Add to gifts list
      setGifts([...gifts, newGift]);
      
      // Reset selection
      setSelectedGift('');
      
      // Show success message
      alert(`Gift "${giftToAdd.name}" added successfully!`);
    } catch (error) {
      alert('Failed to add gift. Please try again.');
    } finally {
      setIsAddingGift(false);
    }
  };

  const handleShowInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoiceModal(false);
    setSelectedOrder(null);
  };

  const handleShowTransactionModal = () => {
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setTransactionForm({
      type: 'due',
      amount: '',
      note: '',
      notifyCustomer: false
    });
  };

  const handleShowNotes = (duePayment: DuePayment) => {
    setSelectedDuePayment(duePayment);
    setShowNotesModal(true);
  };

  const handleCloseNotes = () => {
    setShowNotesModal(false);
    setSelectedDuePayment(null);
  };

  const handleSubmitTransaction = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Transaction added successfully! ${transactionForm.notifyCustomer ? 'Customer will be notified via SMS.' : ''}`);
      
      // Close modal and reset form
      handleCloseTransactionModal();
    } catch (error) {
      alert('Failed to add transaction. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
              <div className="h-6 bg-slate-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !customer) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Customer Details
            </h3>
            <p className="text-red-400/70 mb-4">{error || "Customer not found"}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Mail },
    { id: 'dues', name: 'Due Payments', icon: AlertTriangle },
    { id: 'orders', name: 'Purchase History', icon: ShoppingBag },
    { id: 'gifts', name: 'Gifts & Rewards', icon: Gift },
    { id: 'achievements', name: 'Achievements', icon: Trophy },
  ];

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customers</span>
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {customer.name}
              </h1>
              <p className="text-green-400 text-lg font-semibold mt-1">
                Total Spent: ${customer.total_spent.toFixed(2)}
              </p>
            </div>
            
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              customer.status === 'active' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {customer.status}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-5xl mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-white mt-1">{customer.total_orders}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-cyan-500" />
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">
                    {duePayments.reduce((sum, due) => sum + (due.status !== 'paid' ? due.amount : 0), 0) > 0 
                      ? 'Due' 
                      : 'Advance'
                    }
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${
                    duePayments.reduce((sum, due) => sum + (due.status !== 'paid' ? due.amount : 0), 0) > 0 
                      ? 'text-red-500' 
                      : 'text-green-500'
                  }`}>
                    {duePayments.reduce((sum, due) => sum + (due.status !== 'paid' ? due.amount : 0), 0) > 0 
                      ? `$${duePayments.reduce((sum, due) => sum + (due.status !== 'paid' ? due.amount : 0), 0).toFixed(2)}`
                      : '$0.00'
                    }
                  </p>
                </div>
                <AlertTriangle className={`w-8 h-8 ${
                  duePayments.reduce((sum, due) => sum + (due.status !== 'paid' ? due.amount : 0), 0) > 0 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`} />
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Gifts</p>
                  <p className="text-2xl font-bold text-purple-500 mt-1">{gifts.filter(g => g.status === 'active').length}</p>
                </div>
                <Gift className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Achievements</p>
                  <p className="text-2xl font-bold text-yellow-500 mt-1">{achievements.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
            <div className="border-b border-slate-700/50">
              <nav className="flex space-x-8 px-6 pt-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && editableCustomer && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Customer Profile</h4>
                  
                  {/* Customer Name and Status */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={editableCustomer.name}
                          onChange={(e) => setEditableCustomer({ ...editableCustomer, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Status
                        </label>
                        <select
                          value={editableCustomer.status}
                          onChange={(e) => setEditableCustomer({ ...editableCustomer, status: e.target.value as 'active' | 'inactive' })}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm"
                        >
                          <option value="active" className="bg-slate-800">Active</option>
                          <option value="inactive" className="bg-slate-800">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-6">
                    <h5 className="text-md font-medium text-slate-100 mb-3">Contact Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editableCustomer.email}
                          onChange={(e) => setEditableCustomer({ ...editableCustomer, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editableCustomer.phone}
                          onChange={(e) => setEditableCustomer({ ...editableCustomer, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-6">
                    <h5 className="text-md font-medium text-slate-100 mb-3">Address</h5>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Address
                      </label>
                      <textarea
                        rows={3}
                        value={editableCustomer.address || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                        placeholder="Enter full address"
                      />
                    </div>
                  </div>

                  {/* Customer Since (Read-only) */}
                  <div className="mb-6">
                    <h5 className="text-md font-medium text-slate-100 mb-3">Account Information</h5>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Customer Since
                      </label>                        <input
                          type="text"
                          value={formatDate(editableCustomer.created_at)}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm cursor-not-allowed"
                        />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Purchase History</h4>
                  <div className="max-w-4xl">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="col-span-2">Order ID</div>
                          <div className="col-span-3">Date</div>
                          <div className="col-span-2">Items</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-1">Details</div>
                        </div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y divide-white/5">
                        {orders.map((order) => (
                          <div key={order.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-100">#{order.id}</p>
                              </div>
                              <div className="col-span-3">
                                <p className="text-sm text-slate-300">{formatDate(order.date)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-300">{order.items} items</p>
                              </div>
                              <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' : 
                                  'bg-red-500/20 text-red-300 border border-red-400/30'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-semibold text-green-300">${order.total.toFixed(2)}</p>
                              </div>
                              <div className="col-span-1">
                                <button 
                                  onClick={() => handleShowInvoice(order)}
                                  className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors flex items-center space-x-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Invoice</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gifts' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Gifts & Rewards</h4>
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedGift}
                        onChange={(e) => setSelectedGift(e.target.value)}
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[200px]"
                      >
                        <option value="" className="bg-slate-800">Select a gift...</option>
                        {availableGifts.map((gift) => (
                          <option key={gift.id} value={gift.id.toString()} className="bg-slate-800">
                            {gift.name} (${gift.value})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddGift}
                        disabled={!selectedGift || isAddingGift}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                      >
                        {isAddingGift ? 'Adding...' : 'Add Gift'}
                      </button>
                    </div>
                  </div>
                  <div className="max-w-4xl">
                    {gifts.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <p>No gifts or rewards found for this customer.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gifts.map((gift) => (
                          <div key={gift.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-start justify-between mb-3">
                              <Gift className="w-6 h-6 text-purple-400" />
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                gift.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                gift.status === 'used' ? 'bg-gray-500/20 text-gray-300 border border-gray-400/30' : 
                                'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}>
                                {gift.status}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-medium text-slate-100 mb-2">{gift.name}</h4>
                            <p className="text-slate-400 text-sm mb-3">{gift.description}</p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-purple-300 font-medium text-sm">${gift.value} value</span>
                              <span className="text-slate-400 text-xs">
                                {formatDate(gift.date_given)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Achievements</h4>
                  <div className="max-w-4xl">
                    {achievements.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <p>No achievements earned yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.map((achievement) => (
                          <div key={achievement.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-start space-x-3">
                              <div className="text-2xl">{achievement.icon}</div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-slate-100 mb-1">{achievement.title}</h4>
                                <p className="text-slate-400 text-sm mb-3">{achievement.description}</p>
                                
                                <div className="flex justify-between items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                                    {achievement.points} pts
                                  </span>
                                  <span className="text-slate-400 text-xs">
                                    {formatDate(achievement.date_earned)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dues' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Due Payments</h4>
                    <button
                      onClick={handleShowTransactionModal}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Add Transaction
                    </button>
                  </div>
                  <div className="max-w-4xl">
                    {duePayments.length > 0 ? (
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                            <div className="col-span-2">Order ID</div>
                            <div className="col-span-2">Due Date</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Overdue</div>
                            <div className="col-span-2">Amount</div>
                            <div className="col-span-2">Details</div>
                          </div>
                        </div>
                        
                        {/* Table Body */}
                        <div className="divide-y divide-white/5">
                          {duePayments.map((due) => (
                            <div key={due.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-2">
                                  <p className="text-sm font-medium text-slate-100">#{due.order_id}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-slate-300">{formatDate(due.due_date)}</p>
                                </div>
                                <div className="col-span-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    due.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                    due.status === 'overdue' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 
                                    'bg-green-500/20 text-green-300 border border-green-400/30'
                                  }`}>
                                    {due.status}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  {due.days_overdue && due.days_overdue > 0 ? (
                                    <span className="text-red-300 text-sm font-medium">
                                      {due.days_overdue} days
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-sm">-</span>
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm font-semibold text-red-300">${due.amount.toFixed(2)}</p>
                                </div>
                                <div className="col-span-2">
                                  <button 
                                    onClick={() => handleShowNotes(due)}
                                    className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors flex items-center space-x-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Notes</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Outstanding Payments</h3>
                        <p className="text-slate-400">This customer has no pending or overdue payments.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Add Transaction</h2>
                  <button 
                    onClick={handleCloseTransactionModal}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm"
                    >
                      <option value="due" className="bg-slate-800">Due</option>
                      <option value="payment" className="bg-slate-800">Payment</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={transactionForm.note}
                      onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                      placeholder="Add a note for this transaction..."
                    />
                  </div>

                  {/* Notify Customer */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifyCustomer"
                      checked={transactionForm.notifyCustomer}
                      onChange={(e) => setTransactionForm({ ...transactionForm, notifyCustomer: e.target.checked })}
                      className="h-4 w-4 text-cyan-400 bg-slate-800 border border-slate-600 rounded focus:ring-cyan-400 focus:ring-2"
                    />
                    <label htmlFor="notifyCustomer" className="ml-2 text-sm text-slate-300">
                      Notify customer via SMS
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseTransactionModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTransaction}
                    disabled={!transactionForm.amount}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedDuePayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-lg w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Transaction Notes</h2>
                  <button 
                    onClick={handleCloseNotes}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-slate-100 mb-2">
                      Order #{selectedDuePayment.order_id}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                      <span>Amount: ${selectedDuePayment.amount.toFixed(2)}</span>
                      <span>Due: {formatDate(selectedDuePayment.due_date)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedDuePayment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                        selectedDuePayment.status === 'overdue' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 
                        'bg-green-500/20 text-green-300 border border-green-400/30'
                      }`}>
                        {selectedDuePayment.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notes
                    </label>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 min-h-[100px]">
                      {selectedDuePayment.notes ? (
                        <p className="text-slate-300 text-sm leading-relaxed">{selectedDuePayment.notes}</p>
                      ) : (
                        <p className="text-slate-400 text-sm italic">No notes available for this transaction.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseNotes}
                    className="px-6 py-2 bg-slate-700 text-slate-100 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Invoice</h2>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button 
                    onClick={handleCloseInvoice}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-lg">
                        LYRICZ MOTORS
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Rider's Only</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-gray-900">INVOICE ID #{selectedOrder.id}688</h3>
                    <p className="text-sm text-gray-600">{formatDate(selectedOrder.date)}, 05:21 PM</p>
                  </div>
                </div>

                {/* Company and Customer Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Lyricz Motors</h4>
                    <p className="text-sm text-gray-600">
                      25/7 Chourhash, Dhaka Highway<br />
                      Kushtia - 7000, Bangladesh<br />
                      +8801932008050<br />
                      support@lyriczmotors.com
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{customer.name}</h4>
                    <p className="text-sm text-gray-600">
                      {customer.address || 'Address not provided'}<br />
                      {customer.phone}<br />
                      {customer.email}
                    </p>
                  </div>
                </div>

                {/* Invoice Table */}
                <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">SL</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">Unit</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">1</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">ACC CABLE FZ V3</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">1</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">TK 420.00</td>
                        <td className="px-4 py-3 text-sm text-gray-900">TK 420</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">2</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">CLUTCH CABLE FZ V3</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">1</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">TK 400.00</td>
                        <td className="px-4 py-3 text-sm text-gray-900">TK 400</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">3</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">DRUM RUBBER YAMAHA</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">1</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">TK 280.00</td>
                        <td className="px-4 py-3 text-sm text-gray-900">TK 280</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">4</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">BIKE REGULAR SERVICE - S1</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">1</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">TK 900.00</td>
                        <td className="px-4 py-3 text-sm text-gray-900">TK 900</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Invoice Summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-900">VAT</span>
                    <span className="text-gray-900">TK 0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-900">Discount</span>
                    <span className="text-gray-900">TK 0.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-900">Due</span>
                    <span className="text-gray-900">TK 0.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-gray-50 px-4 rounded">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">TK {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                  Powered by oxymanager.com
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
