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
  Calendar,
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
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    status: "all", 
    verified_by: "all",
    date_from: "",
    date_to: "",
    search: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Ref for horizontal scrolling
  const accountTabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position for indicators
  useEffect(() => {
    const scrollContainer = accountTabsScrollRef.current;
    if (!scrollContainer) return;

    const checkScrollPosition = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    };

    const handleScroll = () => {
      checkScrollPosition();
    };

    // Initial check
    checkScrollPosition();
    
    scrollContainer.addEventListener('scroll', handleScroll);
    
    // Also check when content changes
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [allAccounts]);

  // Custom hook for horizontal mouse wheel scrolling and drag scrolling
  useEffect(() => {
    const scrollContainer = accountTabsScrollRef.current;
    if (!scrollContainer) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    // Simple and reliable mouse wheel horizontal scrolling
    const handleWheel = (e: WheelEvent) => {
      // Check if the event target is within our scroll container
      const target = e.target as HTMLElement;
      if (!scrollContainer.contains(target)) return;
      
      // Convert vertical scrolling to horizontal
      if (e.deltaY !== 0) {
        e.preventDefault();
        e.stopPropagation();
        
        const scrollAmount = e.deltaY;
        scrollContainer.scrollLeft += scrollAmount;
        
        // Debug log
        console.log('Horizontal scroll:', { 
          deltaY: e.deltaY, 
          newScrollLeft: scrollContainer.scrollLeft,
          scrollWidth: scrollContainer.scrollWidth,
          clientWidth: scrollContainer.clientWidth
        });
      }
    };

    // Drag to scroll functionality
    const handleMouseDown = (e: MouseEvent) => {
      // Don't interfere with button clicks
      if ((e.target as HTMLElement).tagName === 'BUTTON') {
        return;
      }
      
      isDown = true;
      scrollContainer.classList.add('cursor-grabbing');
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      scrollContainer.classList.remove('cursor-grabbing');
    };

    const handleMouseUp = () => {
      isDown = false;
      scrollContainer.classList.remove('cursor-grabbing');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    // Add event listeners
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    scrollContainer.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    scrollContainer.addEventListener('mouseup', handleMouseUp);
    scrollContainer.addEventListener('mousemove', handleMouseMove);

    console.log('Horizontal scroll event listeners attached to:', scrollContainer);

    // Cleanup
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      scrollContainer.removeEventListener('mouseup', handleMouseUp);
      scrollContainer.removeEventListener('mousemove', handleMouseMove);
      console.log('Horizontal scroll event listeners removed');
    };
  }, [allAccounts]); // Re-run when accounts change

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

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      const response = await ApiService.getEmployees();
      const employeeData = Array.isArray(response) ? response : response.results || [];
      setEmployees(employeeData);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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

  const getEmployeeName = (
    employeeId: string | null,
    employeeDetails?: any
  ) => {
    // If verified_by_details is provided in the transaction, use it directly
    if (employeeDetails) {
      return (
        employeeDetails.name ||
        employeeDetails.full_name ||
        `${employeeDetails.first_name || ""} ${
          employeeDetails.last_name || ""
        }`.trim() ||
        employeeDetails.username ||
        "Unknown"
      );
    }

    // If no employeeId provided, transaction is not verified by anyone
    if (!employeeId) {
      return "Not Verified";
    }

    // Otherwise, fallback to finding employee by ID from employees list
    const employee = employees.find((emp) => emp.id === parseInt(employeeId));
    return employee
      ? employee.name ||
          employee.full_name ||
          `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
          employee.username
      : "Unknown";
  };

  // Calculate running balance for transactions
  const getTransactionsWithRunningBalance = (): TransactionWithBalance[] => {
    if (!account || transactions.length === 0) return [];

    // Sort transactions by date and time (newest first for display order)
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // If dates are the same, sort by updated_at (creation time) - newest first
      if (dateA.getTime() === dateB.getTime()) {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }

      return dateB.getTime() - dateA.getTime(); // newest first
    });

    // Get the current account balance - ensure it's a number
    const currentBalance = Number(account.balance) || 0;

    // Start with current balance and work backwards for each transaction
    let runningBalance = currentBalance;

    const transactionsWithBalance: TransactionWithBalance[] =
      sortedTransactions.map((transaction, index) => {
        // For the first transaction (most recent), the running balance is the current balance
        if (index === 0) {
          return {
            ...transaction,
            runningBalance: currentBalance,
          };
        }

        // For subsequent transactions, calculate what the balance was before the previous transaction
        const previousTransaction = sortedTransactions[index - 1];
        const previousAmount = Number(previousTransaction.amount) || 0;

        if (previousTransaction.type === "credit") {
          runningBalance -= previousAmount; // Remove the credit to go back in time
        } else {
          runningBalance += previousAmount; // Remove the debit to go back in time
        }

        return {
          ...transaction,
          runningBalance: runningBalance,
        };
      });

    return transactionsWithBalance;
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
        /* Cursor states for scrolling */
        .cursor-grabbing {
          cursor: grabbing !important;
        }
        .cursor-grabbing * {
          cursor: grabbing !important;
        }
        /* Ensure wheel events work properly */
        .scroll-container {
          overscroll-behavior-x: contain;
          scroll-behavior: smooth;
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
                <div className="flex items-center space-x-4">
                  <p className="text-xs text-gray-500 flex items-center space-x-4">
                    <span className="flex items-center">
                      💡 Click any account to switch instantly
                    </span>
                    <span className="hidden sm:flex items-center space-x-1 text-cyan-400">
                      🖱️ Scroll wheel or drag to navigate
                    </span>
                    <span className="hidden lg:flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">←→</kbd>
                      <span>to navigate</span>
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">
                  {allAccounts.findIndex(acc => acc.account_number === id || acc.id === id) + 1} of {allAccounts.length}
                </span>
                {(canScrollLeft || canScrollRight) && (
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      canScrollLeft ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                    }`} />
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      canScrollRight ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                    }`} />
                  </div>
                )}
              </div>
              
              <div className="relative">
                {/* Left fade indicator */}
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-800/90 to-transparent z-10 pointer-events-none" />
                )}
                
                {/* Right fade indicator */}
                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-800/90 to-transparent z-10 pointer-events-none" />
                )}

                <div 
                  ref={accountTabsScrollRef}
                  className="flex overflow-x-auto gap-2 custom-scrollbar scroll-container pb-1 cursor-grab scroll-smooth select-none"
                  style={{ 
                    scrollbarWidth: 'thin',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                >
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
              </div>

              {/* Account Summary */}
              <div className="mt-4 pt-4 border-t border-slate-700 p-3 border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-700/20">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-md bg-cyan-500/20 p-1">
                        <DollarSign className="h-7 w-7 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-cyan-300 font-medium">
                          Balance
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            account && parseFloat(account.balance?.toString() || "0") >= 0
                              ? "text-cyan-400"
                              : "text-red-400"
                          }`}
                        >
                          {account
                            ? formatCurrency(parseFloat(account.balance?.toString() || "0"))
                            : formatCurrency(0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-md bg-green-500/20 p-1">
                        <ArrowDownLeft className="h-7 w-7 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-green-300 font-medium">
                          Credits
                        </p>
                        <p className="text-sm font-bold text-green-400">
                          +{formatCurrency(parseFloat(account?.total_credits?.toString() || "0"))}
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
                        <p className="text-sm text-red-300 font-medium">
                          Debits
                        </p>
                        <p className="text-sm font-bold text-red-400">
                          -{formatCurrency(parseFloat(account?.total_debits?.toString() || "0"))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="p-4 border-slate-700/50 bg-slate-800/10">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-3 xl:space-y-0 gap-3">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 flex-1">
                      {/* Add Transaction Button */}
                      <button
                        onClick={() => setShowAddTransactionModal(true)}
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
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            type: e.target.value as any,
                          }))
                        }
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[120px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">
                          All Types
                        </option>
                        <option value="credit" className="bg-slate-800">
                          Credit Only
                        </option>
                        <option value="debit" className="bg-slate-800">
                          Debit Only
                        </option>
                      </select>

                      {/* Employee Filter */}
                      <select
                        value={filters.verified_by || "all"}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            verified_by: e.target.value,
                          }))
                        }
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[140px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">
                          All Employees
                        </option>
                        {employees.map((employee) => (
                          <option
                            key={employee.id}
                            value={employee.id}
                            className="bg-slate-800"
                          >
                            {employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`}
                          </option>
                        ))}
                      </select>

                      {/* Date Range Selector */}
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[120px] cursor-pointer"
                      >
                        <option value="all" className="bg-slate-800">
                          All Time
                        </option>
                        <option value="today" className="bg-slate-800">
                          Today
                        </option>
                        <option value="week" className="bg-slate-800">
                          Last Week
                        </option>
                        <option value="month" className="bg-slate-800">
                          Last Month
                        </option>
                        <option value="3months" className="bg-slate-800">
                          Last 3 Months
                        </option>
                        <option value="custom" className="bg-slate-800">
                          Custom Range
                        </option>
                      </select>

                      {/* Custom Date Range Display */}
                      {dateRange === "custom" &&
                        customStartDate &&
                        customEndDate && (
                          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/30 px-2 py-1.5 rounded-lg border border-slate-700/50">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(customStartDate).toLocaleDateString()} -{" "}
                              {new Date(customEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Clear Filters */}
                      {(searchTerm ||
                        filters.type !== "all" ||
                        filters.verified_by !== "all" ||
                        dateRange !== "all" ||
                        customStartDate ||
                        customEndDate) && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilters({
                              type: "all",
                              status: "all",
                              verified_by: "all",
                              date_from: "",
                              date_to: "",
                              search: "",
                            });
                            setDateRange("all");
                            setCustomStartDate("");
                            setCustomEndDate("");
                          }}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center space-x-3">
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

          {getTransactionsWithRunningBalance().length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <h4 className="text-base font-medium text-slate-300 mb-2">
                {transactions.length === 0
                  ? "No transactions yet"
                  : "No transactions match your filters"}
              </h4>
              <p className="text-slate-500 mb-3 text-sm">
                {transactions.length === 0
                  ? "Add your first transaction to get started"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {transactions.length === 0 && (
                <button
                  onClick={() => setShowAddTransactionModal(true)}
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
                    <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                      Verified By
                    </th>
                    <th className="text-left py-2 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                      Running Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getTransactionsWithRunningBalance().map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-slate-300">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {transaction.type === "credit" ? (
                              <ArrowDownLeft className="w-4 h-4 text-green-400" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-400" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                transaction.type === "credit"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {transaction.type === "credit" ? "Credit" : "Debit"}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`py-3 px-4 font-semibold text-sm ${
                            transaction.type === "credit"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(parseFloat(transaction.amount.toString()))}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-300">
                          {transaction.purpose}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-300">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-slate-400" />
                            <span>
                              {getEmployeeName(transaction.verified_by, transaction.verified_by_details)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.runningBalance >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {transaction.runningBalance >= 0 ? "+" : ""}
                            {formatCurrency(transaction.runningBalance)}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/20 to-slate-700/20">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
    amount: "",
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
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };
      await onSubmit(submitData);
      setFormData({
        type: "credit",
        amount: "",
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-auto backdrop-blur-md">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">
              Add Transaction
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-700/50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: "debit" })
                }
                className={`p-2.5 rounded-lg border-2 transition-all flex items-center justify-center space-x-1.5 text-sm cursor-pointer ${
                  formData.type === "debit"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-slate-600/50 hover:border-slate-500/50"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-red-500" />
                <span className="text-white">Debit</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: "credit" })
                }
                className={`p-2.5 rounded-lg border-2 transition-all flex items-center justify-center space-x-1.5 text-sm cursor-pointer ${
                  formData.type === "credit"
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
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value,
                })
              }
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
              value={formData.purpose}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purpose: e.target.value,
                })
              }
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
              value={formData.verified_by}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verified_by: e.target.value,
                })
              }
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm cursor-pointer"
              required
            >
              <option value="" className="bg-slate-800">
                Select employee...
              </option>
              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                  className="bg-slate-800"
                >
                  {employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`}
                </option>
              ))}
            </select>
            {loadingEmployees && (
              <p className="text-xs text-gray-400 mt-1">Loading employees...</p>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-3 rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
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
    </div>
  );
}
