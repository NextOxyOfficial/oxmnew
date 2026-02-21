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

  return (
    <div className="space-y-6">
      {/* Header with Search and Create Button */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg font-medium text-slate-100">Suppliers</h4>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Add Supplier</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
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
              placeholder="Search suppliers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                title="Clear search"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
      </div>

      {/* Create Supplier Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto scrollbar-hide">
          <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4 sm:p-6 w-full max-w-md my-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-slate-100">
                {isEditing ? "Edit Supplier" : "Create New Supplier"}
              </h4>
              <button
                onClick={() =>
                  handleCancelSupplierForm
                    ? handleCancelSupplierForm()
                    : setShowCreateForm(false)
                }
                className="text-slate-400 hover:text-slate-300 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              {/* ...existing form fields... */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={supplierForm.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                  placeholder="Enter supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={supplierForm.address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                  placeholder="Enter supplier address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={supplierForm.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={supplierForm.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={supplierForm.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                  placeholder="supplier@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    handleCancelSupplierForm
                      ? handleCancelSupplierForm()
                      : setShowCreateForm(false)
                  }
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                    ? "Update Supplier"
                    : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Grid */}
      <div className="mt-4 sm:mt-6">
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-slate-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-400 mb-2">
            {searchTerm ? "No suppliers found" : "No suppliers yet"}
          </h3>
          <p className="text-slate-500">
            {searchTerm
              ? `No suppliers match "${searchTerm}"`
              : "Add your first supplier to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:bg-slate-800/50 transition-colors duration-200 relative"
          >
            <div className="space-y-3">
              {/* Header with three-dot menu */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h5 className="text-slate-100 font-medium text-sm truncate">
                    {supplier.name}
                  </h5>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                    {supplier.address}
                  </p>
                </div>

                {/* Three-dot menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(
                        activeDropdown === supplier.id ? null : supplier.id
                      );
                    }}
                    className="p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-colors duration-200 cursor-pointer"
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
                        d="M12 5v.01M12 12v.01M12 19v.01"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {activeDropdown === supplier.id && (
                    <div className="absolute right-0 top-8 w-44 sm:w-48 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onCreatePurchase(supplier);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer truncate overflow-hidden whitespace-nowrap"
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
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          Create Purchase
                        </button>
                        <button
                          onClick={() => {
                            onCreatePayment(supplier);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer truncate overflow-hidden whitespace-nowrap"
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
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          Create Payment
                        </button>
                        <div className="border-t border-slate-700/50 my-1"></div>
                        <button
                          onClick={() => {
                            onEditSupplier(supplier);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer truncate overflow-hidden whitespace-nowrap"
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
                          Edit Supplier
                        </button>
                        <button
                          onClick={() => {
                            onDeleteSupplier(supplier);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer truncate overflow-hidden whitespace-nowrap"
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
                          Delete Supplier
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ...existing supplier info... */}
              <div className="space-y-2 text-xs">
                <div
                  key={`${supplier.id}-phone`}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-3 h-3 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-slate-300 break-all">{supplier.phone}</span>
                </div>

                {supplier.email && (
                  <div
                    key={`${supplier.id}-email`}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <svg
                      className="w-3 h-3 text-slate-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-slate-300 truncate">{supplier.email}</span>
                  </div>
                )}

                {supplier.website && (
                  <div
                    key={`${supplier.id}-website`}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <svg
                      className="w-3 h-3 text-slate-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 truncate cursor-pointer"
                    >
                      {supplier.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700/50 pt-3 grid grid-cols-2 gap-3 text-xs">
                <div key={`${supplier.id}-orders`}>
                  <span className="text-slate-400">Purchase:</span>
                  <p className="text-slate-100 font-medium">
                    {supplier.total_orders ?? 0}
                  </p>
                </div>
                <div key={`${supplier.id}-amount`}>
                  <span className="text-slate-400">Amount:</span>
                  <p className="text-slate-100 font-medium">
                    {formatCurrency(supplier.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
      </div>

      {/* Search Results Count */}
      {searchTerm && filteredSuppliers.length > 0 && (
        <div className="text-sm text-slate-400">
          Found {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} matching "{searchTerm}"
        </div>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="mt-4 sm:mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading more...
              </>
            ) : (
              <>
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Load More Suppliers
              </>
            )}
          </button>
        </div>
      )}

      {/* Total Count */}
      {totalCount > 0 && !searchTerm && (
        <div className="mt-4 text-center text-sm text-slate-400">
          Showing {suppliers.length} of {totalCount} suppliers
        </div>
      )}
    </div>
  );
}
