import { useState, useEffect, useCallback } from "react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadAccounts = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("❌ Not authenticated, skipping loadAccounts");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading bank accounts...");
      const accountsData = await ApiService.getBankAccounts();
      console.log("📦 Raw accounts data received:", accountsData);
      
      // Ensure accountsData is an array
      const validAccountsData = Array.isArray(accountsData) ? accountsData : [];
      console.log("✅ Valid accounts data:", validAccountsData, "Count:", validAccountsData.length);
      setAccounts(validAccountsData);
      
      // Auto-select Main account first, then any account if none selected
      if (validAccountsData.length > 0) {
        const mainAccount = validAccountsData.find((acc: BankAccount) => acc.name === "Main");
        if (mainAccount) {
          console.log("🎯 Found Main account, selecting:", mainAccount);
          setSelectedAccountId(mainAccount.id);
        } else {
          console.log("🎯 No Main account found, selecting first account:", validAccountsData[0]);
          setSelectedAccountId(validAccountsData[0].id);
        }
      } else {
        console.log("⚠️ No accounts found");
      }
    } catch (err) {
      console.error("❌ Error loading accounts:", err);
      setError(err instanceof Error ? err.message : "Failed to load accounts");
      setAccounts([]); // Ensure accounts is always an array even on error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadEmployees = useCallback(async (search?: string) => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      // Load all employees first, then filter on frontend if search is provided
      const employeesData = await ApiService.getBankingEmployees();
      
      // Ensure employeesData is an array
      const validEmployeesData = Array.isArray(employeesData) ? employeesData : [];
      
      if (search && search.trim()) {
        // Filter employees on frontend based on search
        const filteredEmployees = validEmployeesData.filter((emp: any) => 
          emp.name?.toLowerCase().includes(search.toLowerCase()) ||
          emp.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
          emp.role?.toLowerCase().includes(search.toLowerCase()) ||
          emp.department?.toLowerCase().includes(search.toLowerCase()) ||
          emp.email?.toLowerCase().includes(search.toLowerCase())
        );
        setEmployees(filteredEmployees);
      } else {
        setEmployees(validEmployeesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
      setEmployees([]); // Ensure employees is always an array even on error
    }
  }, [isAuthenticated]);

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
      
      // Ensure transactionsData is an array
      const validTransactionsData = Array.isArray(transactionsData) ? transactionsData : [];
      setTransactions(validTransactionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
      setTransactions([]); // Ensure transactions is always an array even on error
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
      setAccounts(prev => Array.isArray(prev) ? [...prev, newAccount] : [newAccount]);
      
      // Auto-select the new account if it's the Main account or if no account is currently selected
      if (newAccount.name === "Main" || !selectedAccountId) {
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
      setAccounts(prev => Array.isArray(prev) ? prev.map(acc => acc.id === accountId ? updatedAccount : acc) : [updatedAccount]);
      
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
      return await ApiService.getTransactionDashboardStats(accountId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get dashboard stats";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Initialize data on mount - only when authenticated
  useEffect(() => {
    console.log("🔄 useEffect triggered - isAuthenticated:", isAuthenticated, "authLoading:", authLoading);
    if (isAuthenticated && !authLoading) {
      console.log("✅ User is authenticated, loading banking data...");
      loadAccounts();
      loadEmployees();
    } else if (!authLoading && !isAuthenticated) {
      console.log("❌ User not authenticated, clearing banking data...");
      setAccounts([]);
      setTransactions([]);
      setEmployees([]);
      setSelectedAccountId(null);
      setError(null);
    }
  }, [isAuthenticated, authLoading, loadAccounts, loadEmployees]);

  // Load transactions when account changes
  useEffect(() => {
    if (selectedAccountId) {
      loadTransactions(selectedAccountId);
    }
  }, [selectedAccountId, loadTransactions]);

  const selectedAccount = Array.isArray(accounts) ? accounts.find(acc => acc.id === selectedAccountId) : undefined;

  return {
    // State
    accounts,
    transactions,
    employees,
    selectedAccountId,
    selectedAccount,
    loading,
    error,
    isAuthenticated,
    authLoading,

    // Actions
    setSelectedAccountId,
    setError,
    loadAccounts,
    loadEmployees,
    loadTransactions,
    createAccount,
    updateAccount,
    createTransaction,
    getAccountSummary,
    getDashboardStats,

    // Utilities
    refreshData: () => {
      if (isAuthenticated) {
        loadAccounts();
        if (selectedAccountId) {
          loadTransactions(selectedAccountId);
        }
      }
    },
    
    // Debug info
    debugInfo: {
      accountsCount: accounts.length,
      hasSelectedAccount: !!selectedAccount,
      authStatus: isAuthenticated ? 'authenticated' : 'not authenticated',
      loading: loading || authLoading
    }
  };
};
