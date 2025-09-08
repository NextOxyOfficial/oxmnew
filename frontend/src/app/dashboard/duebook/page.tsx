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

  // SMS Composer state
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsCustomer, setSmsCustomer] = useState<DueCustomer | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

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
      const data = await ApiService.get("/accounts/profile/");
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

  // Initial load
  useEffect(() => {
    if (isMounted) {
      fetchUserProfile();
      fetchDueCustomers();
    }
  }, [isMounted, fetchUserProfile, fetchDueCustomers]);

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

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3 mb-6 max-w-4xl">
        {/* Customers with Due */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/30 rounded-lg p-3 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300/80 text-sm">Customers with Due</p>
              <p className="text-xl font-bold text-white mt-1">
                {dueCustomers.length}
              </p>
            </div>
            <User className="h-7 w-7 text-blue-400" />
          </div>
        </div>

        {/* Total Due Amount */}
        <div className="bg-gradient-to-br from-red-500/10 to-pink-600/10 border border-red-500/30 rounded-lg p-3 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300/80 text-sm">Total Due Amount</p>
              <p className="text-xl font-bold text-red-400 mt-1">
                {formatCurrency(getTotalDue())}
              </p>
            </div>
            <DollarSign className="h-7 w-7 text-red-400" />
          </div>
        </div>
      </div>

      {/* Due Customers List */}
      <div className="max-w-7xl">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100">
                Due Customers List
              </h3>
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
                          <div className="flex items-center space-x-1 text-xs text-slate-300">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
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
