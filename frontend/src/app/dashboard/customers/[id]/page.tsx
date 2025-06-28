"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag, Star, Gift, Trophy, AlertTriangle } from "lucide-react";

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
          { id: 1, order_id: 3, amount: 120.00, due_date: "2025-07-01", status: "pending", days_overdue: 0 },
          { id: 2, order_id: 5, amount: 85.50, due_date: "2025-06-20", status: "overdue", days_overdue: 8 },
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  <div className="max-w-4xl space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <h4 className="text-sm font-medium text-slate-100">Order #{order.id}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' : 
                                'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-400">
                              {formatDate(order.date)} • {order.items} items
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-300">${order.total.toFixed(2)}</p>
                            <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                      onClick={() => {
                        // Add your transaction logic here
                        alert('Add Transaction functionality would be implemented here');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Add Transaction
                    </button>
                  </div>
                  <div className="max-w-4xl">
                    {duePayments.length > 0 ? (
                      <div className="space-y-4">
                        {duePayments.map((due) => (
                          <div key={due.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <h4 className="text-sm font-medium text-slate-100">Order #{due.order_id}</h4>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    due.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                    due.status === 'overdue' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 
                                    'bg-green-500/20 text-green-300 border border-green-400/30'
                                  }`}>
                                    {due.status}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-slate-400">
                                  Due: {formatDate(due.due_date)}
                                  {due.days_overdue && due.days_overdue > 0 && (
                                    <span className="text-red-300 ml-2">
                                      ({due.days_overdue} days overdue)
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-lg font-bold text-red-300">${due.amount.toFixed(2)}</p>
                                <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                                  Mark as Paid
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
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
      </div>
    </div>
  );
}
