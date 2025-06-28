"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag, Star, Gift, Trophy, AlertTriangle, FileText, Receipt, X, Printer, StickyNote, MessageSquare } from "lucide-react";

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
  type: 'due' | 'advance';
  notes?: string;
}

interface AvailableGift {
  id: number;
  name: string;
  value: number;
}

interface TransactionForm {
  type: 'due' | 'advance';
  amount: string;
  note: string;
  notifyCustomer: boolean;
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedDuePayment, setSelectedDuePayment] = useState<DuePayment | null>(null);
  const [availableGifts, setAvailableGifts] = useState<AvailableGift[]>([]);
  const [selectedGift, setSelectedGift] = useState('');
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    type: 'due',
    amount: '',
    note: '',
    notifyCustomer: false
  });
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyOrderId, setNotifyOrderId] = useState<number | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerId = () => {
    return Array.isArray(params.id) ? params.id[0] : params.id;
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      const customerId = getCustomerId();
      
      // Mock data
      const mockCustomer: Customer = {
        id: parseInt(customerId || '1'),
        name: "John Doe",
        email: "john.doe@email.com", 
        phone: "+1 (555) 123-4567",
        address: "123 Main St, City, State 12345",
        total_orders: 12,
        total_spent: 1250.75,
        last_order_date: "2025-06-25",
        status: "active",
        created_at: "2024-01-15"
      };

      const mockOrders: Order[] = [
        { id: 1001, date: "2025-06-25", total: 89.99, status: "completed", items: 3 },
        { id: 1002, date: "2025-06-20", total: 156.50, status: "completed", items: 5 },
        { id: 1003, date: "2025-06-15", total: 45.25, status: "pending", items: 2 },
      ];

      const mockDuePayments: DuePayment[] = [
        { id: 1, order_id: 1003, amount: 45.25, due_date: "2025-07-01", type: 'due', notes: 'Pending payment for order #1003' },
        { id: 2, order_id: 1004, amount: -25.00, due_date: "2025-06-30", type: 'advance', notes: 'Advance payment for future order' },
      ];

      const mockGifts: Gift[] = [
        { id: 1, name: "Welcome Bonus", description: "New customer welcome gift", date_given: "2024-01-15", value: 10, status: "used" },
        { id: 2, name: "Loyalty Reward", description: "10 orders milestone reward", date_given: "2025-06-01", value: 25, status: "active" },
      ];

      const mockAchievements: Achievement[] = [
        { id: 1, title: "First Purchase", description: "Made your first purchase", icon: "🎉", date_earned: "2024-01-15", points: 100 },
        { id: 2, title: "Loyal Customer", description: "10+ orders completed", icon: "🏆", date_earned: "2025-06-01", points: 500 },
      ];

      const mockAvailableGifts: AvailableGift[] = [
        { id: 1, name: "Discount Voucher 10%", value: 10 },
        { id: 2, name: "Free Shipping", value: 5 },
        { id: 3, name: "Bonus Points", value: 20 },
      ];

      setCustomer(mockCustomer);
      setCustomerForm({
        name: mockCustomer.name,
        email: mockCustomer.email,
        phone: mockCustomer.phone,
        address: mockCustomer.address || ''
      });
      setOrders(mockOrders);
      setDuePayments(mockDuePayments);
      setGifts(mockGifts);
      setAchievements(mockAchievements);
      setAvailableGifts(mockAvailableGifts);
      setIsLoading(false);
    };

    fetchCustomerData();
  }, []);

  const handleShowInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoiceModal(false);
    setSelectedOrder(null);
  };

  const handleShowTransaction = () => {
    setShowTransactionModal(true);
    setTransactionForm({
      type: 'due',
      amount: '',
      note: '',
      notifyCustomer: false
    });
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

  const handleSendSMS = async (message: string) => {
    setIsSendingSMS(true);
    try {
      // Simulate SMS sending API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      alert(`SMS sent successfully to ${customer?.phone}!\nMessage: "${message}"`);
    } catch (error) {
      alert('Failed to send SMS. Please try again.');
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleSendNotification = async (payment: DuePayment) => {
    const message = `Hello ${customer?.name}, this is a reminder about your ${payment.type === 'due' ? 'due payment' : 'advance payment'} of $${Math.abs(payment.amount).toFixed(2)} for order #${payment.order_id}. Due date: ${formatDate(payment.due_date)}.`;
    await handleSendSMS(message);
  };

  const handleSendOrderNotification = async (order: Order) => {
    const statusMessage = order.status === 'completed' ? 'completed' : order.status === 'pending' ? 'is pending' : 'was cancelled';
    const message = `Hello ${customer?.name}, your order #${order.id} ${statusMessage}. Order total: $${order.total.toFixed(2)}. Order date: ${formatDate(order.date)}. Thank you for your business!`;
    await handleSendSMS(message);
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update customer data
      if (customer) {
        setCustomer({
          ...customer,
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
          address: customerForm.address
        });
      }
      
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGift = async () => {
    if (!selectedGift) return;
    
    setIsAddingGift(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const gift = availableGifts.find(g => g.id.toString() === selectedGift);
      if (gift) {
        const newGift: Gift = {
          id: Date.now(),
          name: gift.name,
          description: `Manually added gift: ${gift.name}`,
          date_given: new Date().toISOString(),
          value: gift.value,
          status: 'active'
        };
        setGifts(prev => [newGift, ...prev]);
        setSelectedGift('');
        alert('Gift added successfully!');
      }
    } catch (error) {
      alert('Failed to add gift. Please try again.');
    } finally {
      setIsAddingGift(false);
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

  if (!customer) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-100 mb-2">Customer Not Found</h3>
            <p className="text-slate-400 mb-4">
              The customer you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDue = duePayments
    .filter(payment => payment.type === 'due')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalAdvance = duePayments
    .filter(payment => payment.type === 'advance')
    .reduce((sum, payment) => sum + Math.abs(payment.amount), 0);

  const netAmount = totalDue - totalAdvance;

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Back Button and Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Customers</span>
          </button>
        </div>

        {/* Customer Header */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{customer.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 max-w-5xl">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 text-sm">Total Orders</p>
                <p className="text-xl font-bold text-white mt-1">{customer.total_orders}</p>
              </div>
              <ShoppingBag className="h-7 w-7 text-cyan-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300/80 text-sm">Total Spent</p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  ${customer.total_spent.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-7 w-7 text-green-400" />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-red-500/10 to-pink-600/10 border-red-500/30' : 'from-green-500/10 to-emerald-600/10 border-green-500/30'} border rounded-lg p-3`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${netAmount >= 0 ? 'text-red-300/80' : 'text-green-300/80'} text-sm`}>
                  {netAmount >= 0 ? 'Due Amount' : 'Advance Amount'}
                </p>
                <p className={`text-xl font-bold ${netAmount >= 0 ? 'text-red-400' : 'text-green-400'} mt-1`}>
                  ${Math.abs(netAmount).toFixed(2)}
                </p>
              </div>
              <DollarSign className={`h-7 w-7 ${netAmount >= 0 ? 'text-red-400' : 'text-green-400'}`} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300/80 text-sm">Active Gifts</p>
                <p className="text-xl font-bold text-purple-400 mt-1">
                  {gifts.filter(gift => gift.status === 'active').length}
                </p>
              </div>
              <Gift className="h-7 w-7 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl">
          <div className="flex border-b border-slate-700/50 mb-6">
            {[
              { key: 'profile', label: 'Profile', icon: <Mail className="w-4 h-4" /> },
              { key: 'orders', label: 'Purchase History', icon: <ShoppingBag className="w-4 h-4" /> },
              { key: 'due-payments', label: 'Due/Payments', icon: <DollarSign className="w-4 h-4" /> },
              { key: 'gifts', label: 'Gifts & Rewards', icon: <Gift className="w-4 h-4" /> },
              { key: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Customer Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter customer name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Member Since */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Member Since
                      </label>
                      <div className="w-full px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-slate-400 text-sm">
                        {new Date(customer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                        placeholder="Enter customer address"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-1">
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
                          <div className="col-span-2">Date</div>
                          <div className="col-span-2">Items</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-2">Actions</div>
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
                              <div className="col-span-2">
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
                              <div className="col-span-2">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => handleShowInvoice(order)}
                                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>Invoice</span>
                                  </button>
                                  <button
                                    onClick={() => handleSendOrderNotification(order)}
                                    disabled={isSendingSMS}
                                    className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors cursor-pointer disabled:opacity-50"
                                    title="Send SMS notification"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{isSendingSMS ? 'Sending...' : 'SMS'}</span>
                                  </button>
                                </div>
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

            {/* Due Payments Tab */}
            {activeTab === 'due-payments' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Due Payments</h4>
                    <button
                      onClick={handleShowTransaction}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Add Transaction
                    </button>
                  </div>
                  
                  <div className="max-w-4xl">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="col-span-2">Order ID</div>
                          <div className="col-span-3">Due Date</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-3">Notes & Actions</div>
                        </div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y divide-white/5">
                        {duePayments.map((payment) => (
                          <div key={payment.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-100">#{payment.order_id}</p>
                              </div>
                              <div className="col-span-3">
                                <p className="text-sm text-slate-300">{formatDate(payment.due_date)}</p>
                              </div>
                              <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  payment.type === 'due' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 
                                  'bg-green-500/20 text-green-300 border border-green-400/30'
                                }`}>
                                  {payment.type === 'due' ? 'Due' : 'Advance'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <p className={`text-sm font-semibold ${payment.type === 'due' ? 'text-red-300' : 'text-green-300'}`}>
                                  ${Math.abs(payment.amount).toFixed(2)}
                                </p>
                              </div>
                              <div className="col-span-3">
                                <div className="flex items-center space-x-2">
                                  {payment.notes ? (
                                    <>
                                      <button 
                                        onClick={() => handleShowNotes(payment)}
                                        className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                                      >
                                        <StickyNote className="w-4 h-4" />
                                        <span>Notes</span>
                                      </button>
                                      <button
                                        onClick={() => handleSendNotification(payment)}
                                        disabled={isSendingSMS}
                                        className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors cursor-pointer disabled:opacity-50"
                                        title="Send SMS notification"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>{isSendingSMS ? 'Sending...' : 'SMS'}</span>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-slate-500 text-sm">No notes</span>
                                  )}
                                </div>
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

            {/* Gifts Tab */}
            {activeTab === 'gifts' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Gifts & Rewards</h4>
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedGift}
                        onChange={(e) => setSelectedGift(e.target.value)}
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[200px] cursor-pointer"
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
                  
                  <div className="grid gap-4">
                    {gifts.map((gift) => (
                      <div key={gift.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-lg font-medium text-slate-100">{gift.name}</h5>
                            <p className="text-slate-400 text-sm mb-2">{gift.description}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-green-400 font-medium">${gift.value}</span>
                              <span className="text-slate-400 text-sm">{formatDate(gift.date_given)}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            gift.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                            gift.status === 'used' ? 'bg-gray-500/20 text-gray-300 border border-gray-400/30' :
                            'bg-red-500/20 text-red-300 border border-red-400/30'
                          }`}>
                            {gift.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Achievements</h4>
                  <div className="grid gap-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h5 className="text-lg font-medium text-slate-100">{achievement.title}</h5>
                            <p className="text-slate-400 text-sm mb-2">{achievement.description}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-cyan-400 font-medium">{achievement.points} points</span>
                              <span className="text-slate-400 text-sm">{formatDate(achievement.date_earned)}</span>
                            </div>
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

        {/* Invoice Modal */}
        {showInvoiceModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Invoice #{selectedOrder.id}</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => window.print()}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Print Invoice"
                    >
                      <Printer className="w-5 h-5 text-gray-600" />
                    </button>
                    <button 
                      onClick={handleCloseInvoice}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Order Details</h3>
                        <p className="text-sm text-gray-900">Order ID: #{selectedOrder.id}</p>
                        <p className="text-sm text-gray-900">Date: {formatDate(selectedOrder.date)}</p>
                        <p className="text-sm text-gray-900">Status: {selectedOrder.status}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Customer</h3>
                        <p className="text-sm text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-900">{customer.email}</p>
                        <p className="text-sm text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-900">Items ({selectedOrder.items})</span>
                        <span className="text-sm text-gray-900">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-gray-200 pt-2">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as 'due' | 'advance' })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    >
                      <option value="due">Due</option>
                      <option value="advance">Payment</option>
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
                      placeholder="Add a note for this transaction"
                    />
                  </div>

                  {/* Notify Customer */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notify-customer"
                      checked={transactionForm.notifyCustomer}
                      onChange={(e) => setTransactionForm({ ...transactionForm, notifyCustomer: e.target.checked })}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                    />
                    <label htmlFor="notify-customer" className="ml-2 text-sm text-slate-300 cursor-pointer">
                      Notify customer via SMS
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseTransactionModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTransaction}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
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
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Transaction Notes</h2>
                  <button 
                    onClick={handleCloseNotes}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Order #{selectedDuePayment.order_id}</h3>
                    <p className="text-sm text-slate-400">
                      {selectedDuePayment.type === 'due' ? 'Due Payment' : 'Advance Payment'} - ${Math.abs(selectedDuePayment.amount).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
                    <p className="text-slate-100 text-sm leading-relaxed">
                      {selectedDuePayment.notes || 'No notes available for this transaction.'}
                    </p>
                  </div>

                  {/* SMS Notification Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSendNotification(selectedDuePayment)}
                      disabled={isSendingSMS}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isSendingSMS ? 'Sending SMS...' : 'Send SMS Reminder'}</span>
                    </button>
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
