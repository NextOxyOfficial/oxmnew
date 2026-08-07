"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { ApiService } from "@/lib/api";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Feedback";

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
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // Debounced search term for filtering
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
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
      return "তারিখ ঠিক নেই";
    }
  };

  // Debounced search - wait 500ms after user stops typing
  useEffect(() => {
    setIsSearching(true);
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setIsSearching(false);
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchInput]);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedCustomers = await ApiService.getCustomers({ page_size: 500 });

        // Ensure fetchedCustomers is an array
        if (Array.isArray(fetchedCustomers)) {
          setCustomers(fetchedCustomers);
        } else if (fetchedCustomers && Array.isArray(fetchedCustomers.data)) {
          // Handle case where data is wrapped in a data property
          setCustomers(fetchedCustomers.data);
        } else if (fetchedCustomers && Array.isArray(fetchedCustomers.results)) {
          // Handle paginated response format
          setCustomers(fetchedCustomers.results);
        } else {
          console.warn("Unexpected customers response format:", fetchedCustomers);
          setCustomers([]);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError(
          err instanceof Error ? err.message : "কাস্টমারের তালিকা আনা যায়নি"
        );
        setCustomers([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [filterStatus, sortBy]);

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
      setCustomers((prev) => Array.isArray(prev) ? [newCustomer, ...prev] : [newCustomer]);
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
        err instanceof Error ? err.message : "কাস্টমার যোগ করা যায়নি"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats with safety checks
  const totalCustomers = Array.isArray(customers) ? customers.length : 0;
  const activeCustomers = Array.isArray(customers)
    ? customers.filter((c) => c.status === "active").length
    : 0;
  const totalRevenue = Array.isArray(customers)
    ? customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0)
    : 0;

  // Handle view customer details
  const handleViewCustomer = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}`);
  };

  // Handle edit customer
  const handleEditCustomer = async (customer: Customer) => {
    try {
      setEditingCustomerId(customer.id);
      // Navigate to the customer details page
      await router.push(`/dashboard/customers/${customer.id}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset the editing state after navigation
      setTimeout(() => setEditingCustomerId(null), 1000);
    }
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
      setCustomers((prev) => Array.isArray(prev) ? prev.filter((c) => c.id !== customerToDelete.id) : []);
      setCustomerToDelete(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("কাস্টমার ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
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
      toast.error("নাম, ইমেইল আর ফোন — এই ঘরগুলো পূরণ করুন");
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
      toast.success("কাস্টমার যোগ হয়েছে!");
    } catch (err) {
      console.error("Error creating customer:", err);
      toast.error("কাস্টমার যোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter and sort customers with safety checks
  const filteredCustomers = Array.isArray(customers)
    ? customers
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
        })
    : [];

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কাস্টমার</h1>
            <p className="page-sub">লোড হচ্ছে…</p>
          </div>
        </header>

        <div className="plane">
          <div className="stat-strip">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="stat">
                <div className="animate-pulse">
                  <div className="h-3 w-24 rounded bg-slate-100"></div>
                  <div className="mt-2 h-6 w-16 rounded bg-slate-100"></div>
                  <div className="mt-2 h-3 w-20 rounded bg-slate-100"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="plane-section">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-full rounded bg-slate-100"></div>
              <div className="h-4 w-3/4 rounded bg-slate-100"></div>
              <div className="h-4 w-1/2 rounded bg-slate-100"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কাস্টমার</h1>
            <p className="page-sub">কিছু একটা সমস্যা হয়েছে</p>
          </div>
        </header>

        <div className="plane">
          <div className="plane-section text-center">
            <h3 className="text-base font-semibold text-slate-900">
              কাস্টমারের তালিকা লোড করা যায়নি
            </h3>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost mt-4"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page Header */}
      <header className="page-head">
        <div>
          <h1 className="page-title">কাস্টমার</h1>
          <p className="page-sub">
            ক্রেতাদের তালিকা আর কেনাকাটার হিসাব এক জায়গায়
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন কাস্টমার</span>
        </button>
      </header>

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট কাস্টমার</div>
            <div className="stat-value num">{totalCustomers}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>

          <div className="stat">
            <div className="stat-label">Active কাস্টমার</div>
            <div className="stat-value num">{activeCustomers}</div>
            <div className="stat-meta">এখনো কেনাকাটা করছেন</div>
          </div>

          <div className="stat">
            <div className="stat-label">মোট বিক্রি</div>
            <div className="stat-value num">{formatCurrency(totalRevenue)}</div>
            <div className="stat-meta">সব কাস্টমার মিলিয়ে</div>
          </div>
        </div>

        {/* Filters */}
        <div className="plane-section">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Search */}
            <div className="w-full sm:max-w-xs">
              <div className="relative">
                <Search
                  className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                    searchFocused ? "text-cyan-600" : "text-slate-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="input pl-9 pr-9"
                />
                {/* Loading spinner while searching */}
                {isSearching && searchInput && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                  </div>
                )}
                {/* Clear button */}
                {searchInput && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
                    title="খোঁজা মুছে দিন"
                    aria-label="খোঁজা মুছে দিন"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select w-full sm:w-auto"
              aria-label="অবস্থা অনুযায়ী ফিল্টার"
            >
              <option value="all">সব অবস্থা</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select w-full sm:w-auto"
              aria-label="সাজানোর নিয়ম"
            >
              <option value="name">নাম অনুযায়ী</option>
              <option value="orders-high">অর্ডার: বেশি থেকে কম</option>
              <option value="orders-low">অর্ডার: কম থেকে বেশি</option>
              <option value="spent-high">খরচ: বেশি থেকে কম</option>
              <option value="spent-low">খরচ: কম থেকে বেশি</option>
              <option value="recent">সাম্প্রতিক অর্ডার</option>
            </select>
          </div>

          {searchTerm && !isSearching && (
            <div className="mt-2 text-xs text-slate-500">
              {filteredCustomers.length} জন কাস্টমার পাওয়া গেছে
            </div>
          )}
          {isSearching && searchInput && (
            <div className="mt-2 text-xs text-cyan-600">খোঁজা হচ্ছে…</div>
          )}
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <div className="empty">
            <p className="font-medium text-slate-600">
              {searchTerm || filterStatus !== "all"
                ? "কিছু পাওয়া যায়নি"
                : "এখনো কোনো কাস্টমার নেই"}
            </p>
            <p className="mt-1 text-sm">
              {searchTerm || filterStatus !== "all"
                ? "খোঁজা বা ফিল্টার একটু বদলে দেখুন"
                : "প্রথম কাস্টমার যোগ করে শুরু করুন"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary mt-4"
              >
                <Plus className="h-4 w-4" />
                <span>প্রথম কাস্টমার যোগ করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>কাস্টমার</th>
                  <th>যোগাযোগ</th>
                  <th className="cell-num">অর্ডার</th>
                  <th className="cell-num">মোট খরচ</th>
                  <th>অবস্থা</th>
                  <th>শেষ অর্ডার</th>
                  <th className="cell-num">কাজ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="w-full text-left"
                      >
                        <div className="cell-strong flex items-center gap-2 hover:text-cyan-600">
                          <span className="text-xs font-normal text-slate-500 num">
                            #{customer.id}
                          </span>
                          <span
                            className="max-w-[14rem] truncate"
                            title={customer.name?.trim() || "নাম নেই"}
                          >
                            {customer.name?.trim() || "নাম নেই"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          কাস্টমার হয়েছেন {formatDate(customer.created_at)}
                        </div>
                      </button>
                    </td>
                    <td>
                      <div className="max-w-[16rem] truncate" title={customer.email}>
                        {customer.email}
                      </div>
                      <div className="text-slate-500 num">{customer.phone}</div>
                      {customer.address && (
                        <div
                          className="max-w-[16rem] truncate text-xs text-slate-500"
                          title={customer.address}
                        >
                          {customer.address}
                        </div>
                      )}
                    </td>
                    <td className="cell-num">{customer.total_orders || 0}</td>
                    <td className="cell-num money-pos">
                      {formatCurrency(customer.total_spent || 0)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          customer.status === "active"
                            ? "badge-success"
                            : "badge-muted"
                        }`}
                      >
                        {customer.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {customer.last_order_date
                        ? formatDate(customer.last_order_date)
                        : "অর্ডার নেই"}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCustomer(customer);
                          }}
                          className="btn btn-ghost btn-sm"
                          title="বিস্তারিত দেখুন"
                          aria-label="বিস্তারিত দেখুন"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                          disabled={editingCustomerId === customer.id}
                          className="btn btn-ghost btn-sm"
                          title="এডিট করুন"
                          aria-label="এডিট করুন"
                        >
                          {editingCustomerId === customer.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></div>
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteConfirmation(customer);
                          }}
                          className="btn btn-ghost btn-sm text-rose-600"
                          title="ডিলিট করুন"
                          aria-label="ডিলিট করুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="plane-section">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(pageSize) => {
              setItemsPerPage(pageSize);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">কাস্টমার ডিলিট করবেন?</h2>
              <button
                onClick={cancelDelete}
                className="text-slate-400 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                &quot;{customerToDelete.name}&quot; কে ডিলিট করে দেবেন? একবার
                ডিলিট হলে আর ফেরানো যাবে না — অর্ডারের হিসাবসহ কাস্টমারের সব
                তথ্য মুছে যাবে।
              </p>
            </div>
            <div className="modal-foot">
              <button onClick={cancelDelete} className="btn btn-ghost">
                বাতিল
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? "ডিলিট হচ্ছে…" : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={handleCloseCreateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">নতুন কাস্টমার যোগ করুন</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-slate-400 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Customer Name */}
                <div className="sm:col-span-2">
                  <label className="label">কাস্টমারের নাম *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="input"
                    placeholder="কাস্টমারের নাম লিখুন"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="label">ইমেইল *</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        email: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="ইমেইল লিখুন"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="label">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        phone: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="ফোন নম্বর লিখুন"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="label">ঠিকানা</label>
                  <textarea
                    rows={3}
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: e.target.value,
                      })
                    }
                    className="textarea resize-none"
                    placeholder="ঠিকানা লিখুন (না দিলেও চলবে)"
                  />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={handleCloseCreateModal} className="btn btn-ghost">
                বাতিল
              </button>
              <button
                onClick={handleCreateButtonClick}
                disabled={
                  isCreating ||
                  !newCustomer.name ||
                  !newCustomer.email ||
                  !newCustomer.phone
                }
                className="btn btn-primary"
              >
                {isCreating ? "সেভ হচ্ছে…" : "কাস্টমার সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
