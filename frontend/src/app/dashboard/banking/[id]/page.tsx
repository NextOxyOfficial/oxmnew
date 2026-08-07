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
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Landmark,
  Loader2,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import ComboBox from "@/components/ui/ComboBox";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Preset expense buckets. Stored as English keys so reports group reliably;
 *  the UI shows and accepts the Bangla label. */
const CATEGORY_LABELS: Record<string, string> = {
  rent: "ভাড়া",
  utilities: "বিদ্যুৎ-গ্যাস-পানি",
  internet: "ইন্টারনেট / ফোন",
  salary: "বেতন",
  transport: "যাতায়াত",
  marketing: "মার্কেটিং",
  supplies: "টুকিটাকি জিনিস",
  maintenance: "মেরামত",
  tax: "ট্যাক্স / ফি",
  other: "অন্যান্য",
};
const CATEGORY_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([key, label]) => [label, key])
);

/** The employee fields this screen reads. The API is inconsistent about which
 *  name key it sends, so all the variants are optional and callers fall back
 *  through them. */
type EmployeeLike = {
  id: number | string;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  employee_id?: string;
};

/** Each tab is one kind of money movement; `nature` narrows debits further. */
const LEDGER_TABS: {
  value: string;
  label: string;
  type: "all" | "credit" | "debit";
  nature?: string;
}[] = [
  { value: "all", label: "সব", type: "all" },
  { value: "credit", label: "জমা", type: "credit" },
  { value: "expense", label: "খরচ", type: "debit", nature: "expense" },
  { value: "withdrawal", label: "উত্তোলন", type: "debit", nature: "withdrawal" },
  { value: "debit", label: "সব খরচ", type: "debit" },
];

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
  const [employees, setEmployees] = useState<EmployeeLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  // The active tab, kept separately from `filters` because one tab can set
  // both `type` and `nature` (e.g. পেমেন্ট = debit + payment).
  const [ledgerTab, setLedgerTab] = useState("all");
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
    if (!scrollContainer || allAccounts.length <= 1) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    // More aggressive wheel event handling
    const handleWheel = (e: WheelEvent) => {
      // Always check if we have horizontal scrollable content first
      const hasHorizontalScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
      console.log('🔍 Scroll check:', { 
        scrollWidth: scrollContainer.scrollWidth, 
        clientWidth: scrollContainer.clientWidth, 
        hasHorizontalScroll 
      });
      
      if (!hasHorizontalScroll) return;

      // Check if we're hovering over the scroll container or its children
      const rect = scrollContainer.getBoundingClientRect();
      const isHoveringContainer = (
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom
      );

      console.log('🎯 Mouse position check:', {
        mouseX: e.clientX,
        mouseY: e.clientY,
        containerRect: rect,
        isHoveringContainer
      });

      if (isHoveringContainer && e.deltaY !== 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Convert vertical scroll to horizontal
        const scrollAmount = e.deltaY * 1.5;
        const oldScrollLeft = scrollContainer.scrollLeft;
        scrollContainer.scrollLeft += scrollAmount;
        
        console.log('🖱️ Wheel scroll applied:', { 
          deltaY: e.deltaY, 
          scrollAmount,
          oldScrollLeft,
          newScrollLeft: scrollContainer.scrollLeft,
          changed: oldScrollLeft !== scrollContainer.scrollLeft
        });
      } else {
        console.log('❌ Wheel event not processed:', { isHoveringContainer, deltaY: e.deltaY });
      }
    };

    // Drag to scroll functionality  
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't interfere with buttons or interactive elements
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }
      
      isDown = true;
      scrollContainer.style.cursor = 'grabbing';
      scrollContainer.style.userSelect = 'none';
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
      
      console.log('🤏 Drag started');
    };

    const handleMouseLeave = () => {
      if (isDown) {
        isDown = false;
        scrollContainer.style.cursor = 'grab';
        scrollContainer.style.userSelect = '';
        console.log('🤏 Drag ended (leave)');
      }
    };

    const handleMouseUp = () => {
      if (isDown) {
        isDown = false;
        scrollContainer.style.cursor = 'grab';
        scrollContainer.style.userSelect = '';
        console.log('🤏 Drag ended (up)');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    // Add multiple levels of event listeners for better capture
    
    // 1. Direct on container
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    scrollContainer.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    scrollContainer.addEventListener('mouseup', handleMouseUp);
    scrollContainer.addEventListener('mousemove', handleMouseMove);
    
    // 2. On document for global capture (as backup)
    const documentWheelHandler = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (scrollContainer.contains(target)) {
        handleWheel(e);
      }
    };
    
    document.addEventListener('wheel', documentWheelHandler, { passive: false, capture: true });

    console.log('🔧 Horizontal scroll handlers attached. Container:', scrollContainer);
    console.log('📏 Scroll dimensions:', {
      scrollWidth: scrollContainer.scrollWidth,
      clientWidth: scrollContainer.clientWidth,
      hasHorizontalScroll: scrollContainer.scrollWidth > scrollContainer.clientWidth
    });

    // Cleanup
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel, { capture: true });
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      scrollContainer.removeEventListener('mouseup', handleMouseUp);
      scrollContainer.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('wheel', documentWheelHandler, { capture: true });
      
      console.log('🧹 Horizontal scroll handlers cleaned up');
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
      
      // Check if no accounts exist at all
      if (!accounts || accounts.length === 0) {
        setError("কোনো অ্যাকাউন্ট পাওয়া যায়নি। মেইন অ্যাকাউন্ট নিজে থেকেই তৈরি হওয়ার কথা। পেজটা রিফ্রেশ করুন, না হলে সাপোর্টে যোগাযোগ করুন।");
        setLoading(false);
        return;
      }
      
      // Store all accounts for tabs
      setAllAccounts(accounts);
      
      const account = accounts.find((acc: BankAccount) => 
        acc.account_number === id || acc.id === id || acc.id.toString() === id
      );
      
      console.log("Found account:", account);
      
      if (!account) {
        // If specific account not found but accounts exist, redirect to first account
        if (accounts.length > 0) {
          const firstAccount = accounts[0];
          console.log("Redirecting to first available account:", firstAccount.id);
          router.push(`/dashboard/banking/${firstAccount.id}`);
          return;
        }
        setError("অ্যাকাউন্টটা খুঁজে পাওয়া যায়নি");
        return;
      }
      
      setAccount(account);
      // Don't load transactions here - let the useEffect handle it
    } catch (error) {
      console.error("Error loading account:", error);
      setError("অ্যাকাউন্টের তথ্য লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  // Load transactions for the account
  const loadTransactions = useCallback(async (accountId: string, currentFilters: TransactionFilters, page: number) => {
    try {
      console.log("Loading transactions for account:", accountId);
      console.log("Current filters:", currentFilters);
      console.log("Current page:", page);
      
      // Build params, excluding empty values and "all" placeholders
      const params: Record<string, string> = {
        page: page.toString(),
      };
      
      // Only add non-empty filter values
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params[key] = value;
        }
      });
      
      console.log("API params being sent:", params);
      
      const response = await ApiService.getAccountTransactions(accountId, params);
      
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
      setError(null); // Clear any previous errors on success
    } catch (error) {
      console.error("Error loading transactions:", error);
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : "লেনদেন লোড করা যায়নি";
      console.error("Detailed error:", errorMessage);
      setError(errorMessage);
      // Don't clear transactions on error - keep showing previous results
    }
  }, [account?.balance]);

  // Handle switching to a different account tab
  const switchToAccount = useCallback((accountId: string, accountNumber?: string) => {
    const newId = accountNumber || accountId;
    router.push(`/dashboard/banking/${newId}`);
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

  // Debounce search term into filters.search
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm.trim() }));
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Map dateRange to date_from/date_to filter values
  useEffect(() => {
    console.log("📅 Date range useEffect triggered. dateRange:", dateRange);
    
    const toDateString = (d: Date) => d.toISOString().slice(0, 10);
    let date_from = "";
    let date_to = "";

    const now = new Date();
    const end = new Date(now);
    
    // Ensure end date includes the day (backend may add time)
    switch (dateRange) {
      case "today": {
        date_from = toDateString(now);
        date_to = toDateString(now);
        console.log("  ➡️ Today selected:", { date_from, date_to });
        break;
      }
      case "yesterday": {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        date_from = toDateString(yesterday);
        date_to = toDateString(yesterday);
        console.log("  ➡️ Yesterday selected:", { date_from, date_to });
        break;
      }
      case "week": {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        date_from = toDateString(start);
        date_to = toDateString(end);
        console.log("  ➡️ Last Week selected:", { date_from, date_to });
        break;
      }
      case "month": {
        const start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        date_from = toDateString(start);
        date_to = toDateString(end);
        console.log("  ➡️ Last Month selected:", { date_from, date_to });
        break;
      }
      case "3months": {
        const start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        date_from = toDateString(start);
        date_to = toDateString(end);
        console.log("  ➡️ Last 3 Months selected:", { date_from, date_to });
        break;
      }
      case "custom": {
        date_from = customStartDate || "";
        date_to = customEndDate || "";
        console.log("  ➡️ Custom range selected:", { date_from, date_to });
        break;
      }
      default: {
        // all
        date_from = "";
        date_to = "";
        console.log("  ➡️ All Time selected (no date filter)");
      }
    }

    console.log("  ✅ Setting filters with:", { date_from, date_to });
    setFilters((prev) => {
      const newFilters = { ...prev, date_from, date_to };
      console.log("  ✅ New filters state:", newFilters);
      return newFilters;
    });
    setCurrentPage(1);
  }, [dateRange, customStartDate, customEndDate]);

  // Reload transactions when filters/page/account change
  useEffect(() => {
    console.log("🔄 Transaction reload useEffect triggered");
    console.log("  - account?.id:", account?.id);
    console.log("  - currentPage:", currentPage);
    console.log("  - filters:", filters);
    
    if (account?.id) {
      console.log("  ✅ Calling loadTransactions...");
      loadTransactions(account.id, filters, currentPage);
    } else {
      console.log("  ⚠️ No account ID, skipping load");
    }
  }, [account?.id, currentPage, filters, loadTransactions]);

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
      setError("লেনদেন যোগ করা যায়নি");
    }
  };

  // Handle export transactions
  const handleExportTransactions = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      
      // Prepare filters for the export
      const exportFilters: Record<string, string> = {
        account_id: account.id,
      };
      
      // Add active filters
      if (filters.type && filters.type !== "all") {
        exportFilters.type = filters.type;
      }
      if (filters.status && filters.status !== "all") {
        exportFilters.status = filters.status;
      }
      if (filters.verified_by && filters.verified_by !== "all") {
        exportFilters.verified_by = filters.verified_by;
      }
      if (filters.date_from) {
        exportFilters.date_from = filters.date_from;
      }
      if (filters.date_to) {
        exportFilters.date_to = filters.date_to;
      }
      if (filters.search) {
        exportFilters.search = filters.search;
      }
      
      // Get the blob from the API
      const blob = await ApiService.exportTransactionsXLSX(exportFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = `${account.name}_transactions`;
      if (filters.date_from && filters.date_to) {
        filename += `_${filters.date_from}_to_${filters.date_to}`;
      } else if (filters.date_from) {
        filename += `_from_${filters.date_from}`;
      } else if (filters.date_to) {
        filename += `_to_${filters.date_to}`;
      }
      filename += '.xlsx';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error exporting transactions:", error);
      setError("ফাইল ডাউনলোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (
    employeeId: string | null,
    employeeDetails?: EmployeeLike
  ): string => {
    // If verified_by_details is provided in the transaction, use it directly
    if (employeeDetails) {
      return (
        employeeDetails.name ||
        employeeDetails.full_name ||
        `${employeeDetails.first_name || ""} ${
          employeeDetails.last_name || ""
        }`.trim() ||
        employeeDetails.username ||
        "জানা নেই"
      );
    }

    // If no employeeId provided, transaction is not verified by anyone
    if (!employeeId) {
      return "যাচাই হয়নি";
    }

    // Otherwise, fallback to finding employee by ID from employees list
    const employee = employees.find(
      (emp) => String(emp.id) === String(employeeId)
    );
    if (!employee) return "জানা নেই";
    return (
      employee.name ||
      employee.full_name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      employee.username ||
      "জানা নেই"
    );
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
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="empty">ব্যাংকিং দেখতে হলে আগে লগইন করুন।</div>;
  }

  if (error && !account) {
    return (
      <div className="empty">
        <p className="mb-4 text-rose-600">{error}</p>
        <Link href="/dashboard/banking" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4" /> ব্যাংকিং-এ ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <Link
            href="/dashboard/banking"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> সব অ্যাকাউন্ট
          </Link>
          <h1 className="page-title">{account?.name || "অ্যাকাউন্ট"}</h1>
          <p className="page-sub">
            অ্যাকাউন্ট নম্বর #{account?.account_number || account?.id || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportTransactions}
            disabled={loading}
            className="btn btn-ghost"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            XLSX ডাউনলোড
          </button>
          <button
            onClick={() => setShowAddTransactionModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" /> নতুন লেনদেন
          </button>
        </div>
      </header>

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">ব্যালেন্স</div>
            <div className="stat-value num">
              {account
                ? formatCurrency(parseFloat(account.balance?.toString() || "0"))
                : formatCurrency(0)}
            </div>
            <div className="stat-meta">এখন হাতে যা আছে</div>
          </div>
          <div className="stat">
            <div className="stat-label">মোট জমা</div>
            <div className="stat-value money-pos">
              +{formatCurrency(parseFloat(account?.total_credits?.toString() || "0"))}
            </div>
            <div className="stat-meta">সব জমা মিলিয়ে</div>
          </div>
          <div className="stat">
            <div className="stat-label">মোট খরচ</div>
            <div className="stat-value money-neg">
              -{formatCurrency(parseFloat(account?.total_debits?.toString() || "0"))}
            </div>
            <div className="stat-meta">সব খরচ মিলিয়ে</div>
          </div>
        </div>

        {/* Account switcher */}
        {allAccounts.length > 0 && (
          <div className="plane-section">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="section-title mb-0 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                অ্যাকাউন্ট বদলান
              </div>
              <span className="text-xs text-slate-500">
                {allAccounts.findIndex(acc => acc.account_number === id || acc.id === id) + 1} / {allAccounts.length}
              </span>
            </div>

            <div className="relative">
                <div
                  ref={accountTabsScrollRef}
                  className="flex overflow-x-auto gap-2 custom-scrollbar pb-1 cursor-grab select-none"
                  style={{ 
                    scrollbarWidth: 'thin',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    overscrollBehaviorX: 'contain',
                    scrollBehavior: 'smooth'
                  }}
                  onWheel={(e) => {
                    // Prevent main page scrolling ALWAYS when over account tabs
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🎯 React onWheel triggered:', e.deltaY);
                    
                    if (e.deltaY !== 0) {
                      const container = accountTabsScrollRef.current;
                      if (container && container.scrollWidth > container.clientWidth) {
                        const oldScrollLeft = container.scrollLeft;
                        container.scrollLeft += e.deltaY * 1.5;
                        
                        console.log('🎯 React onWheel scroll applied:', {
                          deltaY: e.deltaY,
                          oldScrollLeft,
                          newScrollLeft: container.scrollLeft,
                          scrollChanged: oldScrollLeft !== container.scrollLeft
                        });
                      } else {
                        console.log('🚫 Page scroll prevented - no horizontal scroll needed');
                      }
                    }
                  }}
                >
                {allAccounts.map((acc) => {
                  const isActive = (acc.account_number === id || acc.id === id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => switchToAccount(acc.id, acc.account_number)}
                      className={`flex min-w-fit flex-shrink-0 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "border-cyan-600 bg-cyan-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${
                          acc.is_active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span>
                        <span className="block text-[13px] font-medium text-slate-900">
                          {acc.name}
                        </span>
                        <span className="block text-xs text-slate-500 num">
                          #{acc.account_number || acc.id}
                        </span>
                      </span>
                      <span className="border-l border-slate-200 pl-3 text-right">
                        <span className="block text-[13px] font-semibold text-slate-900 num">
                          {formatCurrency(parseFloat(acc.balance?.toString() || "0"))}
                        </span>
                        <span className="block text-xs text-slate-500">
                          ব্যালেন্স
                        </span>
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
          </div>
        )}

        {/* Ledger tabs — each one is a kind of money movement, and "নতুন
            লেনদেন" opens pre-set to whichever tab you are standing on, so
            adding an expense from the খরচ tab needs no extra choices. */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2" role="tablist">
              {LEDGER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={ledgerTab === tab.value}
                  onClick={() => {
                    setLedgerTab(tab.value);
                    setFilters((prev) => ({
                      ...prev,
                      type: tab.type,
                      nature: tab.nature,
                    }));
                  }}
                  className={`btn btn-sm ${
                    ledgerTab === tab.value ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Link href="/dashboard/banking/loans" className="btn btn-ghost btn-sm">
              <Landmark className="h-3.5 w-3.5" />
              লোন ও কিস্তি
            </Link>
          </div>
        </div>

        {/* Filters and search */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="কারণ বা রেফারেন্স নম্বর দিয়ে খুঁজুন"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9"
                aria-label="লেনদেন খুঁজুন"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            <select
              value={filters.verified_by || "all"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  verified_by: e.target.value,
                }))
              }
              className="select w-auto"
              aria-label="কর্মচারী"
            >
              <option value="all">সব কর্মচারী</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="select w-auto"
              aria-label="সময়"
            >
              <option value="all">সব সময়</option>
              <option value="today">আজ</option>
              <option value="yesterday">গতকাল</option>
              <option value="week">গত সপ্তাহ</option>
              <option value="month">গত মাস</option>
              <option value="3months">গত 3 মাস</option>
              <option value="custom">নিজের মতো তারিখ</option>
            </select>

            {dateRange === "custom" && customStartDate && customEndDate && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {new Date(customStartDate).toLocaleDateString()} —{" "}
                {new Date(customEndDate).toLocaleDateString()}
              </span>
            )}

            {dateRange === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="input w-auto"
                  aria-label="শুরুর তারিখ"
                />
                <span className="text-sm text-slate-500">থেকে</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="input w-auto"
                  aria-label="শেষ তারিখ"
                />
              </div>
            )}

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
                  setCurrentPage(1);
                }}
                className="btn btn-ghost btn-sm"
              >
                ফিল্টার মুছে দিন
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="plane-section flex items-start gap-3">
            <p className="flex-1 text-sm font-medium text-rose-600">{error}</p>
            <button
              onClick={() => setError(null)}
              aria-label="বার্তাটা সরান"
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Transaction History */}
        {getTransactionsWithRunningBalance().length === 0 ? (
          <div className="empty">
            <DollarSign className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="mb-1 font-medium text-slate-600">
              {transactions.length === 0
                ? "এখনো কোনো লেনদেন নেই"
                : "ফিল্টারের সাথে মেলে এমন কোনো লেনদেন নেই"}
            </p>
            <p className="mb-3 text-sm">
              {transactions.length === 0
                ? "শুরু করতে প্রথম লেনদেনটা যোগ করুন"
                : "খোঁজা বা ফিল্টার একটু বদলে দেখুন"}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={() => setShowAddTransactionModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" /> প্রথম লেনদেন যোগ করুন
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>তারিখ</th>
                    <th>টাইপ</th>
                    <th className="cell-num">টাকার পরিমাণ</th>
                    <th>কী কারণে</th>
                    <th>খাত</th>
                    <th>যাচাই করেছেন</th>
                    <th className="cell-num">চলতি ব্যালেন্স</th>
                  </tr>
                </thead>
                <tbody>
                  {getTransactionsWithRunningBalance().map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="whitespace-nowrap num">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            transaction.type === "credit"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {transaction.type === "credit" ? "জমা" : "খরচ"}
                        </span>
                      </td>
                      <td
                        className={`cell-num font-semibold ${
                          transaction.type === "credit"
                            ? "money-pos"
                            : "money-neg"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(parseFloat(transaction.amount.toString()))}
                      </td>
                      <td>
                        <span className="block max-w-[16rem] truncate" title={transaction.purpose}>
                          {transaction.purpose}
                        </span>
                      </td>
                      <td>
                        {/* Reading the ledger without the bucket means going to
                            analytics to find out where a row landed. */}
                        {transaction.type === "debit" && transaction.category ? (
                          <span className="badge badge-muted">
                            {CATEGORY_LABELS[transaction.category] ??
                              transaction.category}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {getEmployeeName(transaction.verified_by, transaction.verified_by_details) ?? "—"}
                        </span>
                      </td>
                      <td
                        className={`cell-num font-semibold ${
                          transaction.runningBalance >= 0
                            ? "money-pos"
                            : "money-neg"
                        }`}
                      >
                        {transaction.runningBalance >= 0 ? "+" : ""}
                        {formatCurrency(transaction.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="plane-section flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  পেজ <span className="num">{currentPage}</span> / <span className="num">{totalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-ghost btn-sm"
                  >
                    আগের
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-ghost btn-sm"
                  >
                    পরের
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <AddTransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => setShowAddTransactionModal(false)}
          onSubmit={handleAddTransaction}
          account={account}
          preset={LEDGER_TABS.find((tab) => tab.value === ledgerTab)}
        />
      )}
    </div>
  );
}

// Add Transaction Modal Component
function AddTransactionModal({ isOpen, onClose, onSubmit, preset }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  account?: BankAccount | null;
  /** The ledger tab the user opened this from, so the form starts there. */
  preset?: { type: "all" | "credit" | "debit"; nature?: string };
}) {
  const [formData, setFormData] = useState({
    type: (preset?.type === "all" ? "credit" : preset?.type ?? "credit") as
      | "credit"
      | "debit",
    // `nature` is what the money was for; `category` groups it in the monthly
    // cost report. Only meaningful for money going out.
    nature: preset?.nature ?? "expense",
    category: "other",
    amount: "",
    purpose: "",
    verified_by: "",
  });
  const [loading, setLoading] = useState(false);
  // Categories this shop has typed before, offered alongside the presets.
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    ApiService.getExpenseCategories()
      .then((res: { custom?: string[] }) => setCustomCategories(res?.custom ?? []))
      .catch(() => setCustomCategories([]));
  }, [isOpen]);

  // Reopening from a different tab should land on that tab's kind, not on
  // whatever was chosen last time.
  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...prev,
      type: preset?.type === "all" ? "credit" : preset?.type ?? "credit",
      nature: preset?.nature ?? prev.nature,
    }));
  }, [isOpen, preset?.type, preset?.nature]);
  const [employees, setEmployees] = useState<EmployeeLike[]>([]);
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
        // Money coming in is never an expense, and a withdrawal carries no cost
        // bucket — sending either would put the wrong row into the cost report.
        nature: formData.type === "credit" ? "income" : formData.nature,
        category:
          formData.type === "credit" || formData.nature === "withdrawal"
            ? ""
            : formData.category,
      };
      await onSubmit(submitData);
      setFormData({
        type: "credit",
        nature: "expense",
        category: "other",
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">নতুন লেনদেন</h2>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <span className="label">লেনদেনের টাইপ</span>
              {/* Three kinds, not two. জমা and উত্তোলন are ordinary movements
                  of the shop's own money; only খরচ reaches the analytics cost
                  report, so lumping them together inflated the expenses. */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      kind: "credit",
                      label: "জমা",
                      icon: <ArrowDownLeft className="h-4 w-4" />,
                      active:
                        "border-emerald-500 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400",
                    },
                    {
                      kind: "withdrawal",
                      label: "উত্তোলন",
                      icon: <ArrowLeftRight className="h-4 w-4" />,
                      active:
                        "border-amber-500 bg-amber-100 text-amber-800 ring-1 ring-amber-400",
                    },
                    {
                      kind: "debit",
                      label: "খরচ",
                      icon: <ArrowUpRight className="h-4 w-4" />,
                      active:
                        "border-rose-500 bg-rose-100 text-rose-800 ring-1 ring-rose-400",
                    },
                  ] as const
                ).map((option) => {
                  const isActive =
                    option.kind === "withdrawal"
                      ? formData.type === "debit" &&
                        formData.nature === "withdrawal"
                      : formData.type === option.kind &&
                        formData.nature !== "withdrawal";
                  return (
                    <button
                      key={option.kind}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: option.kind === "credit" ? "credit" : "debit",
                          nature:
                            option.kind === "credit"
                              ? "income"
                              : option.kind === "withdrawal"
                              ? "withdrawal"
                              : "expense",
                        })
                      }
                      className={`btn ${isActive ? `btn-ghost ${option.active}` : "btn-ghost"}`}
                    >
                      {option.icon} {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Only real spending needs classifying. জমা and উত্তোলন move the
                shop's own money, so they carry no cost bucket and never reach
                the analytics expense report. */}
            {formData.type === "debit" && formData.nature !== "withdrawal" && (
              <div>
                <div>
                  <label className="label" htmlFor="transaction-category">
                    কোন খাতে
                  </label>
                  <ComboBox
                    id="transaction-category"
                    value={formData.category}
                    onChange={(next) =>
                      setFormData({ ...formData, category: next })
                    }
                    options={[
                      ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      })),
                      ...customCategories.map((name) => ({
                        value: name,
                        label: name,
                      })),
                    ]}
                    placeholder="খাত বেছে নিন বা লিখুন"
                    addLabel="নতুন খাত হিসেবে যোগ করুন"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    অ্যানালিটিক্সে খাত ধরে খরচের ভাঙন দেখাবে
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="transaction-amount">
                টাকার পরিমাণ
              </label>
              <input
                id="transaction-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value,
                  })
                }
                className="input num"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="transaction-purpose">
                কী কারণে
              </label>
              <input
                id="transaction-purpose"
                type="text"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purpose: e.target.value,
                  })
                }
                className="input"
                placeholder="লেনদেনের কারণ লিখুন…"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="transaction-verified-by">
                কে যাচাই করেছেন
              </label>
              <select
                id="transaction-verified-by"
                value={formData.verified_by}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    verified_by: e.target.value,
                  })
                }
                className="select"
                required
              >
                <option value="">কর্মচারী সিলেক্ট করুন…</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`}
                  </option>
                ))}
              </select>
              {loadingEmployees && (
                <p className="mt-1 text-xs text-slate-500">কর্মচারী লোড হচ্ছে…</p>
              )}
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> যোগ হচ্ছে…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> যোগ করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
