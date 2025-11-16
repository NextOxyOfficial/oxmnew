"use client";

import SmsComposer from "@/components/sms/SmsComposer";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { customersAPI, DueCustomer } from "@/lib/api/customers";
import { calculateSmsSegments } from "@/lib/utils/sms";
import {
  DollarSign,
  Download,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Import dev auth helper in development
if (process.env.NODE_ENV === "development") {
  import("@/lib/dev-auth");
}

export default function DueBookPage() {
  const [dueCustomers, setDueCustomers] = useState<DueCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<DueCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilterType, setDateFilterType] = useState<
    | "all"
    | "today"
    | "yesterday"
    | "this_week"
    | "last_week"
    | "this_month"
    | "last_month"
    | "this_year"
    | "custom"
  >("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [totalDueAmount, setTotalDueAmount] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<'customers' | 'history'>('customers');

  // SMS Composer state
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsCustomer, setSmsCustomer] = useState<DueCustomer | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Due History state
  const [dueHistory, setDueHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPagination, setHistoryPagination] = useState({
    hasNext: false,
    currentPage: 1,
    isLoadingMore: false,
  });

  // User profile state for store name
  const [userProfile, setUserProfile] = useState<{
    user?: { email?: string };
    profile?: {
      company?: string;
      company_address?: string;
      phone?: string;
      contact_number?: string;
      store_logo?: string;
    };
  } | null>(null);

  // Component mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Date filter helper functions
  const getDateRange = useCallback(
    (filter: string) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (filter) {
        case "today":
          return { start: today, end: new Date(today.getTime() + 86400000) };
        case "yesterday":
          const yesterday = new Date(today.getTime() - 86400000);
          return { start: yesterday, end: today };
        case "this_week":
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return {
            start: startOfWeek,
            end: new Date(now.getTime() + 86400000),
          };
        case "last_week":
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
          const lastWeekEnd = new Date(today);
          lastWeekEnd.setDate(today.getDate() - today.getDay());
          return { start: lastWeekStart, end: lastWeekEnd };
        case "this_month":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return {
            start: startOfMonth,
            end: new Date(now.getTime() + 86400000),
          };
        case "last_month":
          const lastMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
          return { start: lastMonthStart, end: lastMonthEnd };
        case "this_year":
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return {
            start: startOfYear,
            end: new Date(now.getTime() + 86400000),
          };
        case "custom":
          if (customDateFrom && customDateTo) {
            return {
              start: new Date(customDateFrom),
              end: new Date(new Date(customDateTo).getTime() + 86400000),
            };
          }
          return null;
        default:
          return null;
      }
    },
    [customDateFrom, customDateTo]
  );

  // Client-side filtering function
  const applyFilters = useCallback(
    (customers: DueCustomer[]) => {
      let filtered = customers;

      // Apply date filtering
      if (dateFilterType !== "all") {
        const dateRange = getDateRange(dateFilterType);
        if (dateRange) {
          filtered = filtered.filter((customer) => {
            return customer.due_payments.some((payment) => {
              const paymentDate = new Date(payment.due_date);
              return (
                paymentDate >= dateRange.start && paymentDate < dateRange.end
              );
            });
          });
        }
      }

      return filtered;
    },
    [dateFilterType, getDateRange]
  );

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await ApiService.get("/auth/profile/");
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  // Fetch due customers from API (only handles API calls)
  const fetchDueCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: {
        search?: string;
      } = {};

      if (searchTerm) params.search = searchTerm;

      const response = await customersAPI.getDuebookCustomers(params);
      setDueCustomers(response.customers);
    } catch (error) {
      console.error("Failed to fetch due customers:", error);
      // Fallback to empty state
      setDueCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Fetch due payment history
  const fetchDueHistory = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoadingHistory(true);
        setHistoryError(null);
      } else {
        setHistoryPagination(prev => ({ ...prev, isLoadingMore: true }));
      }

      console.log('Fetching due history - Page:', page);
      const response = await ApiService.get(`/due-payments/?page=${page}&page_size=20`);
      console.log('Due history response:', response);
      
      if (response.results) {
        setDueHistory(prev => append ? [...prev, ...response.results] : response.results);
        setHistoryPagination({
          hasNext: !!response.next,
          currentPage: page,
          isLoadingMore: false,
        });
        setHistoryError(null);
      } else if (Array.isArray(response)) {
        setDueHistory(prev => append ? [...prev, ...response] : response);
        setHistoryPagination({
          hasNext: false,
          currentPage: page,
          isLoadingMore: false,
        });
        setHistoryError(null);
      } else {
        // Unexpected response format
        console.warn('Unexpected response format:', response);
        setHistoryError('Received unexpected data format from server');
      }
    } catch (error: any) {
      console.error("Failed to fetch due history:", error);
      console.error("Error details:", error.message, error.details);
      const errorMessage = error.message || 'Failed to load payment history';
      setHistoryError(errorMessage);
      if (!append) {
        setDueHistory([]);
      }
      setHistoryPagination({
        hasNext: false,
        currentPage: 1,
        isLoadingMore: false,
      });
    } finally {
      if (!append) setIsLoadingHistory(false);
      else setHistoryPagination(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, []); // Remove dueHistory from dependencies

  const loadMoreHistory = () => {
    if (!historyPagination.isLoadingMore && historyPagination.hasNext) {
      fetchDueHistory(historyPagination.currentPage + 1, true);
    }
  };

  // Initial load
  useEffect(() => {
    if (isMounted) {
      fetchUserProfile();
      fetchDueCustomers();
    }
  }, [isMounted, fetchUserProfile, fetchDueCustomers]);

  // Fetch history when tab changes
  useEffect(() => {
    if (isMounted && activeTab === 'history') {
      console.log('Tab switched to history, fetching data...');
      fetchDueHistory();
    }
  }, [isMounted, activeTab]); // Only depend on activeTab, not fetchDueHistory

  // Apply filters whenever data or filter criteria change (with small debounce for smoother UX)
  useEffect(() => {
    const filterTimer = setTimeout(() => {
      if (dueCustomers.length > 0) {
        const filtered = applyFilters(dueCustomers);
        setFilteredCustomers(filtered);

        // Calculate total due amount for filtered customers
        const totalDue = filtered.reduce(
          (sum, customer) => sum + customer.total_due,
          0
        );
        setTotalDueAmount(totalDue);
      } else {
        setFilteredCustomers([]);
        setTotalDueAmount(0);
      }
    }, 50); // Small delay to prevent rapid re-filtering

    return () => clearTimeout(filterTimer);
  }, [dueCustomers, applyFilters]);

  // Refetch when search term changes (with debounce)
  useEffect(() => {
    if (isMounted) {
      const debounceTimer = setTimeout(() => {
        fetchDueCustomers();
      }, 300); // Debounce search

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, isMounted, fetchDueCustomers]);

  const formatCurrencyDynamic = useCurrencyFormatter();

  const formatCurrency = (amount: number) => {
    return formatCurrencyDynamic(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalDue = () => {
    return totalDueAmount;
  };

  const handleSendSMS = (customer: DueCustomer) => {
    const storeName = userProfile?.profile?.company;
    const dueAmount = customer.total_due || 0;
    
    // Debug logging
    console.log("User Profile:", userProfile);
    console.log("Store Name:", storeName);
    
    const defaultMessage = `সম্মানিত কাস্টমার, আমাদের খাতায় আপনার ${dueAmount} টাকা বাকি রয়েছে, দয়া করে পরিশোধ করুন${storeName ? ` (${storeName})` : ''}`;
    
    console.log("SMS Message:", defaultMessage);
    
    setSmsCustomer(customer);
    setSmsMessage(defaultMessage);
    setShowSmsComposer(true);
  };

  const handleSendSmsFromComposer = async (message: string) => {
    if (!smsCustomer) return;
    
    setIsSendingSms(true);
    try {
      console.log("Sending SMS to:", smsCustomer.phone);
      console.log("Message:", message);
      
      const response = await ApiService.sendSmsNotification(smsCustomer.phone, message);
      
      console.log("SMS Response:", response);
      
      if (response.success) {
        alert("SMS sent successfully!");
        setShowSmsComposer(false);
      } else {
        alert(`SMS Error: ${response.error || "Failed to send SMS"}`);
      }
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      console.error("Error response:", error.response?.data);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.error || error.message || "Failed to send SMS. Please try again.";
      alert(`SMS Error: ${errorMessage}`);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleCancelSms = () => {
    setShowSmsComposer(false);
    setSmsCustomer(null);
    setSmsMessage("");
  };

  const exportToCSV = () => {
    if (!isMounted) return;

    const headers = [
      "Customer Name",
      "Email",
      "Phone",
      "Due Amount",
      "Number of Payments",
      "Payment Details",
    ];
    const csvData = filteredCustomers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone,
      customer.total_due.toFixed(2),
      customer.due_payments.length,
      customer.due_payments
        .map(
          (p) =>
            `Order #${p.order_id}: $${p.amount} (Due: ${formatDate(
              p.due_date
            )})`
        )
        .join("; "),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `due-book-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!isMounted) return;

    // Create a simple HTML structure for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Due Book Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .amount { text-align: right; font-weight: bold; color: #dc2626; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Due Book Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h3>Summary</h3>
          <p><strong>Total Customers with Due:</strong> ${
            filteredCustomers.length
          }</p>
          <p><strong>Total Due Amount:</strong> ${formatCurrency(
            getTotalDue()
          )}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Due Amount</th>
              <th>Payments</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCustomers
              .map(
                (customer) => `
              <tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td class="amount">${formatCurrency(customer.total_due)}</td>
                <td>${customer.due_payments.length} payment${
                  customer.due_payments.length !== 1 ? "s" : ""
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>This report contains ${
            filteredCustomers.length
          } customers with outstanding due payments.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-48 mb-4"></div>
          <div className="flex gap-3 mb-4 max-w-4xl">
            <div className="h-16 bg-slate-700 rounded-lg w-48"></div>
            <div className="h-16 bg-slate-700 rounded-lg w-48"></div>
          </div>
          <div className="h-64 bg-slate-700 rounded-lg max-w-4xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Due Book</h1>
        <p className="text-slate-400 mt-1">Manage customer due payments</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('customers')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'customers'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Due Customers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'history'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Due & Payment History</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Due Customers Tab */}
      {activeTab === 'customers' && (
        <div className="max-w-7xl">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100 mb-1">
                    Due Customers
                  </h3>
                  <p className="text-sm text-slate-400">
                    {filteredCustomers.length} customers with outstanding dues
                  </p>
                </div>
              </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-60 pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Date Filter Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Date Filter
                  </label>
                  <select
                    value={dateFilterType}
                    onChange={(e) =>
                      setDateFilterType(
                        e.target.value as
                          | "all"
                          | "today"
                          | "yesterday"
                          | "this_week"
                          | "last_week"
                          | "this_month"
                          | "last_month"
                          | "this_year"
                          | "custom"
                      )
                    }
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Custom Date Range */}
                {dateFilterType === "custom" && (
                  <div className="flex space-x-2">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        From
                      </label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        To
                      </label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Active Filters Summary */}
                {dateFilterType !== "all" && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/20 rounded-lg border border-slate-700/30">
                    <span className="text-xs text-slate-400 font-medium">
                      Active Filter:
                    </span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
                      Date: {dateFilterType.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => {
                        setDateFilterType("all");
                        setCustomDateFrom("");
                        setCustomDateTo("");
                      }}
                      className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full hover:bg-red-500/30 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {/* Export Buttons */}
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  title="Export to PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {filteredCustomers.length > 0 ? (
            <>
              {/* Results Counter */}
              <div className="px-6 py-2 bg-slate-700/30 border-b border-white/5">
                <p className="text-xs text-slate-400">
                  Showing {filteredCustomers.length} of {dueCustomers.length}{" "}
                  customers
                  {dateFilterType !== "all" &&
                    ` • Filtered by: ${dateFilterType.replace("_", " ")}`}
                </p>
              </div>

              {/* Table Header */}
              <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3">Customer</div>
                  <div className="col-span-3">Contact Info</div>
                  <div className="col-span-2">Due Amount</div>
                  <div className="col-span-2">Payments</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="px-6 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {customer.name}
                        </Link>
                      </div>
                      <div className="col-span-3">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center space-x-1 text-xs text-slate-300">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center space-x-1 text-xs text-slate-300">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {!customer.email && !customer.phone && (
                            <div className="text-xs text-slate-500 italic">
                              No contact info
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-semibold text-red-300">
                          {formatCurrency(customer.total_due)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-400">
                          {customer.due_payments.length} payment
                          {customer.due_payments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </Link>
                          <button
                            onClick={() => handleSendSMS(customer)}
                            className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors cursor-pointer"
                            title="Send Due Payment SMS"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>SMS</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-400 mb-2">
                No Due Customers Found
              </h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search terms.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Due & Payment History Tab */}
      {activeTab === 'history' && (
        <div className="max-w-7xl space-y-6">
          {/* Current Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-xs font-medium uppercase tracking-wide">Outstanding Due</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">
                    {formatCurrency(
                      dueHistory
                        .filter((p: any) => p.payment_type === 'due' && p.status !== 'paid')
                        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-xs font-medium uppercase tracking-wide">Total Paid</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">
                    {formatCurrency(
                      dueHistory
                        .filter((p: any) => p.status === 'paid')
                        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400 text-xs font-medium uppercase tracking-wide">Total Records</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">
                    {dueHistory.length}
                  </p>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-1">
                  Payment History
                </h3>
                <p className="text-sm text-slate-400">
                  Complete history of all due payments and transactions
                </p>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading payment history...</p>
                </div>
              </div>
            ) : historyError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4 inline-block">
                    <FileText className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-red-400 mb-2">
                      Failed to Load History
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-md">
                      {historyError}
                    </p>
                    <button
                      onClick={() => fetchDueHistory(1, false)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            ) : dueHistory && dueHistory.length > 0 ? (
              <>
                {/* Table Header */}
                <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700/50">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-2">Order ID</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-700/30">
                  {dueHistory.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="px-6 py-4 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2">
                          <p className="text-sm text-slate-300">
                            {payment.due_date ? formatDate(payment.due_date) : formatDate(payment.created_at)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <Link
                            href={`/dashboard/customers/${payment.customer}`}
                            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {payment.customer_name || `Customer #${payment.customer}`}
                          </Link>
                        </div>
                        <div className="col-span-2">
                          {payment.order ? (
                            <Link
                              href={`/dashboard/orders/${payment.order}`}
                              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              #{payment.order}
                            </Link>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </div>
                        <div className="col-span-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.payment_type === 'due' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {payment.payment_type}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <p className={`text-sm font-semibold ${
                            payment.payment_type === 'due' ? 'text-red-300' : 'text-green-300'
                          }`}>
                            {formatCurrency(Math.abs(payment.amount))}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'paid' 
                              ? 'bg-green-500/20 text-green-400'
                              : payment.status === 'partially_paid'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : payment.status === 'overdue'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <Link
                            href={`/dashboard/customers/${payment.customer}`}
                            className="flex items-center text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="mt-2 text-xs text-slate-500">
                          Note: {payment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {historyPagination.hasNext && (
                  <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
                    <button
                      onClick={loadMoreHistory}
                      disabled={historyPagination.isLoadingMore}
                      className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-100 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-slate-600/50"
                    >
                      {historyPagination.isLoadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading More...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span>Load More History</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-400 mb-2">
                  No Payment History Found
                </h3>
                <p className="text-sm text-slate-500">
                  Payment history will appear here once transactions are recorded.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS Composer Modal */}
      {showSmsComposer && smsCustomer && (
        <SmsComposer
          recipientPhone={smsCustomer.phone || ""}
          recipientName={smsCustomer.name}
          initialMessage={smsMessage}
          onSend={handleSendSmsFromComposer}
          onCancel={handleCancelSms}
          isLoading={isSendingSms}
        />
      )}
    </div>
  );
}
