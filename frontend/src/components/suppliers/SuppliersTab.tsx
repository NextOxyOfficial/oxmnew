"use client";

import React, { useEffect, useState } from "react";

interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  created_at: string;
  updated_at: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  total_orders: number;
  total_amount: number;
}

interface SuppliersTabProps {
  suppliers: Supplier[];
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  supplierForm: {
    name: string;
    address: string;
    phone: string;
    website: string;
    email: string;
  };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCreateSupplier: (e: React.FormEvent) => Promise<void>;
  handleCancelSupplierForm?: () => void;
  isEditing?: boolean;
  loading: boolean;
  formatCurrency: (amount: number) => string;
  onCreatePurchase: (supplier: Supplier) => void;
  onCreatePayment: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  // Pagination props
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  onLoadMore?: () => void;
}

export default function SuppliersTab({
  suppliers,
  showCreateForm,
  setShowCreateForm,
  supplierForm,
  handleInputChange,
  handleCreateSupplier,
  handleCancelSupplierForm,
  isEditing = false,
  loading,
  formatCurrency,
  onCreatePurchase,
  onCreatePayment,
  onEditSupplier,
  onDeleteSupplier,
  hasNextPage = false,
  isLoadingMore = false,
  totalCount = 0,
  onLoadMore,
}: SuppliersTabProps) {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState(""); // Immediate input
  const [searchTerm, setSearchTerm] = useState(""); // Debounced search

  // Debounce search input for smooth UX
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 400); // Consistent 400ms debounce for optimal UX

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeDropdown]);

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(search) ||
      supplier.email?.toLowerCase().includes(search) ||
      supplier.phone.includes(search) ||
      supplier.address.toLowerCase().includes(search)
    );
  });

  const showFooter =
    (Boolean(searchTerm) && filteredSuppliers.length > 0) ||
    hasNextPage ||
    (totalCount > 0 && !searchTerm);

  return (
    <>
      {/* Search + add supplier */}
      <div className="plane-section">
        {/* One row at every width. The search box flexes (`flex-1 min-w-0`)
            instead of holding a fixed 320px, which is what pushed the add
            button onto its own line on a phone. */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="নাম, ফোন, ইমেইল বা ঠিকানা দিয়ে খুঁজুন"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input min-w-0 flex-1 sm:max-w-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="btn btn-ghost btn-sm shrink-0"
              title="খোঁজা বাদ দিন"
              aria-label="খোঁজা বাদ দিন"
            >
              {/* Room is tight on a phone once three controls share the row,
                  so the label collapses to its icon there. */}
              <svg
                className="h-4 w-4 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="hidden sm:inline">সাফ করুন</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary shrink-0 sm:ml-auto"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">নতুন সাপ্লায়ার</span>
            <span className="sm:hidden">নতুন</span>
          </button>
        </div>
      </div>

      {/* Create / edit supplier form */}
      {showCreateForm && (
        <div className="plane-section">
          <div className="section-title">
            {isEditing ? "সাপ্লায়ার এডিট করুন" : "নতুন সাপ্লায়ার"}
          </div>

          <form onSubmit={handleCreateSupplier} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">সাপ্লায়ারের নাম *</label>
                <input
                  type="text"
                  name="name"
                  value={supplierForm.name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="সাপ্লায়ারের নাম লিখুন"
                />
              </div>

              <div>
                <label className="label">ফোন নম্বর *</label>
                <input
                  type="tel"
                  name="phone"
                  value={supplierForm.phone}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="ফোন নম্বর লিখুন"
                />
              </div>

              <div>
                <label className="label">ওয়েবসাইট</label>
                <input
                  type="url"
                  name="website"
                  value={supplierForm.website}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="label">ইমেইল</label>
                <input
                  type="email"
                  name="email"
                  value={supplierForm.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="supplier@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">ঠিকানা *</label>
                <textarea
                  name="address"
                  value={supplierForm.address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="textarea resize-none"
                  placeholder="সাপ্লায়ারের ঠিকানা লিখুন"
                />
              </div>
            </div>

            <div className="row-actions">
              <button
                type="button"
                onClick={() =>
                  handleCancelSupplierForm
                    ? handleCancelSupplierForm()
                    : setShowCreateForm(false)
                }
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading
                  ? isEditing
                    ? "আপডেট হচ্ছে…"
                    : "সেভ হচ্ছে…"
                  : isEditing
                  ? "আপডেট করুন"
                  : "সাপ্লায়ার যোগ করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers table */}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>সাপ্লায়ার</th>
              <th>যোগাযোগ</th>
              <th className="cell-num">মোট অর্ডার</th>
              <th className="cell-num">মোট টাকা</th>
              <th>অবস্থা</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    {searchTerm
                      ? `“${searchTerm}” দিয়ে কোনো সাপ্লায়ার পাওয়া যায়নি`
                      : "এখনো কোনো সাপ্লায়ার যোগ করা হয়নি"}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="cell-strong">
                    <div
                      className="truncate max-w-[14rem]"
                      title={supplier.name}
                    >
                      {supplier.name}
                    </div>
                    {supplier.address && (
                      <div
                        className="text-xs text-slate-500 truncate max-w-[14rem]"
                        title={supplier.address}
                      >
                        {supplier.address}
                      </div>
                    )}
                  </td>

                  <td>
                    <div className="text-slate-600">{supplier.phone}</div>
                    {supplier.email && (
                      <div
                        className="text-xs text-slate-500 truncate max-w-[12rem]"
                        title={supplier.email}
                      >
                        {supplier.email}
                      </div>
                    )}
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-600 truncate max-w-[12rem] block"
                        title={supplier.website}
                      >
                        {supplier.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </td>

                  <td className="cell-num">{supplier.total_orders ?? 0}</td>

                  <td className="cell-num">
                    {formatCurrency(supplier.total_amount)}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        supplier.is_active ? "badge-success" : "badge-muted"
                      }`}
                    >
                      {supplier.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="text-right">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        aria-label="আরও কাজ"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(
                            activeDropdown === supplier.id ? null : supplier.id
                          );
                        }}
                        className="text-slate-500 hover:text-cyan-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01"
                          />
                        </svg>
                      </button>

                      {/* Dropdown menu */}
                      {activeDropdown === supplier.id && (
                        <div className="absolute right-0 top-6 z-10 w-48 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              onCreatePurchase(supplier);
                              setActiveDropdown(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                            নতুন কেনাকাটা
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onCreatePayment(supplier);
                              setActiveDropdown(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                            পেমেন্ট করুন
                          </button>
                          <div className="my-1 border-t border-slate-200"></div>
                          <button
                            type="button"
                            onClick={() => {
                              onEditSupplier(supplier);
                              setActiveDropdown(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                          >
                            <svg
                              className="h-4 w-4"
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
                            এডিট করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSupplier(supplier);
                              setActiveDropdown(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <svg
                              className="h-4 w-4"
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
                            ডিলিট করুন
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Counts + load more */}
      {showFooter && (
        <div className="plane-section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-500">
              {searchTerm && filteredSuppliers.length > 0 && (
                <span>
                  “{searchTerm}” দিয়ে {filteredSuppliers.length} টা সাপ্লায়ার
                  পাওয়া গেছে
                </span>
              )}
              {totalCount > 0 && !searchTerm && (
                <span>
                  {totalCount} টার মধ্যে {suppliers.length} টা সাপ্লায়ার দেখাচ্ছে
                </span>
              )}
            </div>

            {hasNextPage && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="btn btn-ghost"
              >
                {isLoadingMore ? "লোড হচ্ছে…" : "আরও সাপ্লায়ার দেখুন"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
