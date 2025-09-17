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
  PaginatedTransactions,
} from "@/types/banking";

export const useBanking = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

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
      
      // Log detailed account information
      validAccountsData.forEach((account, index) => {
        console.log(`📋 Account ${index + 1}:`, {
          id: account.id,
          name: account.name,
          balance: account.balance,
          owner: account.owner
        });
      });
      
      setAccounts(validAccountsData);
      
      // Validate current selectedAccountId still exists in new account data
      if (selectedAccountId && validAccountsData.length > 0) {
        console.log(`🔍 Checking if current selected account ID ${selectedAccountId} still exists...`);
        const currentAccountExists = validAccountsData.find((acc: BankAccount) => acc.id === selectedAccountId);
        if (!currentAccountExists) {
          console.log("⚠️ Current selected account no longer exists, resetting selection");
          setSelectedAccountId(null);
        } else {
          console.log("✅ Current selected account still exists:", currentAccountExists);
        }
      }
      
      // Auto-select Main account first, then any account if none selected
      if (validAccountsData.length > 0 && !selectedAccountId) {
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
        setSelectedAccountId(null);
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

  const loadTransactions = useCallback(async (
    accountId: string, 
    filters?: TransactionFilters, 
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);
      
      // Validate that the account exists in the current user's accounts
      if (accounts.length > 0) {
        console.log(`🔍 Checking if account ID ${accountId} exists in user's accounts...`);
        console.log(`📋 Available accounts:`, accounts.map(acc => ({ id: acc.id, name: acc.name })));
        const accountExists = accounts.find(acc => acc.id === accountId);
        if (!accountExists) {
          console.log(`❌ Account ID ${accountId} not found in user's accounts`);
          setError(`Account not found or access denied. Please refresh the page.`);
          setLoading(false);
          return;
        } else {
          console.log(`✅ Account ID ${accountId} found:`, { id: accountExists.id, name: accountExists.name });
        }
      } else {
        console.log(`⚠️ No accounts loaded yet, proceeding with API call for account ID ${accountId}`);
      }
      
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
      
      // Add pagination parameters
      backendFilters.page = page.toString();

      const paginatedData = await ApiService.getAccountTransactions(accountId, backendFilters);
      
      // Handle both paginated and non-paginated responses for backward compatibility
      let transactionsData: Transaction[];
      let paginationInfo = {
        count: 0,
        next: null as string | null,
        previous: null as string | null,
        current_page: page,
        total_pages: 1
      };

      if (paginatedData && typeof paginatedData === 'object' && 'results' in paginatedData) {
        // Paginated response
        transactionsData = Array.isArray(paginatedData.results) ? paginatedData.results : [];
        paginationInfo = {
          count: paginatedData.count || 0,
          next: paginatedData.next,
          previous: paginatedData.previous,
          current_page: page,
          total_pages: Math.ceil((paginatedData.count || 0) / 20) // Assuming 20 items per page
        };
      } else {
        // Non-paginated response (fallback)
        transactionsData = Array.isArray(paginatedData) ? paginatedData : [];
      }

      if (append && page > 1) {
        // Append new transactions for "load more" functionality
        setTransactions(prev => [...prev, ...transactionsData]);
      } else {
        // Replace transactions for first page or filters change
        setTransactions(transactionsData);
      }

      // Update pagination state
      setCurrentPage(paginationInfo.current_page);
      setTotalPages(paginationInfo.total_pages);
      setTotalCount(paginationInfo.count);
      setHasNextPage(!!paginationInfo.next);
      setHasPreviousPage(!!paginationInfo.previous);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
      if (!append) {
        setTransactions([]); // Only clear on new load, not append
      }
    } finally {
      if (!append) {
        setLoading(false);
      }
    }
  }, [accounts]);

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

  // Pagination functions
  const loadNextPage = useCallback(() => {
    if (hasNextPage && selectedAccountId) {
      loadTransactions(selectedAccountId, undefined, currentPage + 1, true);
    }
  }, [hasNextPage, selectedAccountId, currentPage, loadTransactions]);

  const loadPreviousPage = useCallback(() => {
    if (hasPreviousPage && selectedAccountId && currentPage > 1) {
      loadTransactions(selectedAccountId, undefined, currentPage - 1, false);
    }
  }, [hasPreviousPage, selectedAccountId, currentPage, loadTransactions]);

  const goToPage = useCallback((page: number) => {
    if (selectedAccountId && page >= 1 && page <= totalPages) {
      loadTransactions(selectedAccountId, undefined, page, false);
    }
  }, [selectedAccountId, totalPages, loadTransactions]);

  const refreshCurrentPage = useCallback((filters?: TransactionFilters) => {
    if (selectedAccountId) {
      setCurrentPage(1); // Reset to first page when filters change
      loadTransactions(selectedAccountId, filters, 1, false);
    }
  }, [selectedAccountId, loadTransactions]);

  // Safe account selection that validates the account exists
  const safeSetSelectedAccountId = useCallback((accountId: string | null) => {
    if (accountId === null) {
      setSelectedAccountId(null);
      return;
    }
    
    // Validate that the account exists in the user's accounts
    const accountExists = accounts.find(acc => acc.id === accountId);
    if (accountExists) {
      setSelectedAccountId(accountId);
      setError(null); // Clear any previous errors
    } else {
      setError(`Account with ID ${accountId} not found. Please select a valid account.`);
      // Auto-select the main account or first available account
      const mainAccount = accounts.find(acc => acc.name === "Main");
      if (mainAccount) {
        setSelectedAccountId(mainAccount.id);
      } else if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      } else {
        setSelectedAccountId(null);
      }
    }
  }, [accounts]);

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

    // Pagination state
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,

    // Actions
    setSelectedAccountId: safeSetSelectedAccountId,
    setError,
    loadAccounts,
    loadEmployees,
    loadTransactions,
    createAccount,
    updateAccount,
    createTransaction,
    getAccountSummary,
    getDashboardStats,

    // Pagination actions
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refreshCurrentPage,

    // Utilities
    refreshData: () => {
      if (isAuthenticated) {
        loadAccounts();
        if (selectedAccountId) {
          refreshCurrentPage();
        }
      }
    },
    
    // Debug info
    debugInfo: {
      accountsCount: accounts.length,
      hasSelectedAccount: !!selectedAccount,
      authStatus: isAuthenticated ? 'authenticated' : 'not authenticated',
      loading: loading || authLoading,
      pagination: `${currentPage}/${totalPages} (${totalCount} total)`
    }
  };
};
