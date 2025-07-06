"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { ApiService } from "@/lib/api";

// Customer type (simplified to match the main API)
interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  active_gifts_count?: number;
  total_points?: number;
  created_at: string;
  updated_at: string;
}
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

// Import dev auth helper in development
if (process.env.NODE_ENV === "development") {
  import("@/lib/dev-auth");
}

export default function CustomersPage() {
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active" as const,
    notes: "",
  });

  // Ensure component is mounted before rendering dates
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    if (!mounted) return ""; // Return empty string during SSR
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedCustomers = await ApiService.getCustomers();
        setCustomers(fetchedCustomers);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch customers"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [searchTerm, filterStatus, sortBy]);

  const handleCreateCustomer = async (
    customerData: Omit<
      Customer,
      | "id"
      | "total_orders"
      | "total_spent"
      | "last_order_date"
      | "active_gifts_count"
      | "total_points"
      | "current_level"
      | "created_at"
      | "updated_at"
    >
  ) => {
    try {
      setIsLoading(true);
      const newCustomer = await ApiService.createCustomer(customerData);
      setCustomers((prev) => [newCustomer, ...prev]);
      setShowCreateModal(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "active" as const,
        notes: "",
      });
    } catch (err) {
      console.error("Error creating customer:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create customer"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const totalRevenue = customers.reduce(
    (sum, customer) => sum + (customer.total_spent || 0),
    0
  );

  // Handle view customer details
  const handleViewCustomer = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}`);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    // For now, just show an alert - can be replaced with navigation to edit form
    alert(
      `Edit customer: ${customer.name}\nThis would navigate to the edit form.`
    );
  };

  // Handle delete customer
  const showDeleteConfirmation = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setCustomerToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setIsDeleting(true);

      await ApiService.deleteCustomer(customerToDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      setCustomerToDelete(null);
      setShowDeleteModal(false);

      // Remove customer from list
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));

      // Close modal
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Failed to delete customer. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseCreateModal = () => {
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "active" as const,
      notes: "",
    });
    setShowCreateModal(false);
  };

  const handleCreateButtonClick = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      alert("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    try {
      setIsCreating(true);
      await handleCreateCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        status: newCustomer.status,
        notes: newCustomer.notes,
      });
      alert("Customer created successfully!");
    } catch (err) {
      console.error("Error creating customer:", err);
      alert("Failed to create customer. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchTerm));
      const matchesStatus =
        filterStatus === "all" || customer.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "orders-high":
          return (b.total_orders || 0) - (a.total_orders || 0);
        case "orders-low":
          return (a.total_orders || 0) - (b.total_orders || 0);
        case "spent-high":
          return (b.total_spent || 0) - (a.total_spent || 0);
        case "spent-low":
          return (a.total_spent || 0) - (b.total_spent || 0);
        case "recent":
          return (
            new Date(b.last_order_date || 0).getTime() -
            new Date(a.last_order_date || 0).getTime()
          );
        default:
          return 0;
      }
    });

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4"
                >
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Customers
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Customers
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your customer relationships and track purchase history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {/* Total Customers */}
          <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-cyan-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-300 font-medium">
                  Total Customers
                </p>
                <p className="text-base font-bold text-cyan-400">
                  {totalCustomers}
                </p>
                <p className="text-xs text-cyan-500 opacity-80">
                  All registered customers
                </p>
              </div>
            </div>
          </div>

          {/* Active Customers */}
          <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-green-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">
                  Active Customers
                </p>
                <p className="text-base font-bold text-green-400">
                  {activeCustomers}
                </p>
                <p className="text-xs text-green-500 opacity-80">
                  Recently active
                </p>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/8 border border-yellow-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-yellow-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-yellow-300 font-medium">
                  Total Revenue
                </p>
                <p className="text-base font-bold text-yellow-400">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-yellow-500 opacity-80">
                  From all customers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Add Customer Button and Search */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Add Customer Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer whitespace-nowrap flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>

              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm pl-10 pr-4"
                  />
                </div>
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[140px]"
              >
                <option value="all" className="bg-slate-800">
                  All Status
                </option>
                <option value="active" className="bg-slate-800">
                  Active
                </option>
                <option value="inactive" className="bg-slate-800">
                  Inactive
                </option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[180px]"
              >
                <option value="name" className="bg-slate-800">
                  Sort by Name
                </option>
                <option value="orders-high" className="bg-slate-800">
                  Orders: High to Low
                </option>
                <option value="orders-low" className="bg-slate-800">
                  Orders: Low to High
                </option>
                <option value="spent-high" className="bg-slate-800">
                  Spent: High to Low
                </option>
                <option value="spent-low" className="bg-slate-800">
                  Spent: Low to High
                </option>
                <option value="recent" className="bg-slate-800">
                  Recent Orders
                </option>
              </select>
            </div>
          </div>

          {/* Customer List */}
          <div className="mt-6">
            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="text-left w-full group"
                      >
                        <h4 className="text-slate-100 font-medium line-clamp-1 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                          {customer.name}
                        </h4>
                      </button>
                      <p className="text-slate-400 text-sm mt-1">
                        {customer.email}
                      </p>
                      <p className="text-slate-400 text-sm">{customer.phone}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.status === "active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {customer.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Orders</p>
                      <p className="text-sm font-medium text-slate-100">
                        {customer.total_orders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Spent</p>
                      <p className="text-sm font-medium text-green-400">
                        {formatCurrency(customer.total_spent || 0)}
                      </p>
                    </div>
                  </div>

                  {customer.last_order_date && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400">
                        Last Order:{" "}
                        {customer.last_order_date
                          ? formatDate(customer.last_order_date)
                          : "No orders"}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex space-x-2">
                    <button
                      key={`view-${customer.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCustomer(customer);
                      }}
                      className="flex-1 bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 p-2 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                      title="View Details"
                    >
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>View</span>
                    </button>
                    <button
                      key={`edit-${customer.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                      className="flex-1 text-slate-300 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                      title="Edit"
                    >
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      key={`delete-${customer.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(customer);
                      }}
                      className="flex-1 text-slate-300 hover:text-red-400 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                      title="Delete"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left">
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Customer Details
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Contact Info
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Orders & Spending
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Status
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Last Order
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-left group w-full"
                        >
                          <div className="text-sm font-medium text-slate-100 group-hover:text-cyan-400 cursor-pointer transition-colors">
                            {customer.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Customer since {formatDate(customer.created_at)}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-300">
                            {customer.email}
                          </div>
                          <div className="text-sm text-slate-400">
                            {customer.phone}
                          </div>
                          {customer.address && (
                            <div className="text-xs text-slate-400 line-clamp-1">
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-100">
                            {customer.total_orders || 0} orders
                          </div>
                          <div className="text-sm font-bold text-green-400">
                            {formatCurrency(customer.total_spent || 0)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            customer.status === "active"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {customer.status}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {customer.last_order_date ? (
                          <div className="text-sm text-slate-300">
                            {formatDate(customer.last_order_date)}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">
                            No orders
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCustomer(customer);
                            }}
                            className="bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer);
                            }}
                            className="text-slate-300 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Edit"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(customer);
                            }}
                            className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Delete"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* No customers found */}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No customers found
                </h3>
                <p className="text-slate-400 mb-4">
                  Try adjusting your search criteria or check back later for new
                  customers.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && customerToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Delete Customer
              </h3>
              <p className="text-slate-300 mb-4">
                Are you sure you want to delete &quot;{customerToDelete.name}
                &quot;? This action cannot be undone and will remove all
                customer data including order history.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Customer Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Create New Customer
                  </h2>
                  <button
                    onClick={handleCloseCreateModal}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter customer name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                      placeholder="Enter customer address (optional)"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateButtonClick}
                    disabled={
                      isCreating ||
                      !newCustomer.name ||
                      !newCustomer.email ||
                      !newCustomer.phone
                    }
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isCreating ? "Creating..." : "Register Customer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
