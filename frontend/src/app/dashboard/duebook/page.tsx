"use client";

import { useState, useEffect } from "react";
import { Search, User, DollarSign, Eye, MessageSquare, Phone, Mail, Download, FileText, Calendar } from "lucide-react";
import Link from "next/link";

interface DueCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_due: number;
  due_payments: DuePayment[];
}

interface DuePayment {
  id: number;
  order_id: number;
  amount: number;
  due_date: string;
  notes?: string;
}

export default function DueBookPage() {
  const [dueCustomers, setDueCustomers] = useState<DueCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<DueCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"all" | "due_today" | "due_this_week" | "custom">("all");
  const [isMounted, setIsMounted] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const mockData: DueCustomer[] = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main St, New York, NY 10001",
        total_due: 450.00,
        due_payments: [
          { id: 1, order_id: 1001, amount: 250.00, due_date: "2025-01-15", notes: "First installment" },
          { id: 2, order_id: 1002, amount: 200.00, due_date: "2025-02-01", notes: "Second installment" }
        ]
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+1 (555) 234-5678",
        address: "456 Oak Ave, Los Angeles, CA 90210",
        total_due: 180.00,
        due_payments: [
          { id: 3, order_id: 1003, amount: 180.00, due_date: "2025-02-01", notes: "Monthly payment plan" }
        ]
      },
      {
        id: 3,
        name: "Bob Wilson",
        email: "bob@example.com",
        phone: "+1 (555) 345-6789",
        address: "789 Pine St, Chicago, IL 60601",
        total_due: 320.00,
        due_payments: [
          { id: 4, order_id: 1004, amount: 320.00, due_date: "2025-01-30" }
        ]
      },
      {
        id: 4,
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "+1 (555) 456-7890",
        address: "321 Elm Dr, Miami, FL 33101",
        total_due: 150.00,
        due_payments: [
          { id: 5, order_id: 1005, amount: 150.00, due_date: "2024-12-30", notes: "Overdue payment" }
        ]
      },
      {
        id: 5,
        name: "Charlie Brown",
        email: "charlie@example.com",
        phone: "+1 (555) 567-8901",
        address: "654 Maple Ln, Seattle, WA 98101",
        total_due: 275.00,
        due_payments: [
          { id: 6, order_id: 1006, amount: 125.00, due_date: "2025-01-25" },
          { id: 7, order_id: 1007, amount: 150.00, due_date: "2025-02-15" }
        ]
      }
    ];

    setDueCustomers(mockData);
    setFilteredCustomers(mockData);
    setIsLoading(false);
  }, []);

  // Filter customers based on search and date
  useEffect(() => {
    if (!isMounted) return;
    
    let filtered = dueCustomers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    // Apply date filter
    if (dateFilterType !== "all") {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(today.getDate() + 7);
      const oneWeekStr = oneWeekFromNow.toISOString().split('T')[0];

      filtered = filtered.filter(customer => {
        return customer.due_payments.some(payment => {
          const paymentDate = payment.due_date;
          
          switch (dateFilterType) {
            case "due_today":
              return paymentDate === todayStr;
            case "due_this_week":
              return paymentDate >= todayStr && paymentDate <= oneWeekStr;
            case "custom":
              return dateFilter ? paymentDate === dateFilter : true;
            default:
              return true;
          }
        });
      });
    }

    setFilteredCustomers(filtered);
  }, [dueCustomers, searchTerm, dateFilterType, dateFilter, isMounted]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalDue = () => {
    return dueCustomers.reduce((sum, customer) => sum + customer.total_due, 0);
  };

  const handleSendSMS = (customer: DueCustomer) => {
    alert(`SMS notification sent to ${customer.name} (${customer.phone})`);
  };

  const exportToCSV = () => {
    if (!isMounted) return;
    
    const headers = ['Customer Name', 'Email', 'Phone', 'Due Amount', 'Number of Payments', 'Payment Details'];
    const csvData = filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.total_due.toFixed(2),
      customer.due_payments.length,
      customer.due_payments.map(p => `Order #${p.order_id}: $${p.amount} (Due: ${formatDate(p.due_date)})`).join('; ')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `due-book-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
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
          <p><strong>Total Customers with Due:</strong> ${filteredCustomers.length}</p>
          <p><strong>Total Due Amount:</strong> ${formatCurrency(getTotalDue())}</p>
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
            ${filteredCustomers.map(customer => `
              <tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td class="amount">${formatCurrency(customer.total_due)}</td>
                <td>${customer.due_payments.length} payment${customer.due_payments.length !== 1 ? 's' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report contains ${filteredCustomers.length} customers with outstanding due payments.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
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
              <p className="text-xl font-bold text-white mt-1">{dueCustomers.length}</p>
            </div>
            <User className="h-7 w-7 text-blue-400" />
          </div>
        </div>

        {/* Total Due Amount */}
        <div className="bg-gradient-to-br from-red-500/10 to-pink-600/10 border border-red-500/30 rounded-lg p-3 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300/80 text-sm">Total Due Amount</p>
              <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(getTotalDue())}</p>
            </div>
            <DollarSign className="h-7 w-7 text-red-400" />
          </div>
        </div>
      </div>

      {/* Due Customers List */}
      <div className="max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100">Due Customers List</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
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
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as any)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="due_today">Due Today</option>
                  <option value="due_this_week">Due This Week</option>
                  <option value="custom">Custom Date</option>
                </select>
                
                {/* Custom Date Input */}
                {dateFilterType === "custom" && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                  Showing {filteredCustomers.length} of {dueCustomers.length} customers
                  {dateFilterType !== "all" && ` • Filtered by: ${dateFilterType.replace('_', ' ')}`}
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
                  <div key={customer.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
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
                          {customer.due_payments.length} payment{customer.due_payments.length !== 1 ? 's' : ''}
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
                            title="Send SMS notification"
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
              <h3 className="text-base font-medium text-slate-400 mb-2">No Due Customers Found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}