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

  // Create new bank account
  const handleCreateAccount = async (accountData: any) => {
    try {
      const accountNumber = generateAccountNumber();
      const newAccount = await ApiService.createBankAccount({
        ...accountData,
        account_number: accountNumber,
      });
      
      await loadAccounts();
      setShowCreateModal(false);
      
      // Navigate to the new account page
      router.push(`/dashboard/banking-new/${accountNumber}`);
    } catch (error) {
      console.error("Error creating bank account:", error);
      setError("Failed to create bank account");
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

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/8 border border-purple-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="rounded-md bg-purple-500/20 p-1.5">
                  <Plus className="h-7 w-7 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-purple-300 font-medium">Quick Action</p>
                  <p className="text-xs text-purple-500 opacity-80">Add account</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
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

        {/* Bank Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <Link
              key={account.id}
              href={`/dashboard/banking-new/${account.account_number || account.id}`}
              className="group"
            >
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200 hover:border-cyan-500/50 group-hover:transform group-hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10">
                {/* Account Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 rounded-lg">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-cyan-100 transition-colors">
                        {account.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        #{account.account_number || account.id}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-cyan-500/10 transition-colors">
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>

                {/* Balance */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {formatCurrency(parseFloat(account.balance?.toString() || "0"))}
                  </p>
                </div>

                {/* Account Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-400">
                    <User className="w-4 h-4 mr-2" />
                    <span>{account.owner_username || user?.username}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    account.is_active 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {account.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
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
          />
        )}
      </div>
    </div>
  );
}

// Create Bank Account Modal Component
function CreateBankAccountModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    initial_balance: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error in modal submit:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Create Bank Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter account name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Balance
            </label>
            <input
              type="number"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
              Account is active
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
