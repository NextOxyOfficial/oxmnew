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
  const [activeTab, setActiveTab] = useState<"accounts" | "transactions">("accounts");

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

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
  const accountTransactions = transactions.filter(t => t.accountId === selectedAccountId);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Unknown";
  };

  // Calculate totals for selected account
  const getAccountSummary = () => {
    if (!selectedAccountId) return { totalCredit: 0, totalDebit: 0 };
    
    const totalCredit = accountTransactions
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = accountTransactions
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalCredit, totalDebit };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Banking</h1>
          <p className="text-slate-400 mt-1">Manage accounts and transactions</p>
        </div>
        <button
          onClick={() => setShowCreateAccountModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Main Content */}
      {accounts.length === 0 ? (
        /* No Accounts State */
        <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl p-12 text-center">
          <CreditCard className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No accounts yet</h3>
          <p className="text-slate-500 mb-4">Create your first account to get started</p>
          <button
            onClick={() => setShowCreateAccountModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Account
          </button>
        </div>
      ) : (
        /* Accounts Tab Layout */
        <div>
          {/* Account Tabs */}
          <div className="bg-slate-800 border border-slate-700 rounded-t-xl">
            <div className="flex flex-wrap border-b border-slate-700">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`px-6 py-4 font-medium transition-colors relative flex items-center space-x-3 ${
                    selectedAccountId === account.id
                      ? "text-blue-400 bg-slate-700"
                      : "text-slate-400 hover:text-white hover:bg-slate-750"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{account.name}</div>
                    <div className={`text-sm ${selectedAccountId === account.id ? 'text-blue-300' : 'text-slate-500'}`}>
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                  {selectedAccountId === account.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Account Content */}
          {selectedAccountId ? (
            <div className="bg-slate-800 border-x border-b border-slate-700 rounded-b-xl">
              {/* Account Summary */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">{selectedAccount?.name}</h3>
                  <button
                    onClick={() => setShowTransactionModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Transaction</span>
                  </button>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ArrowDownLeft className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-slate-400 text-sm">Total Credit</p>
                        <p className="text-xl font-bold text-green-500">
                          +{formatCurrency(getAccountSummary().totalCredit)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ArrowUpRight className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-slate-400 text-sm">Total Debit</p>
                        <p className="text-xl font-bold text-red-500">
                          -{formatCurrency(getAccountSummary().totalDebit)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-slate-400 text-sm">Current Balance</p>
                        <p className={`text-xl font-bold ${selectedAccount && selectedAccount.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {selectedAccount ? formatCurrency(selectedAccount.balance) : '$0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                {accountTransactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <DollarSign className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-300 mb-2">No transactions yet</h4>
                    <p className="text-slate-500 mb-4">Add your first transaction to get started</p>
                    <button
                      onClick={() => setShowTransactionModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Transaction
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-750">
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-6 text-slate-300 font-medium">Type</th>
                          <th className="text-left py-3 px-6 text-slate-300 font-medium">Amount</th>
                          <th className="text-left py-3 px-6 text-slate-300 font-medium">Purpose</th>
                          <th className="text-left py-3 px-6 text-slate-300 font-medium">Verified By</th>
                          <th className="text-left py-3 px-6 text-slate-300 font-medium">Date</th>
                          <th className="text-left py-3 px-6 text-slate-300 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-slate-700 hover:bg-slate-750 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                {transaction.type === "credit" ? (
                                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                                )}
                                <span className={`font-medium capitalize ${
                                  transaction.type === "credit" ? "text-green-500" : "text-red-500"
                                }`}>
                                  {transaction.type}
                                </span>
                              </div>
                            </td>
                            <td className={`py-4 px-6 font-semibold ${
                              transaction.type === "credit" ? "text-green-500" : "text-red-500"
                            }`}>
                              {transaction.type === "credit" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-4 px-6 text-white">{transaction.purpose}</td>
                            <td className="py-4 px-6 text-slate-400 flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{getEmployeeName(transaction.verifiedBy)}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center space-x-1 w-fit">
                                <Check className="h-3 w-3" />
                                <span>Verified</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Select Account Prompt */
            <div className="bg-slate-800 border-x border-b border-slate-700 rounded-b-xl p-12 text-center">
              <CreditCard className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">Select an account</h3>
              <p className="text-slate-500">Click on an account tab above to view its transaction history</p>
            </div>
          )}
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
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
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
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
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
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
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                      newTransaction.type === "debit"
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <ArrowUpRight className="h-5 w-5 text-red-500" />
                    <span className="text-white">Debit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: "credit"})}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                      newTransaction.type === "credit"
                        ? "border-green-500 bg-green-500/10"
                        : "border-slate-600 hover:border-slate-500"
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
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
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
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
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
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
