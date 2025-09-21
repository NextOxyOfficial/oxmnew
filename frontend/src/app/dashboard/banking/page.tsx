"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useBanking } from "@/hooks/useBanking";
import { ApiService } from "@/lib/api";
import type {
  BankAccount,
  Transaction,
  TransactionFilters,
  TransactionWithBalance,
} from "@/types/banking";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function BankingPage() {
  const { isAuthenticated, loading: authLoading, user, profile } = useAuth();
  const { currency } = useCurrency();
  const formatCurrency = useCurrencyFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    accounts,
    transactions,
    employees,
    selectedAccountId,
    selectedAccount,
    loading,
    error,
    isAuthenticated: bankingAuth,
    authLoading: bankingAuthLoading,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    setSelectedAccountId,
    setError,
    loadEmployees,
    createAccount,
    updateAccount,
    createTransaction,
    loadTransactions,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refreshCurrentPage,
    refreshData,
    debugInfo,
  } = useBanking();

  // All state hooks must come before any early returns
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
    balance: "",
  });

  // Address form state for payment
  const [addressForm, setAddressForm] = useState({
    phone: "",
    address: "",
    city: "",
    post_code: "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    type: "debit" as "debit" | "credit",
    amount: "",
    purpose: "",
    verified_by: "",
  });

  // Payment verification states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // User subscription state
  const [userSubscription, setUserSubscription] = useState<string>("free");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Function to load user subscription status
  const loadUserSubscription = useCallback(async () => {
    try {
      setIsLoadingSubscription(true);
      const subscriptionData = await ApiService.getMySubscription();
      
      if (subscriptionData?.success && subscriptionData?.subscription?.plan?.name) {
        setUserSubscription(subscriptionData.subscription.plan.name.toLowerCase());
      } else {
        setUserSubscription("free");
      }
    } catch (error) {
      console.error("Failed to load user subscription:", error);
      setUserSubscription("free");
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Auto-hide success message after 10 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Load user subscription on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserSubscription();
    }
  }, [isAuthenticated, user, loadUserSubscription]);

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
          currentFilters.date_from = filterDate.toISOString().split("T")[0];
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          currentFilters.date_from = filterDate.toISOString().split("T")[0];
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          currentFilters.date_from = filterDate.toISOString().split("T")[0];
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          currentFilters.date_from = filterDate.toISOString().split("T")[0];
          break;
      }
    }

    refreshCurrentPage(currentFilters);
  }, [
    selectedAccountId,
    filters,
    searchTerm,
    dateRange,
    customStartDate,
    customEndDate,
    refreshCurrentPage,
  ]);

  // Update transactions when filters change
  useEffect(() => {
    loadFilteredTransactions();
  }, [loadFilteredTransactions]);

  // Load employees when component mounts
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Refresh banking data when page becomes visible (e.g., returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log("🔄 Page became visible, refreshing banking data...");
        refreshData();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated) {
        console.log("🔄 Window focused, refreshing banking data...");
        refreshData();
      }
    };

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, refreshData]);

  // Initialize address form with profile data when create account modal opens
  useEffect(() => {
    if (showCreateAccountModal && profile) {
      setAddressForm({
        phone: profile?.phone || profile?.contact_number || "",
        address: profile?.address || "",
        city: profile?.city || "",
        post_code: profile?.post_code || "",
      });
    }
  }, [showCreateAccountModal, profile]);

  // Debug info - temporary
  console.log("Banking Debug Info:", debugInfo, { accounts, error });

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
          <p className="text-red-400 font-medium mb-2">
            Authentication Required
          </p>
          <p className="text-red-300 text-sm">
            Please log in to access the banking features.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;

    try {
      // For Main account, create directly without payment
      if (newAccount.name === "Main") {
        await createAccount({
          name: newAccount.name,
          balance: parseFloat(newAccount.balance) || 0,
        });
        setNewAccount({ name: "", balance: "" });
        setShowCreateAccountModal(false);
        return;
      }

      // For other accounts, check if user has pro subscription
      if (userSubscription === "pro") {
        // Check if user has reached the 5-account limit
        if (accounts.length >= 5) {
          alert("You have reached the maximum limit of 5 accounts. Please delete an existing account before creating a new one.");
          return;
        }
        
        // User has pro subscription and is under the limit, create account directly
        await createAccount({
          name: newAccount.name,
          balance: parseFloat(newAccount.balance) || 0,
        });
        setNewAccount({ name: "", balance: "" });
        setShowCreateAccountModal(false);
        return;
      } else {
        // User is on free plan, redirect to subscription page
        alert("Upgrade to Pro to create additional accounts. Redirecting to subscriptions page...");
        router.push("/dashboard/subscriptions");
        return;
      }
    } catch (error: any) {
      console.error("Account creation error:", error);
      alert(error.message || "Failed to create account. Please try again.");
    }
  };

  const handleBankingPlanPayment = async (
    planType: string,
    accountId: string
  ) => {
    if (!isAuthenticated || !user || !profile) {
      alert("Please log in and complete your profile to proceed with payment.");
      return;
    }

    // Validate profile completeness
    const requiredFields = {
      "First Name": user.first_name,
      Address: profile?.address,
      City: profile?.city,
      Phone: profile?.phone || profile?.contact_number,
      "Post Code": profile?.post_code,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || value.trim() === "")
      .map(([field]) => field);

    if (missingFields.length > 0) {
      const missingFieldsList = missingFields.join(", ");
      const confirmRedirect = confirm(
        `Your profile is incomplete. The following fields are required for payment: ${missingFieldsList}\n\nWould you like to complete your profile now?`
      );

      if (confirmRedirect) {
        window.location.href = "/dashboard/profile";
      }
      return;
    }

    try {
      // Set loading state
      const planPrice = planType === "yearly" ? 1099 : 99;

      // Generate unique order ID
      const uniqueOrderId = `BANK-${planType.toUpperCase()}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Store plan and account info for after payment
      localStorage.setItem("pending_banking_plan", planType);
      localStorage.setItem("pending_banking_account", accountId);
      localStorage.setItem("pending_banking_price", planPrice.toString());

      // Prepare payment data
      const firstName = user.first_name!;
      const lastName = user.last_name || "";
      const address = profile.address!;
      const city = profile.city!;
      const phone = profile.phone || profile.contact_number!;
      const zip = profile.post_code!;

      const paymentData = {
        amount: planPrice,
        order_id: uniqueOrderId,
        currency: currency,
        customer_name: `${firstName} ${lastName}`.trim(),
        customer_address: address,
        customer_phone: phone,
        customer_city: city,
        customer_post_code: zip,
      };

      // Create payment request
      const payment = await ApiService.makePayment(paymentData);

      if (payment && payment.checkout_url) {
        window.open(payment.checkout_url, "_blank");
      } else {
        throw new Error("Failed to get payment URL. Please try again later.");
      }
    } catch (error) {
      console.error("Banking plan payment error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process payment. Please try again.";
      alert(`Payment Error: ${errorMessage}`);

      // Clean up storage on error
      localStorage.removeItem("pending_banking_plan");
      localStorage.removeItem("pending_banking_account");
      localStorage.removeItem("pending_banking_price");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      selectedAccountId &&
      newTransaction.amount &&
      newTransaction.purpose &&
      newTransaction.verified_by
    ) {
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

        setNewTransaction({
          type: "debit",
          amount: "",
          purpose: "",
          verified_by: "",
        });
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
        const originalAccount = accounts.find(
          (acc) => acc.id === editedAccount.id
        );
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
    setEditableAccounts(
      editableAccounts.map((account) =>
        account.id === accountId ? { ...account, name: newName } : account
      )
    );
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

  // Filter transactions (now using local state since transactions are already filtered by backend)
  const getFilteredTransactions = () => {
    // Transactions are already filtered by the backend API call
    return transactions;
  };

  // Calculate running balance for transactions
  const getTransactionsWithRunningBalance = (): TransactionWithBalance[] => {
    const filteredTransactions = getFilteredTransactions();
    if (!selectedAccount || filteredTransactions.length === 0) return [];

    // Sort transactions by date and time (newest first for display order)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
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
    const currentBalance = Number(selectedAccount.balance) || 0;

    // Start with current balance and work backwards for each transaction
    // This approach shows what the balance was after each transaction
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

  // Download functions
  const downloadCSV = () => {
    const transactionsWithBalance = getTransactionsWithRunningBalance();
    if (transactionsWithBalance.length === 0) return;

    const headers = [
      "Date",
      "Type",
      "Amount",
      "Purpose",
      "Verified By",
      "Status",
      "Running Balance",
    ];
    const csvContent = [
      headers.join(","),
      ...transactionsWithBalance.map((t) =>
        [
          new Date(t.date).toLocaleDateString(),
          t.type,
          t.amount,
          `"${t.purpose}"`,
          `"${getEmployeeName(t.verified_by, t.verified_by_details)}"`,
          t.status,
          t.runningBalance,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedAccount?.name || "account"}_transactions_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const transactionsWithBalance = getTransactionsWithRunningBalance();
    if (transactionsWithBalance.length === 0) return;

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
          <h1>${selectedAccount?.name || "Account"} Transaction Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Credits: +${(
              getAccountSummary(true).totalCredit || 0
            ).toFixed(2)}</p>
            <p>Total Debits: -${(
              getAccountSummary(true).totalDebit || 0
            ).toFixed(2)}</p>
            <p>Net Amount: ${(
              (getAccountSummary(true).totalCredit || 0) -
              (getAccountSummary(true).totalDebit || 0)
            ).toFixed(2)}</p>
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
                <th>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsWithBalance
                .map(
                  (t) => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td style="color: ${
                    t.type === "credit" ? "green" : "red"
                  }">${t.type.toUpperCase()}</td>
                  <td style="color: ${t.type === "credit" ? "green" : "red"}">${
                    t.type === "credit" ? "+" : "-"
                  }$${t.amount.toFixed(2)}</td>
                  <td>${t.purpose}</td>
                  <td>${getEmployeeName(
                    t.verified_by,
                    t.verified_by_details
                  )}</td>
                  <td>${t.status}</td>
                  <td style="color: ${
                    t.runningBalance >= 0 ? "green" : "red"
                  }">${
                    t.runningBalance >= 0 ? "+" : ""
                  }$${t.runningBalance.toFixed(2)}${
                    t.runningBalance < 0 ? " (Overdraft)" : ""
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Calculate totals for selected account (use filtered transactions for display)
  const getAccountSummary = (useFiltered = false) => {
    if (!selectedAccountId) return { totalCredit: 0, totalDebit: 0 };

    const transactionsToUse = useFiltered
      ? getTransactionsWithRunningBalance()
      : transactions;
    const totalCredit = transactionsToUse
      .filter((t: Transaction | TransactionWithBalance) => t.type === "credit")
      .reduce((sum: number, t: Transaction | TransactionWithBalance) => {
        const amount = Number(t.amount) || 0;
        return sum + amount;
      }, 0);
    const totalDebit = transactionsToUse
      .filter((t: Transaction | TransactionWithBalance) => t.type === "debit")
      .reduce((sum: number, t: Transaction | TransactionWithBalance) => {
        const amount = Number(t.amount) || 0;
        return sum + amount;
      }, 0);

    return {
      totalCredit: Number(totalCredit) || 0,
      totalDebit: Number(totalDebit) || 0,
    };
  };

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <CreditCard className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Banking Dashboard
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Manage your accounts and track financial transactions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => downloadCSV()}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer text-sm font-medium text-gray-300 hover:text-white flex items-center space-x-2"
                title="Download transaction report"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={refreshData}
                disabled={loading}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer text-sm font-medium text-gray-300 hover:text-white flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh banking data"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

        {/* Main Content */}
        {accounts.length === 0 ? (
          /* No Accounts State */
          <div className="bg-slate-900/50 border-2 border-dashed border-slate-700/50 rounded-xl p-12 text-center">
            <CreditCard className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No accounts yet
            </h3>
            <p className="text-slate-500 mb-4">
              {userSubscription === "pro" ? "Create your first account to get started" : "Upgrade to Pro to create accounts"}
            </p>
            <button
              onClick={() => setShowCreateAccountModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
            >
              {userSubscription === "pro" ? "Create First Account" : "Upgrade to Pro"}
            </button>
          </div>
        ) : (
          /* Accounts Layout */
          <div className="space-y-6">
            {/* Account Selection */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-700/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    <span>Account Overview</span>
                  </h2>
                  <div className="text-sm text-slate-400">
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''} total
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...accounts]
                    .sort((a, b) => {
                      // Always put Main account first
                      if (a.name === "Main") return -1;
                      if (b.name === "Main") return 1;
                      // Then sort by creation date (newest first)
                      return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                      );
                    })
                    .map((account, index) => {
                      const isSelected = selectedAccountId === account.id;
                      const balance = Number(account.balance) || 0;
                      
                      const colorSchemes = [
                        {
                          bg: isSelected
                            ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/40"
                            : "bg-slate-800/30 border-slate-700/50 hover:bg-blue-500/10 hover:border-blue-500/30",
                          text: isSelected ? "text-blue-300" : "text-slate-300 hover:text-blue-300",
                          icon: "text-blue-400",
                          badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                        },
                        {
                          bg: isSelected
                            ? "bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/40"
                            : "bg-slate-800/30 border-slate-700/50 hover:bg-purple-500/10 hover:border-purple-500/30",
                          text: isSelected ? "text-purple-300" : "text-slate-300 hover:text-purple-300",
                          icon: "text-purple-400",
                          badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                        },
                        {
                          bg: isSelected
                            ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/40"
                            : "bg-slate-800/30 border-slate-700/50 hover:bg-green-500/10 hover:border-green-500/30",
                          text: isSelected ? "text-green-300" : "text-slate-300 hover:text-green-300",
                          icon: "text-green-400",
                          badge: "bg-green-500/20 text-green-400 border-green-500/30",
                        },
                        {
                          bg: isSelected
                            ? "bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/40"
                            : "bg-slate-800/30 border-slate-700/50 hover:bg-orange-500/10 hover:border-orange-500/30",
                          text: isSelected ? "text-orange-300" : "text-slate-300 hover:text-orange-300",
                          icon: "text-orange-400",
                          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
                        },
                      ];

                      // Use different color scheme for Main account (always blue)
                      const scheme =
                        account.name === "Main"
                          ? colorSchemes[0]
                          : colorSchemes[index % 4];

                      return (
                        <div
                          key={account.id}
                          onClick={() => setSelectedAccountId(account.id)}
                          className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${scheme.bg}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-md bg-slate-700/50 ${scheme.icon}`}>
                              <CreditCard className="h-4 w-4" />
                            </div>
                            {account.name === "Main" && (
                              <span className={`text-xs px-2 py-1 rounded-full border ${scheme.badge}`}>
                                Main
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className={`font-semibold text-sm ${scheme.text}`}>
                              {account.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Account #{account.account_number || account.id}
                            </p>
                            <p className={`font-bold text-lg ${
                              balance >= 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {formatCurrency(balance)}
                            </p>
                          </div>
                          
                          {isSelected && (
                            <div className="absolute inset-0 ring-2 ring-cyan-400/50 rounded-lg pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  
                  {/* Create Account Card - Only show if less than 5 accounts */}
                  {accounts.length < 5 && (
                    <div
                      onClick={() => setShowCreateAccountModal(true)}
                      className="relative p-4 rounded-lg border border-dashed border-slate-600/50 bg-slate-800/20 hover:bg-slate-700/30 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
                    >
                      <div className="p-2 rounded-md bg-slate-700/30 mb-2">
                        <Plus className="h-4 w-4 text-cyan-400" />
                      </div>
                      <h3 className="font-semibold text-sm text-slate-300 mb-1">
                        Create Account
                      </h3>
                      <p className="text-xs text-slate-500 text-center">
                        {userSubscription === "pro" 
                          ? `${accounts.length}/5 accounts` 
                          : "For pro users"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Account Content */}
            {selectedAccountId && selectedAccount && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
                {/* Account Summary */}
                <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-700/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <span>{selectedAccount.name} Account</span>
                    </h3>
                    <button
                      onClick={handleOpenSettings}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
                      title="Account Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-md bg-cyan-500/20 p-2">
                          <DollarSign className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm text-cyan-300 font-medium">
                            Current Balance
                          </p>
                          <p
                            className={`text-xl font-bold ${
                              selectedAccount && selectedAccount.balance >= 0
                                ? "text-cyan-400"
                                : "text-red-400"
                            }`}
                          >
                            {selectedAccount
                              ? formatCurrency(selectedAccount.balance)
                              : formatCurrency(0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-md bg-green-500/20 p-2">
                          <ArrowDownLeft className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-green-300 font-medium">
                            Total Credits
                          </p>
                          <p className="text-xl font-bold text-green-400">
                            +{formatCurrency(getAccountSummary().totalCredit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500/15 to-red-600/8 border border-red-500/25 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-md bg-red-500/20 p-2">
                          <ArrowUpRight className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm text-red-300 font-medium">
                            Total Debits
                          </p>
                          <p className="text-xl font-bold text-red-400">
                            -{formatCurrency(getAccountSummary().totalDebit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="p-6 border-b border-slate-700/50 bg-slate-800/10">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-4 xl:space-y-0 gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 flex-1">
                      {/* Add Transaction Button */}
                      <button
                        onClick={() => setShowTransactionModal(true)}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center gap-2 whitespace-nowrap lg:w-auto w-full justify-center cursor-pointer active:scale-95"
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
                          className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2.5 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        {/* Type Filter */}
                        <select
                          value={filters.type || "all"}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              type: e.target.value as any,
                            }))
                          }
                          className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[130px] cursor-pointer"
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
                          className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[150px] cursor-pointer"
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
                              {employee.name}
                            </option>
                          ))}
                        </select>

                        {/* Date Range Selector */}
                        <select
                          value={dateRange}
                          onChange={(e) => handleDateRangeChange(e.target.value)}
                          className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[130px] cursor-pointer"
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
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Custom Date Range Display */}
                      {dateRange === "custom" &&
                        customStartDate &&
                        customEndDate && (
                          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/50">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(customStartDate).toLocaleDateString()} -{" "}
                              {new Date(customEndDate).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => setShowDateRangeModal(true)}
                              className="text-cyan-400 hover:text-cyan-300 ml-1 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}

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
                            });
                            setDateRange("all");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setTempStartDate("");
                            setTempEndDate("");
                          }}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-700/50"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
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
                          onClick={() => setShowTransactionModal(true)}
                          className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                        >
                          Add First Transaction
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700/50">
                          <tr>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                              Type
                            </th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                              Purpose
                            </th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                              Verified By
                            </th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium text-xs uppercase tracking-wider">
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
                                <td className="py-4 px-4 text-sm text-slate-300">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-4">
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
                                  className={`py-4 px-4 font-semibold text-sm ${
                                    transaction.type === "credit"
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {transaction.type === "credit" ? "+" : "-"}
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-300 max-w-xs">
                                  <div className="truncate" title={transaction.purpose}>
                                    {transaction.purpose}
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-300">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-3 h-3 text-slate-500" />
                                    <span className="text-xs">
                                      {getEmployeeName(
                                        transaction.verified_by,
                                        transaction.verified_by_details
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  className={`py-4 px-4 font-semibold text-sm ${
                                    transaction.runningBalance >= 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {transaction.runningBalance >= 0 ? "+" : ""}
                                  {formatCurrency(transaction.runningBalance)}
                                  {transaction.runningBalance < 0 && (
                                    <span className="text-xs text-red-500/70 ml-1">
                                      (Overdraft)
                                    </span>
                                  )}
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
                              Page {currentPage} of {totalPages} ({totalCount} total transactions)
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={loadPreviousPage}
                                disabled={!hasPreviousPage}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                                  hasPreviousPage
                                    ? "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white cursor-pointer"
                                    : "bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed"
                                }`}
                              >
                                Previous
                              </button>
                              
                              {/* Page numbers */}
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum;
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else {
                                    // Show pages around current page
                                    const start = Math.max(1, currentPage - 2);
                                    const end = Math.min(totalPages, start + 4);
                                    pageNum = start + i;
                                    if (pageNum > end) return null;
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => goToPage(pageNum)}
                                      className={`w-8 h-8 text-xs font-medium rounded-lg border transition-all duration-200 ${
                                        currentPage === pageNum
                                          ? "bg-cyan-500 border-cyan-500 text-white"
                                          : "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white cursor-pointer"
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              <button
                                onClick={loadNextPage}
                                disabled={!hasNextPage}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                                  hasNextPage
                                    ? "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white cursor-pointer"
                                    : "bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Results Summary */}
                      <div className="p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/20 to-slate-700/20">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            Showing {getTransactionsWithRunningBalance().length} transactions on this page
                            {totalPages > 1 && ` (${totalCount} total)`}
                            {(searchTerm ||
                              filters.type !== "all" ||
                              filters.verified_by !== "all" ||
                              dateRange !== "all" ||
                              customStartDate ||
                              customEndDate) &&
                              " (filtered)"}
                          </span>
                          {getTransactionsWithRunningBalance().length > 0 && (
                            <div className="flex items-center space-x-3">
                              <span className="text-green-400 text-xs">
                                +
                                {formatCurrency(
                                  getAccountSummary(true).totalCredit || 0
                                )}
                              </span>
                              <span className="text-red-400 text-xs">
                                -
                                {formatCurrency(
                                  getAccountSummary(true).totalDebit || 0
                                )}
                              </span>

                              {/* Export Options */}
                              <div className="flex items-center space-x-1.5 ml-3 pl-3 border-l border-slate-600/50">
                                <span className="text-xs text-slate-500">
                                  Export:
                                </span>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg mx-auto backdrop-blur-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-t-2xl">
                  <h2 className="text-lg font-semibold text-white">
                    Create Account
                </h2>
                <button
                  onClick={() => {
                    setShowCreateAccountModal(false);
                    setNewAccount({
                      name: "",
                      balance: "",
                    });
                    setAddressErrors({});
                    setAddressForm({
                      phone: "",
                      address: "",
                      city: "",
                      post_code: "",
                    });
                  }}
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
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, name: e.target.value })
                    }
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
                    type="text"
                    value={newAccount.balance}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty, numbers, and decimal point
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setNewAccount({
                          ...newAccount,
                          balance: value,
                        });
                      }
                    }}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    placeholder="Enter initial balance (e.g., 1000.00)"
                  />
                </div>

                {/* Subscription Status */}
                <div className="bg-slate-800/30 rounded-lg border border-slate-700/30 p-4">
                  {isLoadingSubscription ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                      <span className="ml-2 text-slate-400">Checking subscription...</span>
                    </div>
                  ) : userSubscription === "pro" ? (
                    <div className="text-center">
                      <div className="text-green-400 font-medium mb-2">✓ Pro Subscription Active</div>
                      <div className="text-sm text-slate-400">
                        You can create up to 5 accounts with your Pro subscription.
                      </div>
                      {accounts.length >= 5 && (
                        <div className="text-xs text-orange-400 mt-2">
                          Account limit reached (5/5)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-orange-400 font-medium mb-2">⚡ Upgrade Required</div>
                      <div className="text-sm text-slate-400 mb-3">
                        Pro subscription required to create additional accounts.
                      </div>
                      <div className="text-xs text-slate-500">
                        Free users can only use the Main account.
                      </div>
                    </div>
                  )}
                </div>

                {/* Main form buttons */}
                <div className="flex space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Clean up any pending account data
                      localStorage.removeItem("pending_banking_account_data");
                      setNewAccount({
                        name: "",
                        balance: "",
                      });
                      setShowCreateAccountModal(false);
                      setAddressErrors({});
                      setAddressForm({
                        phone: "",
                        address: "",
                        city: "",
                        post_code: "",
                      });
                    }}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white py-2 px-3 rounded-lg hover:bg-slate-600/50 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={userSubscription === "pro" && accounts.length >= 5}
                    className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer ${
                      userSubscription === "pro" && accounts.length >= 5
                        ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700"
                    }`}
                  >
                    {userSubscription === "pro" 
                      ? accounts.length >= 5 
                        ? "Account Limit Reached" 
                        : "Create Account"
                      : "Upgrade to Pro"
                    }
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}



        {/* Add Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-auto backdrop-blur-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">
                    Add Transaction
                  </h2>
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
                      onClick={() =>
                        setNewTransaction({ ...newTransaction, type: "debit" })
                      }
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
                      onClick={() =>
                        setNewTransaction({ ...newTransaction, type: "credit" })
                      }
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
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
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
                    value={newTransaction.purpose}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
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
                    value={newTransaction.verified_by}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
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
                        {employee.name}
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
          </div>
        )}

        {/* Custom Date Range Modal */}
        {showDateRangeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Select Date Range
                </h2>
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
                      <span>
                        Selected range:{" "}
                        {new Date(tempStartDate).toLocaleDateString()} -{" "}
                        {new Date(tempEndDate).toLocaleDateString()}
                      </span>
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
                  <h2 className="text-lg font-semibold text-white">
                    Account Settings
                  </h2>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-700/50 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="text-sm text-slate-400 mb-3">
                    Manage your account names. Balances are view-only and
                    updated through transactions.
                  </div>

                  <div className="space-y-3">
                    {editableAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between space-x-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                              Account Name
                            </label>
                            <input
                              type="text"
                              value={account.name}
                              onChange={(e) =>
                                handleAccountNameChange(
                                  account.id,
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                              placeholder="Enter account name..."
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                              Current Balance
                            </label>
                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg py-2 px-3 text-sm">
                              <span
                                className={`font-semibold ${
                                  account.balance >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {formatCurrency(account.balance)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Created:{" "}
                          {new Date(account.created_at).toLocaleDateString()}
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
    </>
  );
}
