"use client";

import SmsComposer from "@/components/sms/SmsComposer";
import { useToast } from "@/components/ui/Feedback";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { customersAPI, DueCustomer } from "@/lib/api/customers";
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

// Presentation-only labels for the date filter values
const DATE_FILTER_LABELS: Record<string, string> = {
  all: "সব সময়",
  today: "আজ",
  yesterday: "গতকাল",
  this_week: "এই সপ্তাহ",
  last_week: "গত সপ্তাহ",
  this_month: "এই মাস",
  last_month: "গত মাস",
  this_year: "এই বছর",
  custom: "নিজের মতো তারিখ",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "পরিশোধ",
  partially_paid: "আংশিক পরিশোধ",
  overdue: "মেয়াদ পেরিয়েছে",
  pending: "বাকি আছে",
};

export default function DueBookPage() {
  const toast = useToast();
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
        setHistoryError('সার্ভার থেকে অন্যরকম তথ্য এসেছে');
      }
    } catch (error: any) {
      console.error("Failed to fetch due history:", error);
      console.error("Error details:", error.message, error.details);
      const errorMessage = error.message || 'বাকি ও পরিশোধের হিসাব লোড করা যায়নি';
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

  // Apply filters whenever data or filter criteria change (with debounce for smoother UX)
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
    }, 200); // Optimized filter timing for smooth UX

    return () => clearTimeout(filterTimer);
  }, [dueCustomers, applyFilters]);

  // Refetch when search term changes (with debounce)
  useEffect(() => {
    if (isMounted) {
      const debounceTimer = setTimeout(() => {
        fetchDueCustomers();
      }, 400); // Standardized debounce to 400ms for consistent UX

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, isMounted, fetchDueCustomers]);

// ... (rest of the code remains the same)
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
        toast.success("এসএমএস পাঠানো হয়ে গেছে!");
        setShowSmsComposer(false);
      } else {
        toast.error(`এসএমএস সমস্যা: ${response.error || "এসএমএস পাঠানো যায়নি"}`);
      }
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      console.error("Error response:", error.response?.data);

      // Show more specific error message
      const errorMessage = error.response?.data?.error || error.message || "এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।";
      toast.error(`এসএমএস সমস্যা: ${errorMessage}`);
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
      "কাস্টমারের নাম",
      "ইমেইল",
      "ফোন",
      "বাকির পরিমাণ",
      "কয়টা বাকি",
      "বাকির বিস্তারিত",
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
            `অর্ডার #${p.order_id}: $${p.amount} (তারিখ: ${formatDate(
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
        <title>বাকির খাতা</title>
        <style>
          body { font-family: 'Inter', 'Hind Siliguri', Arial, sans-serif; margin: 20px; }
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
          <h1>বাকির খাতা</h1>
          <p>তারিখ: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary">
          <h3>সারসংক্ষেপ</h3>
          <p><strong>বাকি আছে এমন কাস্টমার:</strong> ${
            filteredCustomers.length
          }</p>
          <p><strong>মোট বাকি:</strong> ${formatCurrency(
            getTotalDue()
          )}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>কাস্টমারের নাম</th>
              <th>ইমেইল</th>
              <th>ফোন</th>
              <th>বাকির পরিমাণ</th>
              <th>কয়টা বাকি</th>
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
                <td>${customer.due_payments.length} টা</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>এই তালিকায় ${
            filteredCustomers.length
          } জন কাস্টমারের বাকি রয়েছে।</p>
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
      <div className="page">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-48 rounded bg-slate-100"></div>
          <div className="h-64 rounded-xl bg-slate-100"></div>
        </div>
      </div>
    );
  }

  const outstandingDue = dueHistory
    .filter((p: any) => p.payment_type === 'due' && p.status !== 'paid')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
  const totalPaid = dueHistory
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">বাকির খাতা</h1>
          <p className="page-sub">কার কত বাকি আর কে কত দিলো</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            className="btn btn-ghost"
            title="CSV ফাইলে নামান"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-ghost"
            title="PDF ফাইলে নামান"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </header>

      <div className="plane">
        {/* Tabs */}
        <div className="plane-section flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`btn btn-sm ${
              activeTab === 'customers' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <User className="h-3.5 w-3.5" /> বাকি আছে যাদের
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn btn-sm ${
              activeTab === 'history' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> বাকি ও পরিশোধের হিসাব
          </button>
        </div>

        {/* Due customers tab */}
        {activeTab === 'customers' && (
          <>
            <div className="stat-strip">
              <div className="stat">
                <div className="stat-label">মোট বাকি</div>
                <div className="stat-value money-neg">
                  {formatCurrency(getTotalDue())}
                </div>
                <div className="stat-meta">এখন যা আদায় বাকি</div>
              </div>
              <div className="stat">
                <div className="stat-label">বাকি আছে যাদের</div>
                <div className="stat-value num">{filteredCustomers.length}</div>
                <div className="stat-meta">
                  মোট {dueCustomers.length} জনের মধ্যে
                </div>
              </div>
            </div>

            <div className="plane-section">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="কাস্টমারের নাম দিয়ে খুঁজুন"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-9"
                    aria-label="কাস্টমার খুঁজুন"
                  />
                </div>

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
                  className="select w-auto"
                  aria-label="তারিখ দিয়ে ফিল্টার"
                >
                  <option value="all">সব সময়</option>
                  <option value="today">আজ</option>
                  <option value="yesterday">গতকাল</option>
                  <option value="this_week">এই সপ্তাহ</option>
                  <option value="last_week">গত সপ্তাহ</option>
                  <option value="this_month">এই মাস</option>
                  <option value="last_month">গত মাস</option>
                  <option value="this_year">এই বছর</option>
                  <option value="custom">নিজের মতো তারিখ</option>
                </select>

                {dateFilterType === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="input w-auto"
                      aria-label="শুরুর তারিখ"
                    />
                    <span className="text-sm text-slate-500">থেকে</span>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="input w-auto"
                      aria-label="শেষ তারিখ"
                    />
                  </div>
                )}

                {dateFilterType !== "all" && (
                  <>
                    <span className="badge badge-info">
                      {DATE_FILTER_LABELS[dateFilterType]}
                    </span>
                    <button
                      onClick={() => {
                        setDateFilterType("all");
                        setCustomDateFrom("");
                        setCustomDateTo("");
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      ফিল্টার মুছে দিন
                    </button>
                  </>
                )}
              </div>
            </div>

            {filteredCustomers.length > 0 ? (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>কাস্টমার</th>
                      <th>যোগাযোগ</th>
                      <th className="cell-num">বাকি</th>
                      <th className="cell-num">কয়টা</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="cell-strong">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="text-cyan-600 hover:text-cyan-700"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td>
                          {customer.email && (
                            <span className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span className="truncate" title={customer.email}>
                                {customer.email}
                              </span>
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center gap-1 text-xs num">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {customer.phone}
                            </span>
                          )}
                          {!customer.email && !customer.phone && (
                            <span className="text-xs text-slate-500">
                              যোগাযোগের তথ্য নেই
                            </span>
                          )}
                        </td>
                        <td className="cell-num money-neg font-semibold">
                          {formatCurrency(customer.total_due)}
                        </td>
                        <td className="cell-num">
                          {customer.due_payments.length}
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link
                              href={`/dashboard/customers/${customer.id}`}
                              className="btn btn-ghost btn-sm"
                            >
                              <Eye className="h-3.5 w-3.5" /> বিস্তারিত
                            </Link>
                            <button
                              onClick={() => handleSendSMS(customer)}
                              className="btn btn-ghost btn-sm"
                              title="বাকির এসএমএস পাঠান"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> এসএমএস
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">
                <DollarSign className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="mb-1 font-medium text-slate-600">
                  বাকি আছে এমন কাউকে পাওয়া যায়নি
                </p>
                <p className="text-sm">খোঁজা বা ফিল্টার একটু বদলে দেখুন।</p>
              </div>
            )}
          </>
        )}

        {/* Due & payment history tab */}
        {activeTab === 'history' && (
          <>
            <div className="stat-strip">
              <div className="stat">
                <div className="stat-label">আদায় বাকি</div>
                <div className="stat-value money-neg">
                  {formatCurrency(outstandingDue)}
                </div>
                <div className="stat-meta">এখনো পরিশোধ হয়নি</div>
              </div>
              <div className="stat">
                <div className="stat-label">মোট পরিশোধ</div>
                <div className="stat-value money-pos">
                  {formatCurrency(totalPaid)}
                </div>
                <div className="stat-meta">যা আদায় হয়েছে</div>
              </div>
              <div className="stat">
                <div className="stat-label">মোট এন্ট্রি</div>
                <div className="stat-value num">{dueHistory.length}</div>
                <div className="stat-meta">সব হিসাব মিলিয়ে</div>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="empty">হিসাব লোড হচ্ছে…</div>
            ) : historyError ? (
              <div className="empty">
                <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="mb-1 font-medium text-rose-600">
                  হিসাব লোড করা যায়নি
                </p>
                <p className="mb-3 text-sm">{historyError}</p>
                <button
                  onClick={() => fetchDueHistory(1, false)}
                  className="btn btn-ghost"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            ) : dueHistory && dueHistory.length > 0 ? (
              <>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>তারিখ</th>
                        <th>কাস্টমার</th>
                        <th>অর্ডার</th>
                        <th>টাইপ</th>
                        <th className="cell-num">টাকার পরিমাণ</th>
                        <th>অবস্থা</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dueHistory.map((payment: any) => (
                        <tr key={payment.id}>
                          <td className="whitespace-nowrap num">
                            {payment.due_date ? formatDate(payment.due_date) : formatDate(payment.created_at)}
                          </td>
                          <td className="cell-strong">
                            <Link
                              href={`/dashboard/customers/${payment.customer}`}
                              className="text-cyan-600 hover:text-cyan-700"
                            >
                              {payment.customer_name || `কাস্টমার #${payment.customer}`}
                            </Link>
                            {payment.notes && (
                              <span className="block text-xs text-slate-500">
                                নোট: {payment.notes}
                              </span>
                            )}
                          </td>
                          <td className="num">
                            {payment.order ? (
                              <Link
                                href={`/dashboard/orders/${payment.order}`}
                                className="text-cyan-600 hover:text-cyan-700"
                              >
                                #{payment.order}
                              </Link>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                payment.payment_type === 'due'
                                  ? 'badge-danger'
                                  : 'badge-success'
                              }`}
                            >
                              {payment.payment_type === 'due' ? 'বাকি' : 'পরিশোধ'}
                            </span>
                          </td>
                          <td
                            className={`cell-num font-semibold ${
                              payment.payment_type === 'due'
                                ? 'money-neg'
                                : 'money-pos'
                            }`}
                          >
                            {formatCurrency(Math.abs(payment.amount))}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                payment.status === 'paid'
                                  ? 'badge-success'
                                  : payment.status === 'partially_paid'
                                  ? 'badge-warn'
                                  : payment.status === 'overdue'
                                  ? 'badge-danger'
                                  : 'badge-info'
                              }`}
                            >
                              {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <Link
                              href={`/dashboard/customers/${payment.customer}`}
                              className="btn btn-ghost btn-sm"
                              aria-label="কাস্টমারের বিস্তারিত দেখুন"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {historyPagination.hasNext && (
                  <div className="plane-section flex justify-center">
                    <button
                      onClick={loadMoreHistory}
                      disabled={historyPagination.isLoadingMore}
                      className="btn btn-ghost"
                    >
                      {historyPagination.isLoadingMore
                        ? "লোড হচ্ছে…"
                        : "আরও দেখুন"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty">
                <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="mb-1 font-medium text-slate-600">
                  কোনো হিসাব পাওয়া যায়নি
                </p>
                <p className="text-sm">
                  লেনদেন হলে এখানে বাকি আর পরিশোধের হিসাব দেখাবে।
                </p>
              </div>
            )}
          </>
        )}
      </div>

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
