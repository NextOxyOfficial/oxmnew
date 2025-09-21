"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import type { BankAccount } from "@/types/banking";
import {
  Building2,
  CreditCard,
  DollarSign,
  Eye,
  Loader2,
  Plus,
  Settings,
  User,
  X,
  Crown,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function BankingNewPage() {
  const { isAuthenticated, loading: authLoading, user, profile } = useAuth();
  const { currency } = useCurrency();
  const formatCurrency = useCurrencyFormatter();
  const router = useRouter();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // User subscription state
  const [userSubscription, setUserSubscription] = useState<string>("free");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Function to load user subscription status
  const loadUserSubscription = useCallback(async () => {
    try {
      setIsLoadingSubscription(true);
      const subscriptionData = await ApiService.getMySubscription();
      
      if (subscriptionData?.success && subscriptionData?.subscription?.plan?.name) {
        setUserSubscription(subscriptionData.subscription.plan.name.toLowerCase());
      } else {
        setUserSubscription("free");
      }
    } catch (error) {
      console.error("Failed to load user subscription:", error);
      setUserSubscription("free");
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Check if user is premium
  const isPremiumUser = userSubscription !== "free" && userSubscription !== "";

  // Generate 10-digit account number
  const generateAccountNumber = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  // Load bank accounts
  const loadAccounts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getBankAccounts();
      console.log("Bank accounts loaded:", response);
      setAccounts(response || []);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
      setError("Failed to load bank accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Load user subscription on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserSubscription();
    }
  }, [isAuthenticated, user, loadUserSubscription]);

  // Debug profile data in main component
  useEffect(() => {
    console.log('Main Component Profile:', profile);
    console.log('Main Profile properties:', profile ? Object.keys(profile) : 'null');
    console.log('User Subscription:', userSubscription);
    console.log('Is Premium User:', isPremiumUser);
    console.log('User:', user);
  }, [profile, user, userSubscription, isPremiumUser]);

  // Create new bank account
  const handleCreateAccount = async (accountData: any) => {
    try {
      const accountNumber = generateAccountNumber();
      
      // Convert initial_balance to balance and ensure it's a number
      const payload = {
        name: accountData.name,
        account_number: accountNumber,
        balance: parseFloat(accountData.initial_balance) || 0,
        is_active: accountData.is_active !== undefined ? accountData.is_active : true,
      };
      
      console.log("Creating account with payload:", payload);
      
      const newAccount = await ApiService.createBankAccount(payload);
      
      console.log("Account created successfully:", newAccount);
      
      await loadAccounts();
      setShowCreateModal(false);
      setError(null); // Clear any previous errors
      
      // Navigate to the new account page
      router.push(`/dashboard/banking/${accountNumber}`);
    } catch (error: any) {
      console.error("Error creating bank account:", error);
      
      // Extract error message from response
      let errorMessage = "Failed to create bank account";
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter((account) =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Please log in to access banking features.</p>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Banking Management
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your bank accounts and transactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Accounts */}
          <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-cyan-500/20 p-1.5">
                <Building2 className="h-7 w-7 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-cyan-300 font-medium">Total Accounts</p>
                <p className="text-base font-bold text-cyan-400">{accounts.length}</p>
                <p className="text-xs text-cyan-500 opacity-80">All accounts</p>
              </div>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-green-500/20 p-1.5">
                <CreditCard className="h-7 w-7 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">Active</p>
                <p className="text-base font-bold text-green-400">
                  {accounts.filter(acc => acc.is_active).length}
                </p>
                <p className="text-xs text-green-500 opacity-80">Active accounts</p>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/8 border border-blue-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-blue-500/20 p-1.5">
                <DollarSign className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-300 font-medium">Total Balance</p>
                <p className="text-base font-bold text-blue-400">
                  {formatCurrency(accounts.reduce((sum, acc) => sum + parseFloat(acc.balance?.toString() || "0"), 0))}
                </p>
                <p className="text-xs text-blue-500 opacity-80">All accounts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-red-300 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Your Bank Accounts</h2>
        </div>

        {/* Bank Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Existing Account Cards */}
          {filteredAccounts.map((account, index) => {
            const colorSchemes = [
              {
                gradient: "from-blue-400/30 via-cyan-500/20 to-teal-300/15",
                border: "border-blue-500/40",
                iconBg: "from-blue-500/40 to-cyan-500/30 border-blue-400/50",
                iconColor: "text-blue-200",
                textGradient: "from-blue-200 to-cyan-100",
                bgPattern: "from-blue-300/10 to-cyan-500/5"
              },
              {
                gradient: "from-purple-400/30 via-violet-500/20 to-indigo-300/15",
                border: "border-purple-500/40",
                iconBg: "from-purple-500/40 to-violet-500/30 border-purple-400/50",
                iconColor: "text-purple-200",
                textGradient: "from-purple-200 to-violet-100",
                bgPattern: "from-purple-300/10 to-violet-500/5"
              },
              {
                gradient: "from-emerald-400/30 via-green-500/20 to-teal-300/15",
                border: "border-emerald-500/40",
                iconBg: "from-emerald-500/40 to-green-500/30 border-emerald-400/50",
                iconColor: "text-emerald-200",
                textGradient: "from-emerald-200 to-green-100",
                bgPattern: "from-emerald-300/10 to-green-500/5"
              },
              {
                gradient: "from-orange-400/30 via-amber-500/20 to-yellow-300/15",
                border: "border-orange-500/40",
                iconBg: "from-orange-500/40 to-amber-500/30 border-orange-400/50",
                iconColor: "text-orange-200",
                textGradient: "from-orange-200 to-amber-100",
                bgPattern: "from-orange-300/10 to-amber-500/5"
              },
              {
                gradient: "from-rose-400/30 via-pink-500/20 to-red-300/15",
                border: "border-rose-500/40",
                iconBg: "from-rose-500/40 to-pink-500/30 border-rose-400/50",
                iconColor: "text-rose-200",
                textGradient: "from-rose-200 to-pink-100",
                bgPattern: "from-rose-300/10 to-pink-500/5"
              }
            ];
            
            const colorScheme = colorSchemes[index % colorSchemes.length];
            
            return (
              <Link
                key={account.id}
                href={`/dashboard/banking/${account.account_number || account.id}`}
                className="group"
              >
                <div className={`relative bg-gradient-to-br ${colorScheme.gradient} border ${colorScheme.border} rounded-xl p-3 hover:brightness-110 transition-all duration-200 backdrop-blur-sm overflow-hidden`}>
                  {/* Colorful Background Pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bgPattern} rounded-xl`}></div>
                  
                  {/* Account Header */}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <div className={`p-1.5 bg-gradient-to-br ${colorScheme.iconBg} border rounded-lg shadow-md`}>
                        <Building2 className={`w-3.5 h-3.5 ${colorScheme.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white transition-colors truncate">
                          {account.name}
                        </h3>
                        <p className="text-xs text-white/70 mt-0.5 font-medium">
                          #{account.account_number || account.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-xs text-white/70 mb-0.5 font-medium">Balance</p>
                      <p className={`text-sm font-bold bg-gradient-to-r ${colorScheme.textGradient} bg-clip-text text-transparent`}>
                        {formatCurrency(parseFloat(account.balance?.toString() || "0"))}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Create Account Button Card */}
          <div 
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="relative bg-gradient-to-br from-slate-600/40 via-gray-500/30 to-slate-700/35 border-2 border-dashed border-gray-400/60 hover:border-cyan-400/70 rounded-xl p-3 hover:brightness-110 transition-all duration-200 backdrop-blur-sm overflow-hidden">
              {/* Colorful Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-blue-500/5 to-purple-500/8 rounded-xl"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-2.5 flex-1">
                  <div className="p-1.5 bg-gradient-to-br from-cyan-500/40 to-blue-500/30 border border-cyan-400/50 rounded-lg shadow-md">
                    <Plus className="w-3.5 h-3.5 text-cyan-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">
                      Create Account
                    </h3>
                    <p className="text-xs text-white/70 mt-0.5 font-medium">
                      Add new account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredAccounts.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700 rounded-xl p-8 max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-slate-700/50 to-slate-600/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                No Bank Accounts Found
              </h3>
              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                {searchTerm ? "No accounts match your search criteria." : "Create your first bank account to get started."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Account
                </button>
              )}
            </div>
          </div>
        )}

        {/* Create Account Modal */}
        {showCreateModal && (
          <CreateBankAccountModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateAccount}
            isPremium={isPremiumUser}
            accounts={accounts}
            currency={currency}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}

// Create Bank Account Modal Component
function CreateBankAccountModal({ isOpen, onClose, onSubmit, isPremium, accounts, currency, formatCurrency }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPremium: boolean;
  accounts: BankAccount[];
  currency: string;
  formatCurrency: (amount: string | number | null | undefined) => string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    initial_balance: "" as string | number,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Debug subscription data
  console.log('Modal isPremium:', isPremium);
  console.log('Modal accounts length:', accounts.length);

  const handleSubscriptionRedirect = () => {
    onClose();
    setModalError(null);
    // Redirect to subscription page
    window.location.href = '/dashboard/subscriptions';
  };

  // Reset form and error when modal opens/closes
  const handleClose = () => {
    setFormData({ name: "", initial_balance: "", is_active: true });
    setModalError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Account name is required");
      return;
    }

    setLoading(true);
    setModalError(null);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      console.error("Error in modal submit:", error);
      // Extract error message
      let errorMessage = "Failed to create account";
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setModalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-700/50 rounded-t-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-lg">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Create Bank Account
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Set up a new account to manage your finances</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {/* Error Message */}
          {modalError && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="h-4 w-4 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-red-300 text-sm font-medium">{modalError}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Name Field */}
            <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-300 uppercase tracking-wide">
                Account Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 cursor-text"
                  placeholder="e.g. Main Checking Account"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Initial Balance Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-wide">
                Initial Balance
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  onFocus={(e) => {
                    if (e.target.value === "0" || e.target.value === "") {
                      setFormData({ ...formData, initial_balance: "" });
                    }
                  }}
                  className="w-full px-3 py-2.5 pl-9 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 cursor-text"
                  placeholder={currency === 'USD' ? '$0.00' : currency === 'EUR' ? '€0.00' : currency === 'GBP' ? '£0.00' : currency === 'BDT' ? '৳0.00' : '0.00'}
                  step="0.01"
                  min="0"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {currency === 'USD' && <DollarSign className="w-3.5 h-3.5 text-gray-500" />}
                  {currency === 'EUR' && <span className="text-gray-500 text-sm font-bold">€</span>}
                  {currency === 'GBP' && <span className="text-gray-500 text-sm font-bold">£</span>}
                  {currency === 'BDT' && <span className="text-gray-500 text-xs font-bold">৳</span>}
                  {!['USD', 'EUR', 'GBP', 'BDT'].includes(currency) && <DollarSign className="w-3.5 h-3.5 text-gray-500" />}
                </div>
              </div>
              <p className="text-xs text-gray-500">Starting balance for your new account</p>
            </div>

            {/* User Status Display */}
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isPremium 
                    ? 'bg-yellow-500/20 border border-yellow-500/30' 
                    : 'bg-blue-500/20 border border-blue-500/30'
                }`}>
                  {isPremium ? (
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-300">
                      You are a {isPremium ? 'pro user' : 'free user'}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      isPremium 
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {isPremium ? 'PRO' : 'FREE'}
                    </span>
                  </div>
                  {isPremium ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {accounts.length >= 15 ? (
                        <span className="text-red-400">Premium limit reached (15/15 accounts)</span>
                      ) : (
                        `You can create ${15 - accounts.length} more accounts (${accounts.length}/15 used)`
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-400 mt-0.5">
                      {accounts.length >= 1 ? (
                        <span>You have reached the free account limit (1/1 account)</span>
                      ) : (
                        'Free plan - You can create 1 main account'
                      )}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Premium Upgrade Message for Free Users */}
              {!isPremium && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-xs font-medium text-blue-400">Upgrade to create up to 15 accounts</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Access advanced banking features and priority support
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Premium Limit Warning */}
              {isPremium && accounts.length >= 13 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-xs font-medium text-orange-400">Account Limit Warning</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        You're approaching the 15 account limit ({accounts.length}/15)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-sm text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              
              {/* Show different buttons based on user status and limits */}
              {(!isPremium && accounts.length >= 1) ? (
                <button
                  type="button"
                  onClick={handleSubscriptionRedirect}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 mr-2" />
                    Upgrade to Pro
                  </div>
                </button>
              ) : (isPremium && accounts.length >= 15) ? (
                <button
                  type="button"
                  disabled={true}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center">
                    <X className="w-3.5 h-3.5 mr-2" />
                    Limit Reached
                  </div>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25 transform hover:scale-[1.02] cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      Create Account
                    </div>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
