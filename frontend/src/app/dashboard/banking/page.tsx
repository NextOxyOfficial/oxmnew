"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  X,
  Check,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useBanking } from "@/hooks/useBanking";
import { useAuth } from "@/contexts/AuthContext";
import type { BankAccount, Transaction, Employee, TransactionFilters } from "@/types/banking";

export default function BankingPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const {
    accounts,
    transactions,
    employees,
    selectedAccountId,
    selectedAccount,
    loading,
    error,
    setSelectedAccountId,
    setError,
    createAccount,
    updateAccount,
    createTransaction,
    loadTransactions,
  } = useBanking();

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8 text-center">
          <Loader2 className="h-8 w-8 text-cyan-400 mx-auto mb-3 animate-spin" />
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium mb-2">Authentication Required</p>
          <p className="text-red-300 text-sm">Please log in to access the banking features.</p>
        </div>
      </div>
    );
  }

  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isSavingAccountNames, setIsSavingAccountNames] = useState(false);

  // Filter and search states
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    status: "all",
    verified_by: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // Settings modal states
  const [editableAccounts, setEditableAccounts] = useState<BankAccount[]>([]);

  // Create Account Form State
  const [newAccount, setNewAccount] = useState({
    name: "",
    balance: 0,
  });

  // Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    type: "debit" as "debit" | "credit",
    amount: "",
    purpose: "",
    verified_by: "",
  });

  // Load transactions with current filters
  const loadFilteredTransactions = useCallback(() => {
    if (!selectedAccountId) return;

    const currentFilters: TransactionFilters = {
      ...filters,
      search: searchTerm,
    };

    // Handle date range
    if (dateRange === "custom" && customStartDate && customEndDate) {
      currentFilters.date_from = customStartDate;
      currentFilters.date_to = customEndDate;
    } else if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          currentFilters.date_from = filterDate.toISOString().split('T')[0];
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          currentFilters.date_from = filterDate.toISOString().split('T')[0];
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          currentFilters.date_from = filterDate.toISOString().split('T')[0];
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          currentFilters.date_from = filterDate.toISOString().split('T')[0];
          break;
      }
    }

    loadTransactions(selectedAccountId, currentFilters);
  }, [selectedAccountId, filters, searchTerm, dateRange, customStartDate, customEndDate, loadTransactions]);

  // Update transactions when filters change
  useEffect(() => {
    loadFilteredTransactions();
  }, [loadFilteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccount.name) {
      try {
        await createAccount({
          name: newAccount.name,
          balance: newAccount.balance,
        });
        setNewAccount({ name: "", balance: 0 });
        setShowCreateAccountModal(false);
      } catch (err) {
        // Error is handled by the hook
      }
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountId && newTransaction.amount && newTransaction.purpose && newTransaction.verified_by) {
      try {
        setIsAddingTransaction(true);
        
        await createTransaction({
          account: selectedAccountId,
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          purpose: newTransaction.purpose,
          verified_by: newTransaction.verified_by,
          status: "verified",
        });

        setNewTransaction({ type: "debit", amount: "", purpose: "", verified_by: "" });
        setShowTransactionModal(false);
      } catch (err) {
        // Error is handled by the hook
      } finally {
        setIsAddingTransaction(false);
      }
    }
  };

  const handleDateRangeChange = (value: string) => {
    if (value === "custom") {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
      setShowDateRangeModal(true);
    } else {
      setDateRange(value);
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const applyCustomDateRange = () => {
    setCustomStartDate(tempStartDate);
    setCustomEndDate(tempEndDate);
    setDateRange("custom");
    setShowDateRangeModal(false);
  };

  const cancelCustomDateRange = () => {
    setTempStartDate("");
    setTempEndDate("");
    setShowDateRangeModal(false);
    if (dateRange === "custom" && (!customStartDate || !customEndDate)) {
      setDateRange("all");
    }
  };

  const handleOpenSettings = () => {
    setEditableAccounts([...accounts]);
    setShowSettingsModal(true);
  };

  const handleSaveAccountNames = async () => {
    setIsSavingAccountNames(true);
    
    try {
      // Update each account that has changed
      for (const editedAccount of editableAccounts) {
        const originalAccount = accounts.find(acc => acc.id === editedAccount.id);
        if (originalAccount && originalAccount.name !== editedAccount.name) {
          await updateAccount(editedAccount.id, { name: editedAccount.name });
        }
      }
      setShowSettingsModal(false);
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsSavingAccountNames(false);
    }
  };

  const handleAccountNameChange = (accountId: string, newName: string) => {
    setEditableAccounts(editableAccounts.map(account => 
      account.id === accountId ? { ...account, name: newName } : account
    ));
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.full_name || `${employee.first_name} ${employee.last_name}`.trim() || employee.username : "Unknown";
  };

  // Filter transactions (now using local state since transactions are already filtered by backend)
  const getFilteredTransactions = () => {
    // Transactions are already filtered by the backend API call
    return transactions;
  };

  // Download functions
  const downloadCSV = () => {
    const filteredTransactions = getFilteredTransactions();
    if (filteredTransactions.length === 0) return;

    const headers = ['Date', 'Type', 'Amount', 'Purpose', 'Verified By', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.amount,
        `"${t.purpose}"`,
        `"${getEmployeeName(t.verified_by)}"`,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAccount?.name || 'account'}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const filteredTransactions = getFilteredTransactions();
    if (filteredTransactions.length === 0) return;

    // Create a simple HTML structure for PDF generation
    const htmlContent = `
      <html>
        <head>
          <title>Transaction Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>${selectedAccount?.name || 'Account'} Transaction Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Credits: +$${getAccountSummary(true).totalCredit.toFixed(2)}</p>
            <p>Total Debits: -$${getAccountSummary(true).totalDebit.toFixed(2)}</p>
            <p>Net Amount: $${(getAccountSummary(true).totalCredit - getAccountSummary(true).totalDebit).toFixed(2)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Verified By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td style="color: ${t.type === 'credit' ? 'green' : 'red'}">${t.type.toUpperCase()}</td>
                  <td style="color: ${t.type === 'credit' ? 'green' : 'red'}">${t.type === 'credit' ? '+' : '-'}$${t.amount.toFixed(2)}</td>
                  <td>${t.purpose}</td>
                  <td>${getEmployeeName(t.verified_by)}</td>
                  <td>${t.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Calculate totals for selected account (use filtered transactions for display)
  const getAccountSummary = (useFiltered = false) => {
    if (!selectedAccountId) return { totalCredit: 0, totalDebit: 0 };
    
    const transactionsToUse = useFiltered ? getFilteredTransactions() : transactions;
    const totalCredit = transactionsToUse
      .filter((t: Transaction) => t.type === "credit")
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const totalDebit = transactionsToUse
      .filter((t: Transaction) => t.type === "debit")
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    
    return { totalCredit, totalDebit };
  };

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Banking
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your accounts and track financial transactions
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8 text-center mb-6">
            <Loader2 className="h-8 w-8 text-cyan-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-400">Loading banking data...</p>
          </div>
        )}



        {/* Main Content */}
        {accounts.length === 0 ? (
          /* No Accounts State */
          <div className="bg-slate-900/50 border-2 border-dashed border-slate-700/50 rounded-xl p-12 text-center">
            <CreditCard className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No accounts yet</h3>
            <p className="text-slate-500 mb-4">Create your first account to get started</p>
            <button
              onClick={() => setShowCreateAccountModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
            >
              Create First Account
            </button>
          </div>
        ) : (
          /* Accounts Tab Layout */
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
            {/* Account Tabs */}
            <div className="border-b border-slate-700/50">
              <div className="flex flex-wrap">
                {[...accounts]
                  .sort((a, b) => {
                    // Always put Primary account first
                    if (a.name === "Primary") return -1;
                    if (b.name === "Primary") return 1;
                    // Then sort by creation date (newest first)
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((account, index) => {
                  const colorSchemes = [
                    { 
                      bg: selectedAccountId === account.id ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10" : "hover:bg-blue-500/10",
                      text: selectedAccountId === account.id ? "text-blue-300" : "text-slate-400 hover:text-blue-300",
                      accent: "text-blue-400",
                      border: "border-b-2 border-blue-500"
                    },
                    { 
                      bg: selectedAccountId === account.id ? "bg-gradient-to-r from-purple-500/20 to-purple-600/10" : "hover:bg-purple-500/10",
                      text: selectedAccountId === account.id ? "text-purple-300" : "text-slate-400 hover:text-purple-300",
                      accent: "text-purple-400",
                      border: "border-b-2 border-purple-500"
                    },
                    { 
                      bg: selectedAccountId === account.id ? "bg-gradient-to-r from-green-500/20 to-green-600/10" : "hover:bg-green-500/10",
                      text: selectedAccountId === account.id ? "text-green-300" : "text-slate-400 hover:text-green-300",
                      accent: "text-green-400",
                      border: "border-b-2 border-green-500"
                    },
                    { 
                      bg: selectedAccountId === account.id ? "bg-gradient-to-r from-orange-500/20 to-orange-600/10" : "hover:bg-orange-500/10",
                      text: selectedAccountId === account.id ? "text-orange-300" : "text-slate-400 hover:text-orange-300",
                      accent: "text-orange-400",
                      border: "border-b-2 border-orange-500"
                    }
                  ];
                  
                  // Use different color scheme for Primary account (always blue)
                  const scheme = account.name === "Primary" ? colorSchemes[0] : colorSchemes[index % 4];
                  
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[160px] ${scheme.bg} ${scheme.text}`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {account.name}
                          {account.name === "Primary" && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                              Main
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${selectedAccountId === account.id ? scheme.accent : 'text-slate-500'}`}>
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                      {selectedAccountId === account.id && (
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${scheme.border.replace('border-b-2', 'bg-gradient-to-r')}`}></div>
                      )}
                    </button>
                  );
                })}
                
                {/* Create Account Tab - Only show if less than 4 accounts */}
                {accounts.length < 4 && (
                  <button
                    onClick={() => setShowCreateAccountModal(true)}
                    className="px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 text-slate-400 hover:text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-cyan-600/5 border-l border-slate-700/50 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-semibold text-sm">Create Account</div>
                      <div className="text-xs text-slate-500">Add new account</div>
                    </div>
                  </button>
                )}

                {/* Spacer to push settings to the right */}
                <div className="flex-1"></div>

                {/* Settings Tab */}
                <button
                  onClick={handleOpenSettings}
                  className="px-3 py-3 font-medium transition-all duration-200 relative flex items-center justify-center text-slate-400 hover:text-pink-300 hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-pink-600/5 border-l border-slate-700/50 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Account Content */}
            {selectedAccountId && (
              <div>
                {/* Account Summary */}
                <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-700/20">
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-md bg-green-500/20 p-1">
                          <ArrowDownLeft className="h-7 w-7 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-green-300 font-medium">Credits</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCurrency(getAccountSummary().totalCredit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-500/15 to-red-600/8 border border-red-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-md bg-red-500/20 p-1">
                          <ArrowUpRight className="h-7 w-7 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm text-red-300 font-medium">Debits</p>
                          <p className="text-sm font-bold text-red-400">
                            -{formatCurrency(getAccountSummary().totalDebit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-md bg-cyan-500/20 p-1">
                          <DollarSign className="h-7 w-7 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm text-cyan-300 font-medium">Balance</p>
                          <p className={`text-sm font-bold ${selectedAccount && selectedAccount.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                            {selectedAccount ? formatCurrency(selectedAccount.balance) : '$0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/10">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-3 xl:space-y-0 gap-3">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 flex-1">
                      {/* Add Transaction Button */}
                      <button
                        onClick={() => setShowTransactionModal(true)}
                        className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center gap-2 whitespace-nowrap lg:w-auto w-full justify-center cursor-pointer active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Transaction</span>
                      </button>

                      {/* Search */}
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-9 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>

                      {/* Type Filter */}
                      <select
                        value={filters.type || "all"}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[120px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">All Types</option>
                        <option value="credit" className="bg-slate-800">Credit Only</option>
                        <option value="debit" className="bg-slate-800">Debit Only</option>
                      </select>

                      {/* Employee Filter */}
                      <select
                        value={filters.verified_by || "all"}
                        onChange={(e) => setFilters(prev => ({ ...prev, verified_by: e.target.value }))}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[140px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">All Employees</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id} className="bg-slate-800">
                            {employee.full_name || `${employee.first_name} ${employee.last_name}`.trim() || employee.username}
                          </option>
                        ))}
                      </select>

                      {/* Date Range Selector */}
                      <select
                        value={dateRange}
                        onChange={(e) => handleDateRangeChange(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[120px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">All Time</option>
                        <option value="today" className="bg-slate-800">Today</option>
                        <option value="week" className="bg-slate-800">Last Week</option>
                        <option value="month" className="bg-slate-800">Last Month</option>
                        <option value="3months" className="bg-slate-800">Last 3 Months</option>
                        <option value="custom" className="bg-slate-800">Custom Range</option>
                      </select>

                      {/* Custom Date Range Display */}
                      {dateRange === "custom" && customStartDate && customEndDate && (
                        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/30 px-2 py-1.5 rounded-lg border border-slate-700/50">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(customStartDate).toLocaleDateString()} - {new Date(customEndDate).toLocaleDateString()}</span>
                          <button
                            onClick={() => setShowDateRangeModal(true)}
                            className="text-cyan-400 hover:text-cyan-300 ml-1 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Clear Filters */}
                      {(searchTerm || filters.type !== "all" || filters.verified_by !== "all" || dateRange !== "all" || customStartDate || customEndDate) && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilters({ type: "all", status: "all", verified_by: "all" });
                            setDateRange("all");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setTempStartDate("");
                            setTempEndDate("");
                          }}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
                  {getFilteredTransactions().length === 0 ? (
                    <div className="p-8 text-center">
                      <DollarSign className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                      <h4 className="text-base font-medium text-slate-300 mb-2">
                        {transactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
                      </h4>
                      <p className="text-slate-500 mb-3 text-sm">
                        {transactions.length === 0 
                          ? "Add your first transaction to get started" 
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                      {transactions.length === 0 && (
                        <button
                          onClick={() => setShowTransactionModal(true)}
                          className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                        >
                          Add First Transaction
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700/50">
                          <tr>
                            <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">Type</th>
                            <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">Amount</th>
                            <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">Purpose</th>
                            <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">Verified By</th>
                            <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">Date</th>
                            <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredTransactions().map((transaction) => (
                            <tr key={transaction.id} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  {transaction.type === "credit" ? (
                                    <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                                  )}
                                  <span className={`font-medium capitalize text-xs ${
                                    transaction.type === "credit" ? "text-green-500" : "text-red-500"
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </div>
                              </td>
                              <td className={`py-3 px-4 font-semibold text-sm ${
                                transaction.type === "credit" ? "text-green-500" : "text-red-500"
                              }`}>
                                {transaction.type === "credit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="py-3 px-4 text-white text-sm">{transaction.purpose}</td>
                              <td className="py-3 px-4 text-slate-400 text-sm">
                                <div className="flex items-center space-x-1.5">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{getEmployeeName(transaction.verified_by)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-sm">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center space-x-1 w-fit">
                                  <Check className="h-3 w-3" />
                                  <span>Verified</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Results Summary */}
                      <div className="p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/20 to-slate-700/20">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            Showing {getFilteredTransactions().length} of {transactions.length} transactions
                            {(searchTerm || filters.type !== "all" || filters.verified_by !== "all" || dateRange !== "all" || customStartDate || customEndDate) && 
                              " (filtered)"
                            }
                          </span>
                          {getFilteredTransactions().length > 0 && (
                            <div className="flex items-center space-x-3">
                              <span className="text-green-400 text-xs">
                                +{formatCurrency(getAccountSummary(true).totalCredit)}
                              </span>
                              <span className="text-red-400 text-xs">
                                -{formatCurrency(getAccountSummary(true).totalDebit)}
                              </span>
                              <span className="text-cyan-400 font-medium text-xs">
                                Net: {formatCurrency(getAccountSummary(true).totalCredit - getAccountSummary(true).totalDebit)}
                              </span>
                              
                              {/* Export Options */}
                              <div className="flex items-center space-x-1.5 ml-3 pl-3 border-l border-slate-600/50">
                                <span className="text-xs text-slate-500">Export:</span>
                                <button
                                  onClick={downloadCSV}
                                  className="flex items-center space-x-1 px-1.5 py-1 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded hover:bg-slate-600/50 hover:text-white transition-all duration-200 text-xs cursor-pointer"
                                >
                                  <FileSpreadsheet className="h-3 w-3" />
                                  <span>CSV</span>
                                </button>
                                <button
                                  onClick={downloadPDF}
                                  className="flex items-center space-x-1 px-1.5 py-1 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded hover:bg-slate-600/50 hover:text-white transition-all duration-200 text-xs cursor-pointer"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Account Modal */}
        {showCreateAccountModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-auto backdrop-blur-md">
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white">Create New Account</h2>
                <button
                  onClick={() => setShowCreateAccountModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-700/50 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    placeholder="Enter account name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Initial Opening Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({...newAccount, balance: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateAccountModal(false)}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-3 rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-auto backdrop-blur-md">
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-700/50 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: "debit"})}
                      className={`p-2.5 rounded-lg border-2 transition-all flex items-center justify-center space-x-1.5 text-sm cursor-pointer ${
                        newTransaction.type === "debit"
                          ? "border-red-500/50 bg-red-500/10"
                          : "border-slate-600/50 hover:border-slate-500/50"
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                      <span className="text-white">Debit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: "credit"})}
                      className={`p-2.5 rounded-lg border-2 transition-all flex items-center justify-center space-x-1.5 text-sm cursor-pointer ${
                        newTransaction.type === "credit"
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-slate-600/50 hover:border-slate-500/50"
                      }`}
                    >
                      <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      <span className="text-white">Credit</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={newTransaction.purpose}
                    onChange={(e) => setNewTransaction({...newTransaction, purpose: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    placeholder="Enter transaction purpose..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Verified By (Employee)
                  </label>
                  <select
                    value={newTransaction.verified_by}
                    onChange={(e) => setNewTransaction({...newTransaction, verified_by: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800">Select employee...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id} className="bg-slate-800">
                        {employee.full_name || `${employee.first_name} ${employee.last_name}`.trim() || employee.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-3 rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingTransaction}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isAddingTransaction ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      "Add Transaction"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Date Range Modal */}
        {showDateRangeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Select Date Range</h2>
                <button
                  onClick={cancelCustomDateRange}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                  />
                </div>

                {tempStartDate && tempEndDate && (
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      <span>Selected range: {new Date(tempStartDate).toLocaleDateString()} - {new Date(tempEndDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelCustomDateRange}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-4 rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyCustomDateRange}
                    disabled={!tempStartDate || !tempEndDate}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto backdrop-blur-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">Account Settings</h2>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-700/50 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="text-sm text-slate-400 mb-3">
                    Manage your account names. Balances are view-only and updated through transactions.
                  </div>

                  <div className="space-y-3">
                    {editableAccounts.map((account) => (
                      <div key={account.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between space-x-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                              Account Name
                            </label>
                            <input
                              type="text"
                              value={account.name}
                              onChange={(e) => handleAccountNameChange(account.id, e.target.value)}
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                              placeholder="Enter account name..."
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                              Current Balance
                            </label>
                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg py-2 px-3 text-sm">
                              <span className={`font-semibold ${account.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(account.balance)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Created: {new Date(account.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}

                    <div className="flex space-x-2 pt-3 border-t border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setShowSettingsModal(false)}
                        className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-3 rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAccountNames}
                        disabled={isSavingAccountNames}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSavingAccountNames ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
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
