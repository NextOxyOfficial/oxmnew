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
      setShowTransactionModal(false);
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
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg"
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
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`px-6 py-4 font-medium transition-colors relative flex items-center space-x-3 ${
                      selectedAccountId === account.id
                        ? "text-cyan-400 bg-slate-800/50"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">{account.name}</div>
                      <div className={`text-sm ${selectedAccountId === account.id ? 'text-cyan-300' : 'text-slate-500'}`}>
                        {formatCurrency(account.balance)}
                      </div>
                    </div>
                    {selectedAccountId === account.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"></div>
                    )}
                  </button>
                ))}
                
                {/* Create Account Tab */}
                <button
                  onClick={() => setShowCreateAccountModal(true)}
                  className="px-6 py-4 font-medium transition-colors relative flex items-center space-x-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30 border-l border-slate-700/50"
                >
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Create Account</div>
                    <div className="text-sm text-slate-500">Add new account</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Content */}
            {selectedAccountId && (
              <div>
                {/* Account Summary */}
                <div className="p-6 border-b border-slate-700/50">
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full bg-green-500/20 p-2 flex-shrink-0">
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-400">Total Credit</p>
                          <p className="text-lg font-bold text-green-500 mt-0.5">
                            +{formatCurrency(getAccountSummary().totalCredit)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-green-400 mt-1">Money received</p>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full bg-red-500/20 p-2 flex-shrink-0">
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-400">Total Debit</p>
                          <p className="text-lg font-bold text-red-500 mt-0.5">
                            -{formatCurrency(getAccountSummary().totalDebit)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-red-400 mt-1">Money spent</p>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full bg-cyan-500/20 p-2 flex-shrink-0">
                          <DollarSign className="h-4 w-4 text-cyan-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-400">Current Balance</p>
                          <p className={`text-lg font-bold mt-0.5 ${selectedAccount && selectedAccount.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {selectedAccount ? formatCurrency(selectedAccount.balance) : '$0.00'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-cyan-400 mt-1">Available funds</p>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-4 xl:space-y-0 gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 flex-1">
                      {/* Add Transaction Button */}
                      <button
                        onClick={() => setShowTransactionModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center gap-2 whitespace-nowrap lg:w-auto w-full justify-center"
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
                          className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                      </div>

                      {/* Type Filter */}
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[140px]"
                      >
                        <option value="all" className="bg-slate-800">All Types</option>
                        <option value="credit" className="bg-slate-800">Credit Only</option>
                        <option value="debit" className="bg-slate-800">Debit Only</option>
                      </select>

                      {/* Employee Filter */}
                      <select
                        value={employeeFilter}
                        onChange={(e) => setEmployeeFilter(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[160px]"
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
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[140px]"
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
                        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/50">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(customStartDate).toLocaleDateString()} - {new Date(customEndDate).toLocaleDateString()}</span>
                          <button
                            onClick={() => setShowDateRangeModal(true)}
                            className="text-cyan-400 hover:text-cyan-300 ml-1"
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
                          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium whitespace-nowrap"
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
                    <div className="p-12 text-center">
                      <DollarSign className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-slate-300 mb-2">
                        {accountTransactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
                      </h4>
                      <p className="text-slate-500 mb-4">
                        {accountTransactions.length === 0 
                          ? "Add your first transaction to get started" 
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                      {accountTransactions.length === 0 && (
                        <button
                          onClick={() => setShowTransactionModal(true)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg"
                        >
                          Add First Transaction
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50">
                          <tr className="border-b border-slate-700/50">
                            <th className="text-left py-3 px-6 text-slate-300 font-medium text-sm">Type</th>
                            <th className="text-left py-3 px-6 text-slate-300 font-medium text-sm">Amount</th>
                            <th className="text-left py-3 px-6 text-slate-300 font-medium text-sm">Purpose</th>
                            <th className="text-left py-3 px-6 text-slate-300 font-medium text-sm">Verified By</th>
                            <th className="text-left py-3 px-6 text-slate-300 font-medium text-sm">Date</th>
                            <th className="text-left py-3 px-6 text-slate-300 font-medium text-sm">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredTransactions().map((transaction) => (
                            <tr key={transaction.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3">
                                  {transaction.type === "credit" ? (
                                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={`font-medium capitalize text-sm ${
                                    transaction.type === "credit" ? "text-green-500" : "text-red-500"
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </div>
                              </td>
                              <td className={`py-4 px-6 font-semibold text-sm ${
                                transaction.type === "credit" ? "text-green-500" : "text-red-500"
                              }`}>
                                {transaction.type === "credit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="py-4 px-6 text-white text-sm">{transaction.purpose}</td>
                              <td className="py-4 px-6 text-slate-400 text-sm">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4" />
                                  <span>{getEmployeeName(transaction.verifiedBy)}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-400 text-sm">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6">
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
                      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>
                            Showing {getFilteredTransactions().length} of {accountTransactions.length} transactions
                            {(searchTerm || typeFilter !== "all" || employeeFilter !== "all" || dateRange !== "all" || customStartDate || customEndDate) && 
                              " (filtered)"
                            }
                          </span>
                          {getFilteredTransactions().length > 0 && (
                            <div className="flex items-center space-x-4">
                              <span className="text-green-400">
                                Credits: +{formatCurrency(getAccountSummary(true).totalCredit)}
                              </span>
                              <span className="text-red-400">
                                Debits: -{formatCurrency(getAccountSummary(true).totalDebit)}
                              </span>
                              <span className="text-cyan-400 font-medium">
                                Net: {formatCurrency(getAccountSummary(true).totalCredit - getAccountSummary(true).totalDebit)}
                              </span>
                              
                              {/* Export Options */}
                              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-slate-600/50">
                                <span className="text-xs text-slate-500">Export:</span>
                                <button
                                  onClick={downloadCSV}
                                  className="flex items-center space-x-1 px-2 py-1 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded hover:bg-slate-600/50 hover:text-white transition-all duration-200 text-xs"
                                >
                                  <FileSpreadsheet className="h-3 w-3" />
                                  <span>CSV</span>
                                </button>
                                <button
                                  onClick={downloadPDF}
                                  className="flex items-center space-x-1 px-2 py-1 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded hover:bg-slate-600/50 hover:text-white transition-all duration-200 text-xs"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Create New Account</h2>
                <button
                  onClick={() => setShowCreateAccountModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAccountModal(false)}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-4 rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: "debit"})}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 text-sm ${
                        newTransaction.type === "debit"
                          ? "border-red-500/50 bg-red-500/10"
                          : "border-slate-600/50 hover:border-slate-500/50"
                      }`}
                    >
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                      <span className="text-white">Debit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: "credit"})}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 text-sm ${
                        newTransaction.type === "credit"
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-slate-600/50 hover:border-slate-500/50"
                      }`}
                    >
                      <ArrowDownLeft className="h-5 w-5 text-green-500" />
                      <span className="text-white">Credit</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Verified By (Employee)
                  </label>
                  <select
                    value={newTransaction.verifiedBy}
                    onChange={(e) => setNewTransaction({...newTransaction, verifiedBy: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
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

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-4 rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium"
                  >
                    Add Transaction
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
                  className="text-slate-400 hover:text-white transition-colors"
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
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-4 rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyCustomDateRange}
                    disabled={!tempStartDate || !tempEndDate}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
