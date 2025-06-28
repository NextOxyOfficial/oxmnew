"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  accountId: string;
  type: "debit" | "credit";
  amount: number;
  purpose: string;
  verifiedBy: string;
  date: string;
  status: "pending" | "verified";
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

export default function BankingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "transactions">("accounts");

  // Initialize with default Primary account
  useEffect(() => {
    if (accounts.length === 0) {
      const primaryAccount: Account = {
        id: "primary-001",
        name: "Primary",
        balance: 0.00,
        createdAt: new Date().toISOString(),
      };
      setAccounts([primaryAccount]);
      setSelectedAccountId(primaryAccount.id);
    }
  }, [accounts.length]);

  // Filter and search states
  const [dateRange, setDateRange] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  // Settings modal states
  const [editableAccounts, setEditableAccounts] = useState<Account[]>([]);
  const [isSavingAccountNames, setIsSavingAccountNames] = useState(false);

  // Mock employee data
  const employees: Employee[] = [
    { id: "1", name: "John Smith", role: "Manager" },
    { id: "2", name: "Sarah Johnson", role: "Accountant" },
    { id: "3", name: "Mike Wilson", role: "Supervisor" },
    { id: "4", name: "Emily Davis", role: "Financial Analyst" },
  ];

  // Create Account Form State
  const [newAccount, setNewAccount] = useState({
    name: "",
    initialBalance: "",
  });

  // Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    type: "debit" as "debit" | "credit",
    amount: "",
    purpose: "",
    verifiedBy: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccount.name && newAccount.initialBalance) {
      const account: Account = {
        id: Math.random().toString(36).substr(2, 9),
        name: newAccount.name,
        balance: parseFloat(newAccount.initialBalance),
        createdAt: new Date().toISOString(),
      };
      setAccounts([...accounts, account]);
      // Auto-select the first account if none is selected
      if (!selectedAccountId) {
        setSelectedAccountId(account.id);
      }
      setNewAccount({ name: "", initialBalance: "" });
      setShowCreateAccountModal(false);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountId && newTransaction.amount && newTransaction.purpose && newTransaction.verifiedBy) {
      setIsAddingTransaction(true);
      
      // Simulate async operation
      setTimeout(() => {
        const transaction: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          accountId: selectedAccountId,
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          purpose: newTransaction.purpose,
          verifiedBy: newTransaction.verifiedBy,
          date: new Date().toISOString(),
          status: "verified",
        };

        // Update account balance
        setAccounts(accounts.map(account => {
          if (account.id === selectedAccountId) {
            const newBalance = newTransaction.type === "credit" 
              ? account.balance + parseFloat(newTransaction.amount)
              : account.balance - parseFloat(newTransaction.amount);
            return { ...account, balance: newBalance };
          }
          return account;
        }));

        setTransactions([transaction, ...transactions]);
        setNewTransaction({ type: "debit", amount: "", purpose: "", verifiedBy: "" });
        setIsAddingTransaction(false);
        setShowTransactionModal(false);
      }, 800);
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

  const handleSaveAccountNames = () => {
    setIsSavingAccountNames(true);
    
    // Simulate async operation
    setTimeout(() => {
      setAccounts(editableAccounts);
      setIsSavingAccountNames(false);
      setShowSettingsModal(false);
    }, 500);
  };

  const handleAccountNameChange = (accountId: string, newName: string) => {
    setEditableAccounts(editableAccounts.map(account => 
      account.id === accountId ? { ...account, name: newName } : account
    ));
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
  const accountTransactions = transactions.filter(t => t.accountId === selectedAccountId);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Unknown";
  };

  // Filter transactions based on search and filters
  const getFilteredTransactions = () => {
    let filtered = accountTransactions;

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      if (dateRange === "custom") {
        // Custom date range
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          filtered = filtered.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }
      } else {
        switch (dateRange) {
          case "today":
            filterDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case "3months":
            filterDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        filtered = filtered.filter(t => new Date(t.date) >= filterDate);
      }
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Employee filter
    if (employeeFilter !== "all") {
      filtered = filtered.filter(t => t.verifiedBy === employeeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEmployeeName(t.verifiedBy).toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)
      );
    }

    return filtered;
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
        `"${getEmployeeName(t.verifiedBy)}"`,
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
                  <td>${getEmployeeName(t.verifiedBy)}</td>
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
    
    const transactionsToUse = useFiltered ? getFilteredTransactions() : accountTransactions;
    const totalCredit = transactionsToUse
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactionsToUse
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalCredit, totalDebit };
  };

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Banking
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your accounts and track financial transactions
          </p>
        </div>



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
                {accounts.map((account, index) => {
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
                  const scheme = colorSchemes[index % 4];
                  
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[160px] ${scheme.bg} ${scheme.text}`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">{account.name}</div>
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
                          <ArrowDownLeft className="h-3 w-3 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-green-300 font-medium">Credits</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCurrency(getAccountSummary().totalCredit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-500/15 to-red-600/8 border border-red-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-md bg-red-500/20 p-1">
                          <ArrowUpRight className="h-3 w-3 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs text-red-300 font-medium">Debits</p>
                          <p className="text-sm font-bold text-red-400">
                            -{formatCurrency(getAccountSummary().totalDebit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-md bg-cyan-500/20 p-1">
                          <DollarSign className="h-3 w-3 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-xs text-cyan-300 font-medium">Balance</p>
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
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[120px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">All Types</option>
                        <option value="credit" className="bg-slate-800">Credit Only</option>
                        <option value="debit" className="bg-slate-800">Debit Only</option>
                      </select>

                      {/* Employee Filter */}
                      <select
                        value={employeeFilter}
                        onChange={(e) => setEmployeeFilter(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[140px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">All Employees</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id} className="bg-slate-800">
                            {employee.name}
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
                      {(searchTerm || typeFilter !== "all" || employeeFilter !== "all" || dateRange !== "all" || customStartDate || customEndDate) && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setTypeFilter("all");
                            setEmployeeFilter("all");
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
                        {accountTransactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
                      </h4>
                      <p className="text-slate-500 mb-3 text-sm">
                        {accountTransactions.length === 0 
                          ? "Add your first transaction to get started" 
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                      {accountTransactions.length === 0 && (
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
                                  <span>{getEmployeeName(transaction.verifiedBy)}</span>
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
                            Showing {getFilteredTransactions().length} of {accountTransactions.length} transactions
                            {(searchTerm || typeFilter !== "all" || employeeFilter !== "all" || dateRange !== "all" || customStartDate || customEndDate) && 
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
                    value={newAccount.initialBalance}
                    onChange={(e) => setNewAccount({...newAccount, initialBalance: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    placeholder="0.00"
                    required
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
                    value={newTransaction.verifiedBy}
                    onChange={(e) => setNewTransaction({...newTransaction, verifiedBy: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800">Select employee...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id} className="bg-slate-800">
                        {employee.name} - {employee.role}
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
                          Created: {new Date(account.createdAt).toLocaleDateString()}
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
