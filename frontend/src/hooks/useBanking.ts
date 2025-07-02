import { useState, useEffect, useCallback } from "react";
import { ApiService } from "@/lib/api";
import type {
  BankAccount,
  Transaction,
  Employee,
  AccountSummary,
  DashboardStats,
  TransactionFilters,
  CreateTransactionData,
  CreateAccountData,
  UpdateAccountData,
} from "@/types/banking";

export const useBanking = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accountsData = await ApiService.getBankAccounts();
      setAccounts(accountsData);
      
      // Auto-select Primary account first, then any account if none selected
      if (accountsData.length > 0 && !selectedAccountId) {
        const primaryAccount = accountsData.find((acc: BankAccount) => acc.name === "Primary");
        if (primaryAccount) {
          setSelectedAccountId(primaryAccount.id);
        } else {
          setSelectedAccountId(accountsData[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  const loadEmployees = useCallback(async () => {
    try {
      const employeesData = await ApiService.getBankingEmployees();
      setEmployees(employeesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    }
  }, []);

  const loadTransactions = useCallback(async (accountId: string, filters?: TransactionFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert filters to backend format
      const backendFilters: Record<string, string> = {};
      if (filters) {
        if (filters.type && filters.type !== "all") backendFilters.type = filters.type;
        if (filters.status && filters.status !== "all") backendFilters.status = filters.status;
        if (filters.date_from) backendFilters.date_from = filters.date_from;
        if (filters.date_to) backendFilters.date_to = filters.date_to;
        if (filters.search) backendFilters.search = filters.search;
        if (filters.verified_by && filters.verified_by !== "all") backendFilters.verified_by = filters.verified_by;
      }

      const transactionsData = await ApiService.getAccountTransactions(accountId, backendFilters);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new account
  const createAccount = useCallback(async (data: CreateAccountData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newAccount = await ApiService.createBankAccount(data);
      setAccounts(prev => [...prev, newAccount]);
      
      // Auto-select the new account if it's the Primary account or if no account is currently selected
      if (newAccount.name === "Primary" || !selectedAccountId) {
        setSelectedAccountId(newAccount.id);
      }
      
      return newAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  // Update account
  const updateAccount = useCallback(async (accountId: string, data: UpdateAccountData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedAccount = await ApiService.updateBankAccount(accountId, data);
      setAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount : acc));
      
      return updatedAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update account";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new transaction
  const createTransaction = useCallback(async (data: CreateTransactionData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newTransaction = await ApiService.createTransaction(data);
      
      // Reload accounts to get updated balance
      await loadAccounts();
      
      // Reload transactions for the current account
      if (selectedAccountId) {
        await loadTransactions(selectedAccountId);
      }
      
      return newTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create transaction";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadTransactions, selectedAccountId]);

  // Get account summary
  const getAccountSummary = useCallback(async (accountId: string): Promise<AccountSummary> => {
    try {
      return await ApiService.getAccountSummary(accountId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get account summary";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get dashboard stats
  const getDashboardStats = useCallback(async (accountId?: string): Promise<DashboardStats> => {
    try {
      return await ApiService.getDashboardStats(accountId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get dashboard stats";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadAccounts();
    loadEmployees();
  }, [loadAccounts, loadEmployees]);

  // Load transactions when account changes
  useEffect(() => {
    if (selectedAccountId) {
      loadTransactions(selectedAccountId);
    }
  }, [selectedAccountId, loadTransactions]);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return {
    // State
    accounts,
    transactions,
    employees,
    selectedAccountId,
    selectedAccount,
    loading,
    error,

    // Actions
    setSelectedAccountId,
    setError,
    loadAccounts,
    loadTransactions,
    createAccount,
    updateAccount,
    createTransaction,
    getAccountSummary,
    getDashboardStats,

    // Utilities
    refreshData: () => {
      loadAccounts();
      if (selectedAccountId) {
        loadTransactions(selectedAccountId);
      }
    },
  };
};
