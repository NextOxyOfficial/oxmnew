"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import type {
  BankAccount,
  Transaction,
  TransactionFilters,
  TransactionWithBalance,
} from "@/types/banking";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function BankAccountPage() {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading, user, profile } = useAuth();
  const { currency } = useCurrency();
  const formatCurrency = useCurrencyFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [allAccounts, setAllAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    status: "all", 
    date_from: "",
    date_to: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load account details
  const loadAccount = useCallback(async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log("Loading account with ID:", id);
      
      // First try to find by account_number, then by id
      const accounts = await ApiService.getBankAccounts();
      console.log("All accounts:", accounts);
      
      // Store all accounts for tabs
      setAllAccounts(accounts);
      
      const account = accounts.find((acc: BankAccount) => 
        acc.account_number === id || acc.id === id
      );
      
      console.log("Found account:", account);
      
      if (!account) {
        setError("Bank account not found");
        return;
      }
      
      setAccount(account);
      await loadTransactions(account.id);
    } catch (error) {
      console.error("Error loading account:", error);
      setError("Failed to load account details");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  // Load transactions for the account
  const loadTransactions = useCallback(async (accountId: string) => {
    try {
      console.log("Loading transactions for account:", accountId);
      console.log("Current filters:", filters);
      console.log("Current page:", currentPage);
      
      const response = await ApiService.getAccountTransactions(accountId, {
        page: currentPage.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, value || ""])
        ),
      });
      
      console.log("Transactions API response:", response);
      
      // Calculate running balance
      let runningBalance = parseFloat(account?.balance?.toString() || "0");
      let transactionsArray: Transaction[] = [];
      let totalCount = 0;

      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        transactionsArray = response;
        totalCount = response.length;
      } else {
        transactionsArray = response.results || [];
        totalCount = response.count || 0;
      }

      console.log("Processed transactions array:", transactionsArray);
      console.log("Total count:", totalCount);

      const transactionsWithBalance: TransactionWithBalance[] = transactionsArray.map((transaction: Transaction) => {
        if (transaction.type === "credit") {
          runningBalance -= parseFloat(transaction.amount.toString());
        } else {
          runningBalance += parseFloat(transaction.amount.toString());
        }
        return {
          ...transaction,
          runningBalance: runningBalance,
        };
      }).reverse(); // Reverse to show latest first but with correct running balance

      console.log("Final transactions with balance:", transactionsWithBalance);

      setTransactions(transactionsWithBalance);
      setTotalPages(Math.ceil(totalCount / 20));
    } catch (error) {
      console.error("Error loading transactions:", error);
      setError("Failed to load transactions");
    }
  }, [currentPage, filters, account?.balance]);

  // Handle switching to a different account tab
  const switchToAccount = useCallback((accountId: string, accountNumber?: string) => {
    const newId = accountNumber || accountId;
    router.push(`/dashboard/banking-new/${newId}`);
  }, [router]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // Keyboard navigation for account tabs
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        const currentIndex = allAccounts.findIndex(acc => acc.account_number === id || acc.id === id);
        
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (currentIndex > 0) {
              const prevAccount = allAccounts[currentIndex - 1];
              switchToAccount(prevAccount.id, prevAccount.account_number);
            }
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (currentIndex < allAccounts.length - 1) {
              const nextAccount = allAccounts[currentIndex + 1];
              switchToAccount(nextAccount.id, nextAccount.account_number);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [allAccounts, id, switchToAccount]);

  // Handle add transaction
  const handleAddTransaction = async (transactionData: any) => {
    try {
      if (!account) return;
      
      console.log("Creating transaction:", transactionData);
      
      // Prepare transaction data, handling verified_by field
      const submissionData = {
        account: account.id,
        ...transactionData,
        status: "verified", // Always set as verified
        verified_by: transactionData.verified_by ? parseInt(transactionData.verified_by) : null,
      };
      
      console.log("Submitting transaction data:", submissionData);
      
      const result = await ApiService.createTransaction(submissionData);
      console.log("Transaction created successfully:", result);
      
      // Clear any previous errors
      setError(null);
      
      // Force a fresh reload by resetting current state
      setTransactions([]);
      setCurrentPage(1);
      
      // Reload account and transactions
      await loadAccount();
      setShowAddTransactionModal(false);
      
      console.log("Account reloaded after transaction creation");
    } catch (error) {
      console.error("Error creating transaction:", error);
      setError("Failed to create transaction");
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

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

  if (error && !account) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <Link
          href="/dashboard/banking-new"
          className="inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Banking
        </Link>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 6px;
          border: 1px solid rgba(30, 41, 59, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #475569 rgba(30, 41, 59, 0.3);
        }
      `}</style>
      <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
          <div className="flex items-center space-x-4 mb-2">
            <Link
              href="/dashboard/banking-new"
              className="inline-flex items-center px-3 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer text-sm font-medium text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Accounts
            </Link>
          </div>

        {/* Account Tabs */}
        {allAccounts.length > 1 && (
          <div className="mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Switch Account
                </h3>
                <span className="text-xs text-gray-500">
                  {allAccounts.findIndex(acc => acc.account_number === id || acc.id === id) + 1} of {allAccounts.length}
                </span>
              </div>
              
              <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
                {allAccounts.map((acc) => {
                  const isActive = (acc.account_number === id || acc.id === id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => switchToAccount(acc.id, acc.account_number)}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 min-w-fit cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg ring-2 ring-cyan-400/20"
                          : "text-gray-400 hover:text-white hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          isActive
                            ? "bg-white"
                            : acc.is_active
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`} />
                        <div className="text-left">
                          <div className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {acc.name}
                          </div>
                          <div className={`text-xs ${
                            isActive ? 'text-cyan-100' : 'text-gray-500'
                          }`}>
                            #{acc.account_number || acc.id}
                          </div>
                        </div>
                      </div>
                      <div className={`text-right border-l ${
                        isActive ? 'border-white/20 text-white' : 'border-slate-600 text-gray-400'
                      } pl-3`}>
                        <div className={`text-sm font-bold ${
                          isActive ? 'text-white' : 'text-gray-300'
                        }`}>
                          {formatCurrency(parseFloat(acc.balance?.toString() || "0"))}
                        </div>
                        <div className={`text-xs ${
                          isActive ? 'text-cyan-100' : 'text-gray-500'
                        }`}>
                          Balance
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Navigation Hint */}
              <div className="mt-3 pt-2 border-t border-slate-700">
                <p className="text-xs text-gray-500 text-center flex items-center justify-center space-x-4">
                  <span className="flex items-center">
                    💡 Click any account to switch instantly
                  </span>
                  <span className="hidden sm:flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">←→</kbd>
                    <span>to navigate</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-green-500/20 p-1.5">
                <DollarSign className="h-7 w-7 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">Current Balance</p>
                <p className="text-base font-bold text-green-400">
                  {formatCurrency(parseFloat(account?.balance?.toString() || "0"))}
                </p>
                <p className="text-xs text-green-500 opacity-80">Available funds</p>
              </div>
            </div>
          </div>

          {/* Total Credits */}
          <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/8 border border-blue-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-blue-500/20 p-1.5">
                <ArrowDownLeft className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-300 font-medium">Total Credits</p>
                <p className="text-base font-bold text-blue-400">
                  {formatCurrency(parseFloat(account?.total_credits?.toString() || "0"))}
                </p>
                <p className="text-xs text-blue-500 opacity-80">Money in</p>
              </div>
            </div>
          </div>

          {/* Total Debits */}
          <div className="bg-gradient-to-br from-red-500/15 to-red-600/8 border border-red-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-red-500/20 p-1.5">
                <ArrowUpRight className="h-7 w-7 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-red-300 font-medium">Total Debits</p>
                <p className="text-base font-bold text-red-400">
                  {formatCurrency(parseFloat(account?.total_debits?.toString() || "0"))}
                </p>
                <p className="text-xs text-red-500 opacity-80">Money out</p>
              </div>
            </div>
          </div>
                  </div>

        {/* Transaction Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Transactions</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddTransactionModal(true)}
                className="inline-flex items-center px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">All Types</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ type: e.target.value as "credit" | "debit" | "all" })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">All Employees</label>
              <select
                value={filters.verified_by || ""}
                onChange={(e) => handleFilterChange({ verified_by: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="">All Employees</option>
                {/* Employee options will be populated from API */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">All Time</label>
              <select
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 mt-6" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 mt-6 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    AMOUNT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    PURPOSE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    VERIFIED BY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    RUNNING BALANCE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {transaction.type === "credit" ? (
                          <div className="flex items-center text-green-400">
                            <ArrowDownLeft className="w-4 h-4 mr-2" />
                            Credit
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400">
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Debit
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        transaction.type === "credit" ? "text-green-400" : "text-red-400"
                      }`}>
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(parseFloat(transaction.amount.toString()))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {transaction.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.verified_by_details ? (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-400" />
                          {transaction.verified_by_details.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        ✓ Verified
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                      +{formatCurrency(transaction.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Transactions Found</h3>
                <p className="text-gray-400 mb-6">No transactions match your current filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <AddTransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => setShowAddTransactionModal(false)}
          onSubmit={handleAddTransaction}
          account={account}
        />
      )}
      </div>
    </div>
    </>
  );
}

// Add Transaction Modal Component
function AddTransactionModal({ isOpen, onClose, onSubmit, account }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  account: BankAccount | null;
}) {
  const [formData, setFormData] = useState({
    type: "credit" as "credit" | "debit",
    amount: 0,
    purpose: "",
    verified_by: "",
  });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen && employees.length === 0) {
      setLoadingEmployees(true);
      ApiService.getEmployees()
        .then((response) => {
          // Handle both array and paginated response formats
          const employeeData = Array.isArray(response) ? response : response.results || [];
          setEmployees(employeeData);
        })
        .catch((error) => {
          console.error("Error loading employees:", error);
        })
        .finally(() => {
          setLoadingEmployees(false);
        });
    }
  }, [isOpen, employees.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.purpose.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        type: "credit",
        amount: 0,
        purpose: "",
        verified_by: "",
      });
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
          <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
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
              Account
            </label>
            <input
              type="text"
              value={account?.name || ""}
              disabled
              className="w-full px-3 py-2 bg-slate-600 border border-slate-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as "credit" | "debit" })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="credit">Credit (Money In)</option>
              <option value="debit">Debit (Money Out)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Purpose *
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter transaction purpose"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Verified By
            </label>
            <select
              value={formData.verified_by}
              onChange={(e) => setFormData({ ...formData, verified_by: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              disabled={loadingEmployees}
            >
              <option value="">Select Employee (Optional)</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name || employee.name || `${employee.first_name} ${employee.last_name}`}
                </option>
              ))}
            </select>
            {loadingEmployees && (
              <p className="text-xs text-gray-400 mt-1">Loading employees...</p>
            )}
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
              disabled={loading || !formData.amount || !formData.purpose.trim()}
              className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </div>
              ) : (
                "Add Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
